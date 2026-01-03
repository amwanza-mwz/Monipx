const SSHManager = require('./SSHManager');

class TerminalSession {
  constructor() {
    this.sessions = new Map(); // sessionId -> { connectionId, socket, stream, options }
  }

  /**
   * Create a new terminal session
   * @param {string} sessionId - Unique session ID
   * @param {number} sshSessionId - SSH session database ID
   * @param {object} socket - Socket.io socket
   * @param {object} options - Terminal options
   * @returns {Promise<string>} - Connection ID
   */
  async createSession(sessionId, sshSessionId, socket, options = {}) {
    try {
      console.log(`📺 Creating terminal session: ${sessionId}`);

      // Connect to SSH
      const { connectionId, client } = await SSHManager.connect(
        sshSessionId,
        options.passphrase
      );

      // Open shell
      const stream = await SSHManager.openShell(connectionId, {
        term: options.term || 'xterm-256color',
        rows: options.rows || 24,
        cols: options.cols || 80,
      });

      // Store session
      this.sessions.set(sessionId, {
        connectionId,
        socket,
        stream,
        options,
        sshSessionId,
      });

      // Handle stream data (output from SSH server)
      stream.on('data', (data) => {
        socket.emit('terminal:data', {
          sessionId,
          data: data.toString('utf-8')
        });
      });

      // Handle stream close
      stream.on('close', () => {
        console.log(`📺 Stream closed for session: ${sessionId}`);
        socket.emit('terminal:close', { sessionId });
        this.closeSession(sessionId);
      });

      // Handle stream errors
      stream.stderr.on('data', (data) => {
        socket.emit('terminal:data', {
          sessionId,
          data: data.toString('utf-8')
        });
      });

      console.log(`✅ Terminal session created: ${sessionId}`);
      return connectionId;
    } catch (error) {
      console.error(`❌ Failed to create terminal session:`, error);
      throw error;
    }
  }

  /**
   * Send data to terminal
   * @param {string} sessionId - Session ID
   * @param {string} data - Data to send
   */
  sendData(sessionId, data) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.error(`❌ Session not found: ${sessionId}`);
      return;
    }

    const { stream, connectionId } = session;
    if (stream && !stream.destroyed) {
      stream.write(data);
      
      // Update bytes sent
      const conn = SSHManager.getConnection(connectionId);
      if (conn) {
        conn.bytesSent += Buffer.byteLength(data);
      }
    }
  }

  /**
   * Resize terminal
   * @param {string} sessionId - Session ID
   * @param {number} rows - Number of rows
   * @param {number} cols - Number of columns
   */
  resize(sessionId, rows, cols) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.error(`❌ Session not found: ${sessionId}`);
      return;
    }

    const { stream } = session;
    if (stream && !stream.destroyed && stream.setWindow) {
      stream.setWindow(rows, cols);
      console.log(`📐 Terminal resized: ${sessionId} (${cols}x${rows})`);
    }
  }

  /**
   * Close terminal session
   * @param {string} sessionId - Session ID
   */
  closeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    console.log(`🔌 Closing terminal session: ${sessionId}`);

    const { connectionId, stream } = session;

    // Close stream
    if (stream && !stream.destroyed) {
      stream.end();
    }

    // Disconnect SSH
    SSHManager.disconnect(connectionId);

    // Remove session
    this.sessions.delete(sessionId);
  }

  /**
   * Get session info
   * @param {string} sessionId - Session ID
   * @returns {object|null}
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get all active sessions
   * @returns {Array}
   */
  getActiveSessions() {
    return Array.from(this.sessions.keys());
  }

  /**
   * Close all sessions
   */
  closeAllSessions() {
    console.log(`🔌 Closing all terminal sessions (${this.sessions.size})...`);
    for (const sessionId of this.sessions.keys()) {
      this.closeSession(sessionId);
    }
  }
}

module.exports = new TerminalSession();

