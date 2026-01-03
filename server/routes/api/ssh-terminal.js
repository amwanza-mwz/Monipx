const express = require('express');
const router = express.Router();
const SSHSession = require('../../models/SSHSession');
const SSHKey = require('../../models/SSHKey');
const SSHConnectionLog = require('../../models/SSHConnectionLog');
const KeyEncryption = require('../../services/ssh/KeyEncryption');

// Get session credentials for connection (with decryption)
router.get('/session/:id/credentials', async (req, res) => {
  try {
    const sessionId = req.params.id;
    console.log('🔑 Getting credentials for session:', sessionId);

    // Get session with decrypted password
    const session = await SSHSession.getForConnection(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Prepare credentials object
    const credentials = {
      host: session.host,
      port: session.port,
      username: session.username,
      auth_method: session.auth_method,
      terminal_type: session.terminal_type,
      keep_alive: session.keep_alive,
    };

    // Add authentication credentials based on method
    if (session.auth_method === 'password') {
      credentials.password = session.decrypted_password;
    } else if (session.auth_method === 'key' && session.ssh_key_id) {
      // Get and decrypt SSH key
      const key = await SSHKey.getById(session.ssh_key_id);
      if (!key) {
        return res.status(404).json({ error: 'SSH key not found' });
      }

      try {
        console.log('🔓 Decrypting SSH private key...');
        const decryptedPrivateKey = KeyEncryption.decrypt(key.encrypted_private_key);
        credentials.private_key = decryptedPrivateKey;
        credentials.has_passphrase = key.has_passphrase;
      } catch (error) {
        console.error('❌ Failed to decrypt SSH key:', error);
        return res.status(500).json({ error: 'Failed to decrypt SSH key' });
      }
    }

    res.json(credentials);
  } catch (error) {
    console.error('❌ Error getting session credentials:', error);
    res.status(500).json({ error: error.message });
  }
});

// Log SSH connection
router.post('/connection/log', async (req, res) => {
  try {
    const { session_id, event_type, ip_address, disconnect_reason } = req.body;

    if (event_type === 'connect') {
      const log = await SSHConnectionLog.create({
        session_id,
        ip_address,
      });
      res.status(201).json(log);
    } else if (event_type === 'disconnect') {
      const log = await SSHConnectionLog.updateDisconnect(
        session_id,
        disconnect_reason
      );
      res.json(log);
    } else {
      res.status(400).json({ error: 'Invalid event_type' });
    }
  } catch (error) {
    console.error('❌ Error logging connection:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get connection logs for a session
router.get('/session/:id/logs', async (req, res) => {
  try {
    const logs = await SSHConnectionLog.getBySession(req.params.id);
    res.json(logs);
  } catch (error) {
    console.error('❌ Error fetching connection logs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all recent connection logs
router.get('/logs/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await SSHConnectionLog.getRecent(limit);
    res.json(logs);
  } catch (error) {
    console.error('❌ Error fetching recent logs:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

