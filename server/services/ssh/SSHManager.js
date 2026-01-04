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
      console.log(`\n${'═'.repeat(80)}`);
      console.log(`🔌 SSHManager.connect()`);
      console.log(`${'═'.repeat(80)}`);
      console.log(`   Input sessionId: ${sessionId} (type: ${typeof sessionId})`);

      // Ensure sessionId is a number (fix for production string/number mismatch)
      const numericSessionId = parseInt(sessionId, 10);
      if (isNaN(numericSessionId)) {
        throw new Error(`Invalid session ID: ${sessionId}`);
      }

      console.log(`   Numeric sessionId: ${numericSessionId}`);
      console.log(`${'═'.repeat(80)}\n`);

      // Get session details with decrypted password if using password auth
      console.log(`🔍 Looking up SSH session in database...`);
      const session = await SSHSession.getForConnection(numericSessionId);

      if (!session) {
        // Additional debugging - check if session exists at all
        const allSessions = await SSHSession.getAll();
        console.error(`\n${'!'.repeat(80)}`);
        console.error(`❌ SSH SESSION NOT FOUND`);
        console.error(`${'!'.repeat(80)}`);
        console.error(`   Requested ID: ${numericSessionId}`);
        console.error(`   Total sessions in database: ${allSessions.length}`);
        console.error(`   Available session IDs: ${allSessions.map(s => s.id).join(', ')}`);
        console.error(`   Available sessions:`);
        allSessions.forEach(s => {
          console.error(`      - ID ${s.id}: ${s.name} @ ${s.host}`);
        });
        console.error(`${'!'.repeat(80)}\n`);
        throw new Error(`SSH session not found (ID: ${numericSessionId})`);
      }

      console.log(`✅ Session found in database:`);
      console.log(`   ID: ${session.id}`);
      console.log(`   Name: ${session.name}`);
      console.log(`   Host: ${session.host}:${session.port}`);
      console.log(`   Username: ${session.username}`);
      console.log(`   Auth Method: ${session.auth_method}`);
      console.log(`\n🔌 Connecting to ${session.username}@${session.host}:${session.port}...`);

      // Get SSH key if using key authentication
      let privateKey = null;
      let keyPassphrase = passphrase; // Use provided passphrase or get from DB

      if (session.auth_method === 'key' && session.ssh_key_id) {
        console.log(`🔑 Loading SSH key ID: ${session.ssh_key_id}`);

        // Get full key details including encrypted passphrase
        const keyDetails = await SSHKey.getById(session.ssh_key_id);
        if (!keyDetails || !keyDetails.encrypted_private_key) {
          throw new Error('SSH key not found');
        }

        // Decrypt the private key
        console.log('🔓 Decrypting private key...');
        privateKey = KeyEncryption.decrypt(keyDetails.encrypted_private_key);

        // If no passphrase provided but key has one stored, decrypt it
        if (!keyPassphrase && keyDetails.encrypted_passphrase) {
          console.log('🔓 Decrypting stored passphrase...');
          keyPassphrase = KeyEncryption.decrypt(keyDetails.encrypted_passphrase);
          console.log('✅ Passphrase decrypted from storage');
        }

        // Validate and convert key format
        console.log('🔍 Validating key format...');
        const validation = SSHKeyConverter.validatePrivateKey(privateKey, keyPassphrase);
        console.log(`📋 Key validation:`, validation);

        if (!validation.valid && validation.errors.length > 0) {
          // Check if it's just a warning about special handling
          const hasOnlyWarnings = validation.errors.every(err =>
            err.includes('may require special handling')
          );

          if (!hasOnlyWarnings) {
            console.error('❌ Invalid SSH key:', validation.errors.join(', '));
            throw new Error(`Invalid SSH key: ${validation.errors[0]}`);
          } else {
            console.log('⚠️  Key validation warnings (will attempt connection anyway):', validation.errors);
          }
        }

        // Convert key to compatible format
        console.log('🔄 Converting key format...');
        privateKey = SSHKeyConverter.convertPrivateKey(privateKey, keyPassphrase);
        console.log('✅ Key ready for connection');
      }

      // Create SSH client
      const client = new Client();
      const connectionId = this.generateConnectionId();

      // Create connection log (use numericSessionId to ensure correct type)
      const log = await SSHConnectionLog.create({ session_id: numericSessionId });

      // Connection configuration with legacy algorithms for Cisco devices
      const config = {
        host: session.host,
        port: session.port,
        username: session.username,
        keepaliveInterval: (session.keep_alive || 30) * 1000,
        keepaliveCountMax: 3,
        readyTimeout: 30000,
        // Add legacy algorithms for older devices like Cisco
        algorithms: {
          kex: [
            'diffie-hellman-group-exchange-sha256',
            'diffie-hellman-group14-sha256',
            'diffie-hellman-group-exchange-sha1',
            'diffie-hellman-group14-sha1',
            'diffie-hellman-group1-sha1',
            'ecdh-sha2-nistp256',
            'ecdh-sha2-nistp384',
            'ecdh-sha2-nistp521',
            'curve25519-sha256',
            'curve25519-sha256@libssh.org'
          ],
          cipher: [
            'aes128-ctr',
            'aes192-ctr',
            'aes256-ctr',
            'aes128-gcm',
            'aes128-gcm@openssh.com',
            'aes256-gcm',
            'aes256-gcm@openssh.com',
            'aes128-cbc',
            'aes192-cbc',
            'aes256-cbc',
            '3des-cbc'
          ],
          serverHostKey: [
            'ssh-rsa',
            'rsa-sha2-256',
            'rsa-sha2-512',
            'ecdsa-sha2-nistp256',
            'ecdsa-sha2-nistp384',
            'ecdsa-sha2-nistp521',
            'ssh-ed25519'
          ],
          hmac: [
            'hmac-sha2-256',
            'hmac-sha2-512',
            'hmac-sha1',
            'hmac-md5',
            'hmac-sha2-256-etm@openssh.com',
            'hmac-sha2-512-etm@openssh.com'
          ]
        }
      };

      // Add authentication method
      if (session.auth_method === 'key' && privateKey) {
        console.log('🔐 Using SSH key authentication');
        config.privateKey = privateKey;
        if (keyPassphrase) {
          console.log('🔑 Using passphrase for encrypted key');
          config.passphrase = keyPassphrase;
        }

        // Add debug mode for troubleshooting
        config.debug = (msg) => {
          if (msg.includes('error') || msg.includes('fail')) {
            console.error('🐛 SSH Debug:', msg);
          }
        };

      } else if (session.auth_method === 'password') {
        console.log('🔐 Using password authentication');

        // Password should already be decrypted by getForConnection()
        if (!session.decrypted_password) {
          throw new Error('Password not found for this session');
        }

        config.password = session.decrypted_password;
        console.log('✅ Password ready for connection');
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
        client.on('ready', () => {
          console.log(`✅ SSH connection established: ${connectionId}`);
          resolve({ connectionId, client });
        });

        client.on('error', (err) => {
          console.error(`❌ SSH connection error:`, err.message);
          console.error(`📋 Error details:`, {
            level: err.level,
            description: err.description,
            message: err.message
          });

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

