const TerminalSession = require('../ssh/TerminalSession');
const SSHSession = require('../../models/SSHSession');
const ActivityLog = require('../../models/ActivityLog');

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
          const { sessionId, sshSessionId, options, userId, username } = data;

          console.log(`\n${'='.repeat(80)}`);
          console.log(`📺 TERMINAL CONNECT REQUEST RECEIVED`);
          console.log(`${'='.repeat(80)}`);
          console.log(`   Tab/Session ID: ${sessionId}`);
          console.log(`   SSH Session ID: ${sshSessionId} (type: ${typeof sshSessionId})`);
          console.log(`   User ID: ${userId}, Username: ${username}`);
          console.log(`   Options:`, JSON.stringify(options, null, 2));
          console.log(`${'='.repeat(80)}\n`);

          // Validate sshSessionId
          if (!sshSessionId) {
            throw new Error('SSH Session ID is required');
          }

          // Get SSH session details for logging
          let sshSessionDetails = null;
          try {
            sshSessionDetails = await SSHSession.getById(sshSessionId);
          } catch (err) {
            console.warn('Could not get SSH session details for logging:', err.message);
          }

          // Create terminal session
          console.log(`🔄 Creating terminal session...`);
          const connectionId = await TerminalSession.createSession(
            sessionId,
            sshSessionId,
            socket,
            options
          );

          console.log(`✅ Terminal session created with connection ID: ${connectionId}`);

          // Log terminal connection activity
          try {
            await ActivityLog.log({
              userId: userId || null,
              username: username || 'unknown',
              action: ActivityLog.ACTIONS.CONNECT,
              category: ActivityLog.CATEGORIES.TERMINAL,
              resourceType: 'server',
              resourceId: sshSessionId,
              resourceName: sshSessionDetails ? `${sshSessionDetails.name} (${sshSessionDetails.host})` : `Session ${sshSessionId}`,
              details: {
                host: sshSessionDetails?.host,
                port: sshSessionDetails?.port,
                sshUsername: sshSessionDetails?.username,
                sessionId: sessionId,
              },
            });
            console.log(`📝 Activity logged: Terminal connect to ${sshSessionDetails?.host || sshSessionId}`);
          } catch (logError) {
            console.warn('Failed to log terminal connection activity:', logError.message);
          }

          // Send success response
          socket.emit('terminal:connected', {
            sessionId,
            connectionId,
            success: true,
          });

          console.log(`✅ Terminal connected event sent to client: ${sessionId}\n`);
        } catch (error) {
          console.error(`\n${'!'.repeat(80)}`);
          console.error(`❌ TERMINAL CONNECTION FAILED`);
          console.error(`${'!'.repeat(80)}`);
          console.error(`Error: ${error.message}`);
          console.error(`Stack:`, error.stack);
          console.error(`${'!'.repeat(80)}\n`);
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
      socket.on('terminal:disconnect', async (data) => {
        const { sessionId, userId, username } = data;
        console.log(`🔌 Terminal disconnect request: ${sessionId}`);

        // Get session info before closing for logging
        const session = TerminalSession.getSession(sessionId);
        const sshSessionId = session?.sshSessionId;

        let sshSessionDetails = null;
        if (sshSessionId) {
          try {
            sshSessionDetails = await SSHSession.getById(sshSessionId);
          } catch (err) {
            console.warn('Could not get SSH session details for logging:', err.message);
          }
        }

        TerminalSession.closeSession(sessionId);

        // Log terminal disconnect activity
        try {
          await ActivityLog.log({
            userId: userId || null,
            username: username || 'unknown',
            action: ActivityLog.ACTIONS.DISCONNECT,
            category: ActivityLog.CATEGORIES.TERMINAL,
            resourceType: 'server',
            resourceId: sshSessionId,
            resourceName: sshSessionDetails ? `${sshSessionDetails.name} (${sshSessionDetails.host})` : `Session ${sshSessionId}`,
            details: {
              host: sshSessionDetails?.host,
              port: sshSessionDetails?.port,
              sshUsername: sshSessionDetails?.username,
              sessionId: sessionId,
            },
          });
          console.log(`📝 Activity logged: Terminal disconnect from ${sshSessionDetails?.host || sshSessionId}`);
        } catch (logError) {
          console.warn('Failed to log terminal disconnect activity:', logError.message);
        }
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

