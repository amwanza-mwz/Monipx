const crypto = require('crypto');

class KeyEncryption {
  constructor() {
    // Get master encryption key from environment variable
    this.masterKey = process.env.SSH_ENCRYPTION_KEY;
    
    if (!this.masterKey) {
      console.warn('⚠️  SSH_ENCRYPTION_KEY not set! Using default key (NOT SECURE FOR PRODUCTION)');
      this.masterKey = 'default-insecure-key-change-me-in-production-32chars';
    }

    // Ensure key is 32 bytes for AES-256
    this.keyBuffer = Buffer.from(this.masterKey.padEnd(32, '0').substring(0, 32), 'utf8');
  }

  /**
   * Encrypt SSH private key using AES-256-GCM
   * @param {string} privateKey - The private key to encrypt
   * @returns {string} - Base64 encoded encrypted data with IV and auth tag
   */
  encrypt(privateKey) {
    try {
      // Generate random IV (Initialization Vector)
      const iv = crypto.randomBytes(16);
      
      // Create cipher
      const cipher = crypto.createCipheriv('aes-256-gcm', this.keyBuffer, iv);
      
      // Encrypt the private key
      let encrypted = cipher.update(privateKey, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      // Get authentication tag
      const authTag = cipher.getAuthTag();
      
      // Combine IV + authTag + encrypted data
      const combined = Buffer.concat([
        iv,
        authTag,
        Buffer.from(encrypted, 'base64')
      ]);
      
      return combined.toString('base64');
    } catch (error) {
      console.error('❌ Encryption error:', error);
      throw new Error('Failed to encrypt SSH key');
    }
  }

  /**
   * Decrypt SSH private key
   * @param {string} encryptedData - Base64 encoded encrypted data with IV and auth tag
   * @returns {string} - Decrypted private key
   */
  decrypt(encryptedData) {
    try {
      // Decode from base64
      const combined = Buffer.from(encryptedData, 'base64');
      
      // Extract IV (first 16 bytes)
      const iv = combined.slice(0, 16);
      
      // Extract auth tag (next 16 bytes)
      const authTag = combined.slice(16, 32);
      
      // Extract encrypted data (remaining bytes)
      const encrypted = combined.slice(32);
      
      // Create decipher
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.keyBuffer, iv);
      decipher.setAuthTag(authTag);
      
      // Decrypt
      let decrypted = decipher.update(encrypted, 'binary', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('❌ Decryption error:', error);
      throw new Error('Failed to decrypt SSH key');
    }
  }

  /**
   * Generate SSH key fingerprint
   * @param {string} publicKey - The public key
   * @returns {string} - SHA256 fingerprint
   */
  generateFingerprint(publicKey) {
    try {
      // Extract the key data (remove header/footer and whitespace)
      const keyData = publicKey
        .replace(/-----BEGIN.*-----/, '')
        .replace(/-----END.*-----/, '')
        .replace(/\s/g, '');
      
      // Create SHA256 hash
      const hash = crypto.createHash('sha256');
      hash.update(keyData);
      
      return 'SHA256:' + hash.digest('base64').replace(/=+$/, '');
    } catch (error) {
      console.error('❌ Fingerprint generation error:', error);
      throw new Error('Failed to generate key fingerprint');
    }
  }

  /**
   * Validate if a string is a valid SSH private key
   * @param {string} privateKey - The private key to validate
   * @returns {object} - {valid: boolean, keyType: string|null, encrypted: boolean}
   */
  validatePrivateKey(privateKey) {
    const keyTypes = {
      'BEGIN OPENSSH PRIVATE KEY': 'openssh',
      'BEGIN RSA PRIVATE KEY': 'rsa',
      'BEGIN EC PRIVATE KEY': 'ecdsa',
      'BEGIN PRIVATE KEY': 'pkcs8',
      'BEGIN ENCRYPTED PRIVATE KEY': 'encrypted-pkcs8',
      'BEGIN DSA PRIVATE KEY': 'dsa',
    };

    let detectedType = null;
    let isEncrypted = false;

    for (const [header, type] of Object.entries(keyTypes)) {
      if (privateKey.includes(header)) {
        detectedType = type;
        if (header.includes('ENCRYPTED')) {
          isEncrypted = true;
        }
        break;
      }
    }

    if (!detectedType) {
      return { valid: false, keyType: null, encrypted: false };
    }

    // Check for encryption indicators
    if (privateKey.includes('Proc-Type: 4,ENCRYPTED') ||
        privateKey.includes('DEK-Info:')) {
      isEncrypted = true;
    }

    return {
      valid: true,
      keyType: detectedType,
      encrypted: isEncrypted
    };
  }

  /**
   * Generate public key from private key
   * @param {string} privateKey - The private key
   * @param {string} passphrase - Optional passphrase for encrypted keys
   * @returns {string} - The public key in OpenSSH format
   */
  generatePublicKeyFromPrivate(privateKey, passphrase = '') {
    try {
      console.log('🔑 Attempting to generate public key from private key...');

      // Validate the private key first
      const validation = this.validatePrivateKey(privateKey);
      if (!validation.valid) {
        throw new Error('Invalid private key format');
      }

      console.log(`📋 Detected key type: ${validation.keyType}, Encrypted: ${validation.encrypted}`);

      let keyObject;
      const keyOptions = {
        key: privateKey,
        format: 'pem',
      };

      // Add passphrase if key is encrypted
      if (validation.encrypted && passphrase) {
        keyOptions.passphrase = passphrase;
      }

      try {
        // Try to create private key object
        keyObject = crypto.createPrivateKey(keyOptions);
        console.log('✅ Successfully parsed private key');
      } catch (err1) {
        console.log('⚠️  First attempt failed:', err1.message);

        // Try with empty passphrase
        try {
          keyObject = crypto.createPrivateKey({
            key: privateKey,
            format: 'pem',
            passphrase: '',
          });
          console.log('✅ Parsed with empty passphrase');
        } catch (err2) {
          console.error('❌ All parsing attempts failed');

          if (validation.encrypted) {
            throw new Error('Unable to parse encrypted private key. Please provide the correct passphrase.');
          }
          throw new Error(`Unable to parse private key: ${err2.message}`);
        }
      }

      // Get the public key object
      const publicKeyObject = crypto.createPublicKey(keyObject);

      // Try to export in SSH format (Node.js 15.6.0+)
      try {
        const sshPublicKey = publicKeyObject.export({
          type: 'spki',
          format: 'der'
        });

        // Convert to OpenSSH format
        const result = this.convertToOpenSSHFormat(sshPublicKey, validation.keyType);
        console.log('✅ Public key generated (SSH format):', result.substring(0, 60) + '...');
        return result;
      } catch (exportErr) {
        console.log('⚠️  SSH export failed, using PEM format:', exportErr.message);

        // Fallback: export as PEM and convert
        const pemPublicKey = publicKeyObject.export({
          type: 'spki',
          format: 'pem',
        });

        const base64Key = pemPublicKey
          .replace(/-----BEGIN PUBLIC KEY-----/, '')
          .replace(/-----END PUBLIC KEY-----/, '')
          .replace(/\s/g, '');

        // Determine SSH key type prefix
        let keyTypePrefix = 'ssh-rsa';
        if (validation.keyType === 'ecdsa') {
          keyTypePrefix = 'ecdsa-sha2-nistp256';
        } else if (validation.keyType === 'openssh' && privateKey.includes('ED25519')) {
          keyTypePrefix = 'ssh-ed25519';
        } else if (validation.keyType === 'dsa') {
          keyTypePrefix = 'ssh-dss';
        }

        const result = `${keyTypePrefix} ${base64Key}`;
        console.log('✅ Public key generated (PEM fallback):', result.substring(0, 60) + '...');
        return result;
      }
    } catch (error) {
      console.error('❌ Public key generation error:', error.message);
      throw error;
    }
  }

  /**
   * Convert DER public key to OpenSSH format
   * @param {Buffer} derKey - DER encoded public key
   * @param {string} keyType - Key type (rsa, ecdsa, openssh, etc.)
   * @returns {string} - OpenSSH format public key
   */
  convertToOpenSSHFormat(derKey, keyType) {
    const base64 = derKey.toString('base64');

    let prefix = 'ssh-rsa';
    if (keyType === 'ecdsa') {
      prefix = 'ecdsa-sha2-nistp256';
    } else if (keyType === 'openssh') {
      prefix = 'ssh-ed25519';
    } else if (keyType === 'dsa') {
      prefix = 'ssh-dss';
    }

    return `${prefix} ${base64}`;
  }

  /**
   * Check if master encryption key is set
   * @returns {boolean}
   */
  isSecure() {
    return process.env.SSH_ENCRYPTION_KEY &&
           process.env.SSH_ENCRYPTION_KEY !== 'default-insecure-key-change-me-in-production-32chars';
  }
}

module.exports = new KeyEncryption();

