const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Run database migrations on startup
const { runMigrations } = require('./database/migrate');
runMigrations()
  .then(() => {
    console.log('✅ Database ready');
  })
  .catch((error) => {
    console.error('❌ Database migration failed:', error);
  });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for SSH keys
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from dist (production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// API Routes
app.use('/api', require('./routes'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve index.html for SPA (production)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Subscribe to subnet updates
  socket.on('subscribe:subnet', (subnetId) => {
    socket.join(`subnet:${subnetId}`);
    console.log(`Client ${socket.id} subscribed to subnet ${subnetId}`);
  });

  // Unsubscribe from subnet updates
  socket.on('unsubscribe:subnet', (subnetId) => {
    socket.leave(`subnet:${subnetId}`);
    console.log(`Client ${socket.id} unsubscribed from subnet ${subnetId}`);
  });

  // Subscribe to monitor updates
  socket.on('subscribe:monitor', (monitorId) => {
    socket.join(`monitor:${monitorId}`);
    console.log(`Client ${socket.id} subscribed to monitor ${monitorId}`);
  });

  // Unsubscribe from monitor updates
  socket.on('unsubscribe:monitor', (monitorId) => {
    socket.leave(`monitor:${monitorId}`);
    console.log(`Client ${socket.id} unsubscribed from monitor ${monitorId}`);
  });
});

// Make io available to routes
app.set('io', io);

// Initialize Terminal WebSocket
const TerminalWebSocket = require('./services/websocket/TerminalWebSocket');
const terminalWebSocket = new TerminalWebSocket(io);
app.set('terminalWebSocket', terminalWebSocket);

// Start auto-scan scheduler
const SubnetScheduler = require('./services/subnet/scheduler');
const subnetScheduler = new SubnetScheduler(io);
subnetScheduler.start().catch((error) => {
  console.error('❌ Failed to start subnet scheduler:', error);
});

// Start monitoring scheduler
const MonitorScheduler = require('./services/monitoring/scheduler');
const monitorScheduler = new MonitorScheduler(io);
monitorScheduler.start().catch((error) => {
  console.error('❌ Failed to start monitor scheduler:', error);
});

// Make schedulers available globally
app.set('subnetScheduler', subnetScheduler);
app.set('monitorScheduler', monitorScheduler);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Monipx server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🌐 API: http://localhost:${PORT}/api`);
  }
});

module.exports = { app, server, io };

