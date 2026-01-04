const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
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

// Initialize application after migrations complete
async function initializeApp() {
  try {
    // Check encryption key configuration
    const KeyEncryption = require('./services/ssh/KeyEncryption');
    if (!KeyEncryption.isSecure()) {
      console.error('');
      console.error('⚠️  ' + '='.repeat(70));
      console.error('⚠️  WARNING: SSH_ENCRYPTION_KEY NOT CONFIGURED!');
      console.error('⚠️  ' + '='.repeat(70));
      console.error('⚠️  SSH credentials will NOT be secure!');
      console.error('⚠️  Please set SSH_ENCRYPTION_KEY environment variable.');
      console.error('⚠️  Generate one with: openssl rand -base64 32');
      console.error('⚠️  ' + '='.repeat(70));
      console.error('');
    }

    // Run database migrations first
    const { runMigrations } = require('./database/migrate');
    console.log('🔄 Running database migrations...');
    await runMigrations();
    console.log('✅ Database ready');

    // Initialize Terminal WebSocket
    const TerminalWebSocket = require('./services/websocket/TerminalWebSocket');
    const terminalWebSocket = new TerminalWebSocket(io);
    app.set('terminalWebSocket', terminalWebSocket);

    // Start auto-scan scheduler
    const SubnetScheduler = require('./services/subnet/scheduler');
    const subnetScheduler = new SubnetScheduler(io);
    await subnetScheduler.start();

    // Start monitoring scheduler
    const MonitorScheduler = require('./services/monitoring/scheduler');
    const monitorScheduler = new MonitorScheduler(io);
    await monitorScheduler.start();

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
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    process.exit(1);
  }
}

// Start the application
initializeApp();

module.exports = { app, server, io };

