const { Client } = require('ssh2');
const KeyEncryption = require('./KeyEncryption');
const SSHKeyConverter = require('./SSHKeyConverter');
const SSHKey = require('../../models/SSHKey');
const SSHSession = require('../../models/SSHSession');
const SSHConnectionLog = require('../../models/SSHConnectionLog');

class SSHManager {
  constructor() {
    this.activeConnections = new Map(); // connectionId -> { client, session, stream, logId }
  }

  /**
   * Create SSH connection
   * @param {number} sessionId - SSH session ID
   * @param {string} passphrase - Optional passphrase for encrypted keys
   * @returns {Promise<{connectionId: string, client: Client}>}
   */
  async connect(sessionId, passphrase = null) {
    try {
      // Ensure sessionId is a number (fix for production string/number mismatch)
      const numericSessionId = parseInt(sessionId, 10);
      if (isNaN(numericSessionId)) {
        throw new Error(`Invalid session ID: ${sessionId}`);
      }

      // Get session details with decrypted password if using password auth
      const session = await SSHSession.getForConnection(numericSessionId);

      if (!session) {
        throw new Error(`SSH session not found (ID: ${numericSessionId})`);
      }

      console.log(`🔌 Connecting to ${session.username}@${session.host}:${session.port} (${session.auth_method})`);

      // Get SSH key if using key authentication
      let privateKey = null;
      let keyPassphrase = passphrase; // Use provided passphrase or get from DB

      if (session.auth_method === 'key' && session.ssh_key_id) {
        // Get full key details including encrypted passphrase
        const keyDetails = await SSHKey.getById(session.ssh_key_id);
        if (!keyDetails || !keyDetails.encrypted_private_key) {
          throw new Error('SSH key not found');
        }

        // Decrypt the private key
        privateKey = KeyEncryption.decrypt(keyDetails.encrypted_private_key);

        // If no passphrase provided but key has one stored, decrypt it
        if (!keyPassphrase && keyDetails.encrypted_passphrase) {
          keyPassphrase = KeyEncryption.decrypt(keyDetails.encrypted_passphrase);
        }

        // Validate and convert key format
        const validation = SSHKeyConverter.validatePrivateKey(privateKey, keyPassphrase);

        if (!validation.valid && validation.errors.length > 0) {
          const hasOnlyWarnings = validation.errors.every(err =>
            err.includes('may require special handling')
          );

          if (!hasOnlyWarnings) {
            throw new Error(`Invalid SSH key: ${validation.errors[0]}`);
          }
        }

        // Convert key to compatible format
        privateKey = SSHKeyConverter.convertPrivateKey(privateKey, keyPassphrase);
      }

      // Create SSH client
      const client = new Client();
      const connectionId = this.generateConnectionId();

      // Create connection log (use numericSessionId to ensure correct type)
      const log = await SSHConnectionLog.create({ session_id: numericSessionId });

      // Connection configuration optimized for speed with legacy fallback
      const config = {
        host: session.host,
        port: session.port,
        username: session.username,
        keepaliveInterval: (session.keep_alive || 30) * 1000,
        keepaliveCountMax: 3,
        readyTimeout: 30000, // 30s timeout for network devices (switches can be slow to negotiate)
        // Optimized algorithm order - fastest/modern first, legacy last
        algorithms: {
          kex: [
            // Modern fast algorithms first
            'curve25519-sha256',
            'curve25519-sha256@libssh.org',
            'ecdh-sha2-nistp256',
            'ecdh-sha2-nistp384',
            'ecdh-sha2-nistp521',
            // Legacy algorithms for older devices (Cisco, etc.)
            'diffie-hellman-group14-sha256',
            'diffie-hellman-group-exchange-sha256',
            'diffie-hellman-group14-sha1',
            'diffie-hellman-group-exchange-sha1',
            'diffie-hellman-group1-sha1'
          ],
          cipher: [
            // Fast GCM ciphers first (hardware accelerated)
            'aes128-gcm@openssh.com',
            'aes256-gcm@openssh.com',
            // CTR mode (fast, widely supported)
            'aes128-ctr',
            'aes192-ctr',
            'aes256-ctr',
            // CBC mode fallback for legacy network devices
            'aes128-cbc',
            'aes192-cbc',
            'aes256-cbc',
            '3des-cbc'
          ],
          serverHostKey: [
            // Modern keys first
            'ssh-ed25519',
            'ecdsa-sha2-nistp256',
            'ecdsa-sha2-nistp384',
            'ecdsa-sha2-nistp521',
            'rsa-sha2-512',
            'rsa-sha2-256',
            'ssh-rsa'
          ],
          hmac: [
            // ETM (Encrypt-then-MAC) modes are faster
            'hmac-sha2-256-etm@openssh.com',
            'hmac-sha2-512-etm@openssh.com',
            'hmac-sha2-256',
            'hmac-sha2-512',
            'hmac-sha1',
            'hmac-md5'
          ]
        }
      };

      // Add authentication method
      if (session.auth_method === 'key' && privateKey) {
        config.privateKey = privateKey;
        if (keyPassphrase) {
          config.passphrase = keyPassphrase;
        }
      } else if (session.auth_method === 'password') {
        // Password should already be decrypted by getForConnection()
        if (!session.decrypted_password) {
          throw new Error('Password not found for this session');
        }

        config.password = session.decrypted_password;
        // Enable keyboard-interactive auth for network devices (Cisco, HP, Aruba, etc.)
        config.tryKeyboard = true;
      } else {
        throw new Error('No authentication method configured');
      }

      // Store connection info
      this.activeConnections.set(connectionId, {
        client,
        session,
        stream: null,
        logId: log.id,
        bytesSent: 0,
        bytesReceived: 0,
      });

      // Return promise that resolves when connected
      return new Promise((resolve, reject) => {
        let resolved = false;

        client.on('ready', () => {
          if (resolved) return;
          resolved = true;
          console.log(`✅ SSH connection established: ${connectionId}`);
          resolve({ connectionId, client });
        });

        // Handle keyboard-interactive auth (required by many network switches)
        client.on('keyboard-interactive', (name, instructions, lang, prompts, finish) => {
          const responses = prompts.map(() => config.password || '');
          finish(responses);
        });

        client.on('error', (err) => {
          if (resolved) return;
          resolved = true;
          console.error(`❌ SSH connection error for ${session.host}:`, err.message);

          // Provide helpful error messages
          let userMessage = err.message;
          if (err.message.includes('All configured authentication methods failed')) {
            userMessage = 'Authentication failed. Please check:\n' +
                         '1. SSH key is correct and matches the server\n' +
                         '2. Public key is added to ~/.ssh/authorized_keys on the server\n' +
                         '3. Key permissions are correct (chmod 600 ~/.ssh/authorized_keys)';
          } else if (err.message.includes('Cannot parse privateKey')) {
            userMessage = 'Invalid SSH key format. Please ensure the key is in PEM or OpenSSH format.';
          } else if (err.message.includes('Encrypted private key detected')) {
            userMessage = 'SSH key is encrypted. Please provide the passphrase.';
          } else if (err.message.includes('ECONNREFUSED')) {
            userMessage = `Cannot connect to ${session.host}:${session.port}. Server may be down or unreachable.`;
          } else if (err.message.includes('ETIMEDOUT')) {
            userMessage = `Connection timeout to ${session.host}:${session.port}. Check firewall and network.`;
          } else if (err.message.includes('ENOTFOUND')) {
            userMessage = `Host not found: ${session.host}. Check the hostname or IP address.`;
          }

          this.activeConnections.delete(connectionId);
          SSHConnectionLog.updateDisconnect(log.id, `Error: ${err.message}`);

          const enhancedError = new Error(userMessage);
          enhancedError.originalError = err;
          reject(enhancedError);
        });

        client.on('close', () => {
          console.log(`🔌 SSH connection closed: ${connectionId}`);
          const conn = this.activeConnections.get(connectionId);
          if (conn) {
            SSHConnectionLog.updateDisconnect(conn.logId, 'Connection closed');
            SSHConnectionLog.updateStats(conn.logId, conn.bytesSent, conn.bytesReceived);
          }
          this.activeConnections.delete(connectionId);

          // If connection closed before ready, reject the promise
          if (!resolved) {
            resolved = true;
            reject(new Error(`Connection to ${session.host}:${session.port} closed unexpectedly. The device may have rejected the connection.`));
          }
        });

        // Connect
        client.connect(config);
      });
    } catch (error) {
      console.error('❌ SSH connection failed:', error);
      throw error;
    }
  }

