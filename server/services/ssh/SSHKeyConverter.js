const crypto = require('crypto');
const { sshKeyToPEM } = require('ssh2');

/**
 * SSH Key Format Converter
 * Converts various SSH key formats to ssh2-compatible format
 */
class SSHKeyConverter {
  /**
   * Convert SSH private key to ssh2-compatible format
   * @param {string} privateKey - Private key in any format
   * @param {string} passphrase - Optional passphrase
   * @returns {Buffer|string} - Converted private key
   */
  static convertPrivateKey(privateKey, passphrase = null) {
    try {
      console.log('🔄 Converting SSH private key...');
      
      // Remove any extra whitespace
      privateKey = privateKey.trim();
      
      // Check if it's already in PEM format
      if (privateKey.includes('BEGIN') && privateKey.includes('PRIVATE KEY')) {
        console.log('✅ Key is already in PEM format');
        
        // Try to parse it to ensure it's valid
        try {
          const keyObject = crypto.createPrivateKey({
            key: privateKey,
            format: 'pem',
            passphrase: passphrase || undefined
          });
          
          // Re-export in PKCS8 format (most compatible)
          const convertedKey = keyObject.export({
            type: 'pkcs8',
            format: 'pem'
          });
          
          console.log('✅ Key converted to PKCS8 format');
          return convertedKey;
        } catch (err) {
          console.error('❌ Failed to parse PEM key:', err.message);
          // Return original if conversion fails
          return privateKey;
        }
      }
      
      // Check if it's OpenSSH format (starts with "-----BEGIN OPENSSH PRIVATE KEY-----")
      if (privateKey.includes('BEGIN OPENSSH PRIVATE KEY')) {
        console.log('🔄 Converting OpenSSH format to PEM...');
        
        try {
          // ssh2 library can handle OpenSSH format directly
          // Just return it as-is
          return privateKey;
        } catch (err) {
          console.error('❌ Failed to convert OpenSSH key:', err.message);
          throw new Error('Unsupported OpenSSH key format');
        }
      }
      
      // If we get here, format is unknown
      console.warn('⚠️  Unknown key format, returning as-is');
      return privateKey;
      
    } catch (error) {
      console.error('❌ Key conversion failed:', error.message);
      throw error;
    }
  }

  /**
   * Validate SSH private key format
   * @param {string} privateKey - Private key to validate
   * @param {string} passphrase - Optional passphrase for encrypted keys
   * @returns {object} - Validation result with details
   */
  static validatePrivateKey(privateKey, passphrase = null) {
    const result = {
      valid: false,
      format: 'unknown',
      encrypted: false,
      keyType: 'unknown',
      errors: []
    };

    try {
      privateKey = privateKey.trim();

      // Check for encryption indicators first
      if (privateKey.includes('ENCRYPTED') ||
          privateKey.includes('Proc-Type: 4,ENCRYPTED') ||
          privateKey.includes('DEK-Info:')) {
        result.encrypted = true;
      }

      // Check for PEM format
      if (privateKey.includes('BEGIN') && privateKey.includes('PRIVATE KEY')) {
        result.format = 'PEM';

        // Determine key type
        if (privateKey.includes('RSA PRIVATE KEY')) {
          result.keyType = 'RSA';
        } else if (privateKey.includes('EC PRIVATE KEY')) {
          result.keyType = 'ECDSA';
        } else if (privateKey.includes('DSA PRIVATE KEY')) {
          result.keyType = 'DSA';
        } else if (privateKey.includes('OPENSSH PRIVATE KEY')) {
          result.keyType = 'OpenSSH';
          result.format = 'OpenSSH';
        } else if (privateKey.includes('PRIVATE KEY')) {
          result.keyType = 'PKCS8';
        }

        // Try to parse with passphrase if provided
        try {
          const keyOptions = {
            key: privateKey,
            format: 'pem'
          };

          if (passphrase) {
            keyOptions.passphrase = passphrase;
          }

          crypto.createPrivateKey(keyOptions);
          result.valid = true;
        } catch (err) {
          if (err.message.includes('passphrase') || err.message.includes('bad decrypt')) {
            result.encrypted = true;
            if (!passphrase) {
              result.errors.push('Key is encrypted and requires a passphrase');
            } else {
              result.errors.push('Invalid passphrase or corrupted key');
            }
          } else if (err.message.includes('unsupported')) {
            // Key format is recognized but not supported by Node.js crypto
            // This is OK - we'll mark it as valid and let ssh2 handle it
            result.valid = true;
            result.errors.push('Key format may require special handling (will be attempted during connection)');
          } else {
            result.errors.push(err.message);
          }
        }
      } else if (privateKey.includes('BEGIN OPENSSH PRIVATE KEY')) {
        result.format = 'OpenSSH';
        result.keyType = 'OpenSSH';
        // OpenSSH format is always valid (ssh2 will handle it)
        result.valid = true;
      } else {
        result.errors.push('Unknown key format');
      }

    } catch (error) {
      result.errors.push(error.message);
    }

    return result;
  }

  /**
   * Extract public key from private key
   * @param {string} privateKey - Private key
   * @param {string} passphrase - Optional passphrase
   * @returns {string} - Public key in SSH format
   */
  static extractPublicKey(privateKey, passphrase = null) {
    try {
      const keyObject = crypto.createPrivateKey({
        key: privateKey,
        format: 'pem',
        passphrase: passphrase || undefined
      });

      const publicKey = crypto.createPublicKey(keyObject);
      return publicKey.export({
        type: 'spki',
        format: 'pem'
      });
    } catch (error) {
      console.error('❌ Failed to extract public key:', error.message);
      throw error;
    }
  }
}

module.exports = SSHKeyConverter;

