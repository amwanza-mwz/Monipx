const TerminalSession = require('../ssh/TerminalSession');

class TerminalWebSocket {
  constructor(io) {
    this.io = io;
    this.setupHandlers();
  }

  setupHandlers() {
    // Create a namespace for terminal connections
    const terminalNamespace = this.io.of('/terminal');

    terminalNamespace.on('connection', (socket) => {
      console.log(`🔌 Terminal WebSocket connected: ${socket.id}`);

      // Handle terminal connection request
      socket.on('terminal:connect', async (data) => {
        try {
          const { sessionId, sshSessionId, options } = data;

          console.log(`📺 Terminal connect request received`);
          console.log(`   Session ID: ${sessionId}`);
          console.log(`   SSH Session ID: ${sshSessionId}`);
          console.log(`   Options:`, JSON.stringify(options, null, 2));

          // Create terminal session
          console.log(`🔄 Creating terminal session...`);
          const connectionId = await TerminalSession.createSession(
            sessionId,
            sshSessionId,
            socket,
            options
          );

          console.log(`✅ Terminal session created with connection ID: ${connectionId}`);

          // Send success response
          socket.emit('terminal:connected', {
            sessionId,
            connectionId,
            success: true,
          });

          console.log(`✅ Terminal connected event sent to client: ${sessionId}`);
        } catch (error) {
          console.error(`❌ Terminal connection failed:`, error);
          console.error(`❌ Error stack:`, error.stack);
          socket.emit('terminal:error', {
            error: error.message,
          });
        }
      });

      // Handle terminal input (user typing)
      socket.on('terminal:input', (data) => {
        const { sessionId, input } = data;
        TerminalSession.sendData(sessionId, input);
      });

      // Handle terminal resize
      socket.on('terminal:resize', (data) => {
        const { sessionId, rows, cols } = data;
        TerminalSession.resize(sessionId, rows, cols);
      });

      // Handle terminal disconnect
      socket.on('terminal:disconnect', (data) => {
        const { sessionId } = data;
        console.log(`🔌 Terminal disconnect request: ${sessionId}`);
        TerminalSession.closeSession(sessionId);
      });

      // Handle socket disconnect
      socket.on('disconnect', () => {
        console.log(`🔌 Terminal WebSocket disconnected: ${socket.id}`);
        
        // Find and close all sessions for this socket
        const activeSessions = TerminalSession.getActiveSessions();
        for (const sessionId of activeSessions) {
          const session = TerminalSession.getSession(sessionId);
          if (session && session.socket.id === socket.id) {
            console.log(`🔌 Closing orphaned session: ${sessionId}`);
            TerminalSession.closeSession(sessionId);
          }
        }
      });

      // Handle ping/pong for keep-alive
      socket.on('terminal:ping', () => {
        socket.emit('terminal:pong');
      });
    });

    console.log('✅ Terminal WebSocket handlers initialized');
  }

  /**
   * Broadcast message to all connected terminals
   * @param {string} event - Event name
   * @param {object} data - Data to send
   */
  broadcast(event, data) {
    this.io.of('/terminal').emit(event, data);
  }

  /**
   * Send message to specific session
   * @param {string} sessionId - Session ID
   * @param {string} event - Event name
   * @param {object} data - Data to send
   */
  sendToSession(sessionId, event, data) {
    const session = TerminalSession.getSession(sessionId);
    if (session && session.socket) {
      session.socket.emit(event, data);
    }
  }

  /**
   * Get active connections count
   * @returns {number}
   */
  getActiveConnectionsCount() {
    return this.io.of('/terminal').sockets.size;
  }
}

module.exports = TerminalWebSocket;