  /**
   * Open shell session
   * @param {string} connectionId - Connection ID
   * @param {object} terminalOptions - Terminal options (rows, cols, term)
   * @returns {Promise<Stream>}
   */
  async openShell(connectionId, terminalOptions = {}) {
    const conn = this.activeConnections.get(connectionId);
    if (!conn) {
      throw new Error('Connection not found');
    }

    const { client, session } = conn;

    return new Promise((resolve, reject) => {
      client.shell({
        term: terminalOptions.term || session.terminal_type || 'xterm-256color',
        rows: terminalOptions.rows || 24,
        cols: terminalOptions.cols || 80,
      }, (err, stream) => {
        if (err) {
          console.error('❌ Failed to open shell:', err);
          return reject(err);
        }

        console.log(`🖥️  Shell opened for connection: ${connectionId}`);
        
        // Store stream
        conn.stream = stream;

        // Track data transfer
        stream.on('data', (data) => {
          conn.bytesReceived += data.length;
        });

        resolve(stream);
      });
    });
  }

  /**
   * Disconnect SSH connection
   * @param {string} connectionId - Connection ID
   */
  disconnect(connectionId) {
    const conn = this.activeConnections.get(connectionId);
    if (conn) {
      console.log(`🔌 Disconnecting: ${connectionId}`);
      conn.client.end();
      this.activeConnections.delete(connectionId);
    }
  }

  /**
   * Get active connection
   * @param {string} connectionId - Connection ID
   * @returns {object|null}
   */
  getConnection(connectionId) {
    return this.activeConnections.get(connectionId) || null;
  }

  /**
   * Generate unique connection ID
   * @returns {string}
   */
  generateConnectionId() {
    return `ssh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all active connections
   * @returns {Array}
   */
  getActiveConnections() {
    return Array.from(this.activeConnections.keys());
  }

  /**
   * Disconnect all connections
   */
  disconnectAll() {
    console.log(`🔌 Disconnecting all SSH connections (${this.activeConnections.size})...`);
    for (const connectionId of this.activeConnections.keys()) {
      this.disconnect(connectionId);
    }
  }
}

module.exports = new SSHManager();

