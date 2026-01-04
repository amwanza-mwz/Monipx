import { io } from 'socket.io-client';

class TerminalSocket {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.connected = false;
  }

  /**
   * Initialize socket connection
   */
  init() {
    if (this.socket) {
      console.log('🔄 Socket already initialized');
      return;
    }

    // Use relative URL in production, absolute URL in development
    const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
    console.log('🔌 Initializing Terminal WebSocket:', `${socketUrl}/terminal`);

    this.socket = io(`${socketUrl}/terminal`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ Terminal WebSocket connected - Socket ID:', this.socket.id);
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Terminal WebSocket disconnected');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Terminal WebSocket connection error:', error);
    });

    this.socket.on('terminal:connected', (data) => {
      console.log('✅ Terminal session connected:', data.sessionId);
      this.emit('connected', data);
    });

    this.socket.on('terminal:data', (payload) => {
      // Emit with sessionId so listeners can filter
      this.emit('data', payload);
    });

    this.socket.on('terminal:close', (payload) => {
      console.log('🔌 Terminal session closed:', payload?.sessionId);
      this.emit('close', payload);
    });

    this.socket.on('terminal:error', (data) => {
      console.error('❌ Terminal error:', data.error);
      this.emit('error', data.error);
    });

    this.socket.on('terminal:pong', () => {
      this.emit('pong');
    });
  }

  /**
   * Connect to SSH session
   * @param {string} sessionId - Unique session ID
   * @param {number} sshSessionId - SSH session database ID
   * @param {object} options - Terminal options
   */
  async connect(sessionId, sshSessionId, options = {}) {
    console.log('\n' + '─'.repeat(80));
    console.log('📡 [TerminalSocket] connect()');
    console.log('─'.repeat(80));
    console.log('   Tab/Session ID:', sessionId);
    console.log('   SSH Session ID:', sshSessionId, '(type:', typeof sshSessionId + ')');
    console.log('   Options:', options);
    console.log('─'.repeat(80) + '\n');

    this.init();

    if (!this.socket.connected) {
      console.warn('⚠️  Socket not connected yet, waiting...');
      await new Promise((resolve) => {
        if (this.socket.connected) {
          resolve();
        } else {
          this.socket.once('connect', resolve);
        }
      });
      console.log('✅ Socket connected, proceeding...');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('❌ Connection timeout after 30s');
        reject(new Error('Connection timeout'));
      }, 30000);

      const onConnected = (data) => {
        console.log('📨 Received terminal:connected event:', data);
        if (data.sessionId === sessionId) {
          console.log('✅ Session ID matches, resolving...');
          clearTimeout(timeout);
          this.off('connected', onConnected);
          this.off('error', onError);
          resolve(data);
        }
      };

      const onError = (error) => {
        console.error('\n' + '!'.repeat(80));
        console.error('❌ [TerminalSocket] Received terminal:error event');
        console.error('!'.repeat(80));
        console.error('Error:', error);
        console.error('!'.repeat(80) + '\n');
        clearTimeout(timeout);
        this.off('connected', onConnected);
        this.off('error', onError);
        reject(new Error(error));
      };

      this.on('connected', onConnected);
      this.on('error', onError);

      console.log('📤 [TerminalSocket] Emitting terminal:connect event');
      console.log('   Payload:', { sessionId, sshSessionId, options });
      this.socket.emit('terminal:connect', {
        sessionId,
        sshSessionId,
        options,
      });
    });
  }

  /**
   * Send input to terminal
   * @param {string} sessionId - Session ID
   * @param {string} input - Input data
   */
  sendInput(sessionId, input) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    this.socket.emit('terminal:input', {
      sessionId,
      input,
    });
  }

  /**
   * Resize terminal
   * @param {string} sessionId - Session ID
   * @param {number} rows - Number of rows
   * @param {number} cols - Number of columns
   */
  resize(sessionId, rows, cols) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    this.socket.emit('terminal:resize', {
      sessionId,
      rows,
      cols,
    });
  }

  /**
   * Disconnect terminal session
   * @param {string} sessionId - Session ID
   */
  disconnect(sessionId) {
    if (!this.socket) {
      return;
    }

    this.socket.emit('terminal:disconnect', {
      sessionId,
    });
  }

  /**
   * Send ping
   */
  ping() {
    if (!this.socket) {
      return;
    }

    this.socket.emit('terminal:ping');
  }

  /**
   * Register event listener
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Unregister event listener
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  off(event, callback) {
    if (!this.listeners.has(event)) {
      return;
    }

    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Emit event to listeners
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  emit(event, data) {
    if (!this.listeners.has(event)) {
      return;
    }

    const callbacks = this.listeners.get(event);
    callbacks.forEach((callback) => callback(data));
  }

  /**
   * Close socket connection
   */
  close() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.connected = false;
    }
  }
}

export default new TerminalSocket();

