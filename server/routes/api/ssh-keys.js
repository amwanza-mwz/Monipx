const express = require('express');
const router = express.Router();
const SSHKey = require('../../models/SSHKey');
const KeyEncryption = require('../../services/ssh/KeyEncryption');
const crypto = require('crypto');

// Get all SSH keys (without private keys)
router.get('/', async (req, res) => {
  try {
    const keys = await SSHKey.getAll();
    res.json(keys);
  } catch (error) {
    console.error('❌ Error fetching SSH keys:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get SSH key by ID (without private key)
router.get('/:id', async (req, res) => {
  try {
    const key = await SSHKey.getByIdPublicOnly(req.params.id);
    if (!key) {
      return res.status(404).json({ error: 'SSH key not found' });
    }
    res.json(key);
  } catch (error) {
    console.error('❌ Error fetching SSH key:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get public key only
router.get('/:id/public', async (req, res) => {
  try {
    const publicKey = await SSHKey.getPublicKey(req.params.id);
    if (!publicKey) {
      return res.status(404).json({ error: 'SSH key not found' });
    }
    res.json({ public_key: publicKey });
  } catch (error) {
    console.error('❌ Error fetching public key:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload/Create SSH key
router.post('/', async (req, res) => {
  try {
    let { name, private_key, public_key, has_passphrase, passphrase } = req.body;

    console.log('📥 Uploading SSH key:', name);
    console.log('Private key length:', private_key?.length);
    console.log('Public key length:', public_key?.length);
    console.log('Has passphrase:', !!passphrase);

    if (!name || !private_key) {
      console.error('❌ Missing required fields');
      return res.status(400).json({ error: 'Name and private_key are required' });
    }

    // Trim whitespace
    private_key = private_key.trim();
    if (public_key) {
      public_key = public_key.trim();
    }

    // Validate private key format
    const validation = KeyEncryption.validatePrivateKey(private_key);

    if (!validation.valid) {
      console.error('❌ Invalid private key format');
      return res.status(400).json({
        error: 'Invalid SSH private key format. The key must be in PEM format with proper BEGIN/END markers.'
      });
    }

    console.log(`✅ Valid ${validation.keyType} private key detected (encrypted: ${validation.encrypted})`);

    // Check if passphrase is needed but not provided
    if (validation.encrypted && !passphrase) {
      console.warn('⚠️  Encrypted key detected but no passphrase provided');
    }

    // Try to generate public key from private key if not provided
    if (!public_key || public_key.includes('PLACEHOLDER')) {
      console.log('📝 Attempting to generate public key from private key...');
      try {
        public_key = KeyEncryption.generatePublicKeyFromPrivate(private_key, passphrase);
        console.log('✅ Public key generated successfully');
      } catch (error) {
        console.error('⚠️  Failed to generate public key:', error.message);

        // If it's an encrypted key issue, provide helpful error
        if (error.message.includes('passphrase')) {
          return res.status(400).json({
            error: 'This private key is encrypted. Please provide the passphrase, or upload the public key (.pub file) manually.',
            needsPassphrase: true,
            needsPublicKey: true
          });
        }

        // Otherwise, ask for public key
        return res.status(400).json({
          error: 'Could not auto-generate public key. Please provide the public key (.pub file) manually.',
          needsPublicKey: true
        });
      }
    }

    // Validate public key format
    if (!public_key.startsWith('ssh-') && !public_key.startsWith('ecdsa-')) {
      console.error('❌ Invalid public key format');
      return res.status(400).json({
        error: 'Invalid public key format. Must start with ssh-rsa, ssh-ed25519, or ecdsa-sha2-'
      });
    }

    console.log('🔐 Encrypting SSH private key...');

    // Encrypt the private key
    const encryptedPrivateKey = KeyEncryption.encrypt(private_key);

    // Encrypt the passphrase if provided
    let encryptedPassphrase = null;
    if (passphrase) {
      console.log('🔐 Encrypting passphrase...');
      encryptedPassphrase = KeyEncryption.encrypt(passphrase);
    }

    // Generate fingerprint
    const fingerprint = KeyEncryption.generateFingerprint(public_key);

    // Determine key type from public key
    let keyType = 'rsa';
    if (public_key.includes('ssh-ed25519')) keyType = 'ed25519';
    else if (public_key.includes('ecdsa')) keyType = 'ecdsa';
    else if (public_key.includes('ssh-dss')) keyType = 'dsa';
    else if (public_key.includes('ssh-rsa')) keyType = 'rsa';

    const keyData = {
      name,
      key_type: keyType,
      fingerprint,
      encrypted_private_key: encryptedPrivateKey,
      public_key,
      has_passphrase: has_passphrase || !!passphrase,
      encrypted_passphrase: encryptedPassphrase,
    };

    const key = await SSHKey.create(keyData);
    console.log('✅ SSH key created and encrypted:', key.id);

    res.status(201).json(key);
  } catch (error) {
    console.error('❌ Error creating SSH key:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate new SSH key pair
router.post('/generate', async (req, res) => {
  try {
    const { name, key_type = 'ed25519', passphrase } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    console.log(`🔑 Generating ${key_type} SSH key pair...`);

    // Generate key pair using Node.js crypto
    const { publicKey, privateKey } = crypto.generateKeyPairSync(
      key_type === 'ed25519' ? 'ed25519' : 'rsa',
      key_type === 'rsa' ? {
        modulusLength: 4096,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
          cipher: passphrase ? 'aes-256-cbc' : undefined,
          passphrase: passphrase || undefined
        }
      } : {
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
          cipher: passphrase ? 'aes-256-cbc' : undefined,
          passphrase: passphrase || undefined
        }
      }
    );

    // Encrypt the private key
    const encryptedPrivateKey = KeyEncryption.encrypt(privateKey);
    
    // Generate fingerprint
    const fingerprint = KeyEncryption.generateFingerprint(publicKey);

    const keyData = {
      name,
      key_type,
      fingerprint,
      encrypted_private_key: encryptedPrivateKey,
      public_key: publicKey,
      has_passphrase: !!passphrase,
    };

    const key = await SSHKey.create(keyData);
    console.log('✅ SSH key pair generated:', key.id);

    // Return the key with the unencrypted private key (only for generation)
    res.status(201).json({
      ...key,
      private_key: privateKey, // Return plain private key for user to download
      public_key: publicKey,
      fingerprint: fingerprint
    });
  } catch (error) {
    console.error('❌ Error generating SSH key:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update passphrase for an SSH key
router.put('/:id/passphrase', async (req, res) => {
  try {
    const { passphrase } = req.body;
    const keyId = req.params.id;

    console.log('🔐 Updating passphrase for SSH key:', keyId);

    // Encrypt the passphrase if provided, otherwise set to null
    let encryptedPassphrase = null;
    if (passphrase) {
      console.log('🔐 Encrypting new passphrase...');
      encryptedPassphrase = KeyEncryption.encrypt(passphrase);
    } else {
      console.log('🔓 Removing passphrase...');
    }

    // Update the key
    await SSHKey.updatePassphrase(keyId, encryptedPassphrase, !!passphrase);

    console.log('✅ Passphrase updated successfully');
    res.json({ message: 'Passphrase updated successfully' });
  } catch (error) {
    console.error('❌ Error updating passphrase:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete SSH key
router.delete('/:id', async (req, res) => {
  try {
    console.log('🗑️  Deleting SSH key:', req.params.id);
    await SSHKey.delete(req.params.id);
    console.log('✅ SSH key deleted');
    res.status(204).send();
  } catch (error) {
    console.error('❌ Error deleting SSH key:', error);
    if (error.message.includes('Cannot delete key')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

