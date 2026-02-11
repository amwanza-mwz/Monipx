const express = require('express');
const router = express.Router();
const SSHSession = require('../../models/SSHSession');
const { Client } = require('ssh2');
const SSHKey = require('../../models/SSHKey');
const KeyEncryption = require('../../services/ssh/KeyEncryption');

// Get all SSH sessions
router.get('/', async (req, res) => {
  try {
    const sessions = await SSHSession.getAll();
    res.json(sessions);
  } catch (error) {
    console.error('❌ Error fetching SSH sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all groups
router.get('/groups', async (req, res) => {
  try {
    const groups = await SSHSession.getAllGroups();
    res.json(groups);
  } catch (error) {
    console.error('❌ Error fetching groups:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get sessions by group
router.get('/group/:groupName', async (req, res) => {
  try {
    const sessions = await SSHSession.getByGroup(req.params.groupName);
    res.json(sessions);
  } catch (error) {
    console.error('❌ Error fetching sessions by group:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get SSH session by ID
router.get('/:id', async (req, res) => {
  try {
    const session = await SSHSession.getById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'SSH session not found' });
    }
    res.json(session);
  } catch (error) {
    console.error('❌ Error fetching SSH session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create SSH session
router.post('/', async (req, res) => {
  try {
    console.log('📝 Creating SSH session:', req.body.name);
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));

    // Validate required fields
    if (!req.body.name || !req.body.host || !req.body.username) {
      return res.status(400).json({
        error: 'Missing required fields: name, host, and username are required'
      });
    }

    if (req.body.auth_method === 'key' && !req.body.ssh_key_id) {
      return res.status(400).json({
        error: 'SSH key is required when using key-based authentication'
      });
    }

    if (req.body.auth_method === 'password' && !req.body.password) {
      return res.status(400).json({
        error: 'Password is required when using password-based authentication'
      });
    }

    const session = await SSHSession.create(req.body);
    console.log('✅ SSH session created:', session.id);
    res.status(201).json(session);
  } catch (error) {
    console.error('❌ Error creating SSH session:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Update SSH session
router.put('/:id', async (req, res) => {
  try {
    console.log('📝 Updating SSH session:', req.params.id);
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));

    // Validate required fields
    if (!req.body.name || !req.body.host || !req.body.username) {
      return res.status(400).json({
        error: 'Missing required fields: name, host, and username are required'
      });
    }

    if (req.body.auth_method === 'key' && !req.body.ssh_key_id) {
      return res.status(400).json({
        error: 'SSH key is required when using key-based authentication'
      });
    }

    // For password auth, only require password if it's a new session or changing auth method
    // The model will preserve existing password if not provided
    const existingSession = await SSHSession.getById(req.params.id);
    if (req.body.auth_method === 'password' && !req.body.password &&
        (!existingSession || existingSession.auth_method !== 'password')) {
      return res.status(400).json({
        error: 'Password is required when switching to password-based authentication'
      });
    }

    const session = await SSHSession.update(req.params.id, req.body);
    if (!session) {
      return res.status(404).json({ error: 'SSH session not found' });
    }
    console.log('✅ SSH session updated:', session.id);
    res.json(session);
  } catch (error) {
    console.error('❌ Error updating SSH session:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Clone SSH session
router.post('/:id/clone', async (req, res) => {
  try {
    console.log('📋 Cloning SSH session:', req.params.id);
    const clonedSession = await SSHSession.clone(req.params.id);
    console.log('✅ SSH session cloned:', clonedSession.id);
    res.status(201).json(clonedSession);
  } catch (error) {
    console.error('❌ Error cloning SSH session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete SSH session
router.delete('/:id', async (req, res) => {
  try {
    console.log('🗑️  Deleting SSH session:', req.params.id);
    await SSHSession.delete(req.params.id);
    console.log('✅ SSH session deleted');
    res.status(204).send();
  } catch (error) {
    console.error('❌ Error deleting SSH session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test SSH connection
router.post('/test-connection', async (req, res) => {
  try {
    const { host, port, username, auth_method, ssh_key_id, password } = req.body;

    console.log(`🔍 Testing SSH connection to ${username}@${host}:${port}...`);

    // Validate required fields
    if (!host || !username) {
      return res.status(400).json({ error: 'Host and username are required' });
    }

    // Create SSH client
    const client = new Client();

    // Connection configuration with full algorithm support for network devices
    const config = {
      host,
      port: port || 22,
      username,
      readyTimeout: 20000, // 20 second timeout for testing (switches can be slow)
      // Full algorithm list to support legacy network devices (Cisco, HP, Juniper, etc.)
      algorithms: {
        kex: [
          'curve25519-sha256',
          'curve25519-sha256@libssh.org',
          'ecdh-sha2-nistp256',
          'ecdh-sha2-nistp384',
          'ecdh-sha2-nistp521',
          'diffie-hellman-group14-sha256',
          'diffie-hellman-group-exchange-sha256',
          'diffie-hellman-group14-sha1',
          'diffie-hellman-group-exchange-sha1',
          'diffie-hellman-group1-sha1'
        ],
        cipher: [
          'aes128-gcm@openssh.com',
          'aes256-gcm@openssh.com',
          'aes128-ctr',
          'aes192-ctr',
          'aes256-ctr',
          'aes128-cbc',
          'aes192-cbc',
          'aes256-cbc',
          '3des-cbc'
        ],
        serverHostKey: [
          'ssh-ed25519',
          'ecdsa-sha2-nistp256',
          'ecdsa-sha2-nistp384',
          'ecdsa-sha2-nistp521',
          'rsa-sha2-512',
          'rsa-sha2-256',
          'ssh-rsa'
        ],
        hmac: [
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
    if (auth_method === 'key' && ssh_key_id) {
      console.log('🔐 Using SSH key authentication');

      // Get and decrypt SSH key
      const key = await SSHKey.getById(ssh_key_id);
      if (!key) {
        return res.status(404).json({ error: 'SSH key not found' });
      }

      try {
        const decryptedPrivateKey = KeyEncryption.decrypt(key.encrypted_private_key);
        config.privateKey = decryptedPrivateKey;

        // If key has a stored passphrase, decrypt and use it
        if (key.encrypted_passphrase) {
          console.log('🔑 Using stored passphrase for encrypted key');
          const decryptedPassphrase = KeyEncryption.decrypt(key.encrypted_passphrase);
          config.passphrase = decryptedPassphrase;
        }
      } catch (error) {
        console.error('❌ Failed to decrypt SSH key:', error);
        return res.status(500).json({ error: 'Failed to decrypt SSH key' });
      }
    } else if (auth_method === 'password' && password) {
      console.log('🔐 Using password authentication');
      config.password = password;
      // Enable keyboard-interactive auth for network devices (Cisco, HP, Aruba, etc.)
      config.tryKeyboard = true;
    } else {
      return res.status(400).json({ error: 'Authentication method and credentials are required' });
    }

    // Test connection
    const startTime = Date.now();

    return new Promise((resolve) => {
      let resolved = false;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          client.end();
          resolve(res.status(408).json({
            success: false,
            error: 'Connection timeout - server did not respond within 20 seconds'
          }));
        }
      }, 20000);

      // Handle keyboard-interactive auth (required by many network switches)
      client.on('keyboard-interactive', (name, instructions, lang, prompts, finish) => {
        console.log(`🔐 Keyboard-interactive auth requested for test connection`);
        const responses = prompts.map(() => config.password || '');
        finish(responses);
      });

      client.on('ready', () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          const duration = Date.now() - startTime;
          console.log(`✅ SSH connection successful (${duration}ms)`);
          client.end();
          resolve(res.json({
            success: true,
            message: `Connection successful (${duration}ms)`,
            duration
          }));
        }
      });

      client.on('error', (err) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          console.error('❌ SSH connection failed:', err.message);

          let errorMessage = err.message;

          // Provide more helpful error messages
          if (err.level === 'client-authentication') {
            errorMessage = 'Authentication failed - check your credentials';
          } else if (err.code === 'ECONNREFUSED') {
            errorMessage = 'Connection refused - server may be down or port is incorrect';
          } else if (err.code === 'ETIMEDOUT') {
            errorMessage = 'Connection timeout - check host address and firewall settings';
          } else if (err.code === 'ENOTFOUND') {
            errorMessage = 'Host not found - check the hostname or IP address';
          }

          resolve(res.status(400).json({
            success: false,
            error: errorMessage,
            details: err.message
          }));
        }
      });

      // Attempt connection
      try {
        client.connect(config);
      } catch (error) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve(res.status(500).json({
            success: false,
            error: error.message
          }));
        }
      }
    });
  } catch (error) {
    console.error('❌ Error testing SSH connection:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

