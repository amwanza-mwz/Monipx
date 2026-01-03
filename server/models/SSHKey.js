const db = require('../database/db');

class SSHKey {
  static async getAll() {
    // Return all keys but exclude the encrypted private key and passphrase from the list
    const keys = await db.prepare(`
      SELECT id, name, key_type, fingerprint, public_key, has_passphrase, created_at
      FROM ssh_keys
      ORDER BY created_at DESC
    `).all();
    return keys;
  }

  static async getById(id) {
    // Return full key including encrypted private key and passphrase
    return await db.prepare('SELECT * FROM ssh_keys WHERE id = ?').get(id);
  }

  static async getByIdPublicOnly(id) {
    // Return key without encrypted private key and passphrase
    return await db.prepare(`
      SELECT id, name, key_type, fingerprint, public_key, has_passphrase, created_at
      FROM ssh_keys
      WHERE id = ?
    `).get(id);
  }

  static async create(data) {
    const {
      name,
      key_type,
      fingerprint,
      encrypted_private_key,
      public_key,
      has_passphrase,
      encrypted_passphrase,
    } = data;

    const stmt = db.prepare(`
      INSERT INTO ssh_keys (
        name, key_type, fingerprint, encrypted_private_key, public_key, has_passphrase, encrypted_passphrase
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = await stmt.run(
      name,
      key_type,
      fingerprint,
      encrypted_private_key,
      public_key,
      has_passphrase !== undefined ? (has_passphrase ? 1 : 0) : 0,
      encrypted_passphrase || null
    );

    return await this.getByIdPublicOnly(result.lastInsertRowid);
  }

  static async update(id, data) {
    const {
      name,
      key_type,
      fingerprint,
      encrypted_private_key,
      public_key,
      has_passphrase,
      encrypted_passphrase,
    } = data;

    const stmt = db.prepare(`
      UPDATE ssh_keys SET
        name = ?,
        key_type = ?,
        fingerprint = ?,
        encrypted_private_key = ?,
        public_key = ?,
        has_passphrase = ?,
        encrypted_passphrase = ?
      WHERE id = ?
    `);

    await stmt.run(
      name,
      key_type,
      fingerprint,
      encrypted_private_key,
      public_key,
      has_passphrase !== undefined ? (has_passphrase ? 1 : 0) : 0,
      encrypted_passphrase || null,
      id
    );

    return await this.getByIdPublicOnly(id);
  }

  static async updatePassphrase(id, encryptedPassphrase, hasPassphrase) {
    const stmt = db.prepare(`
      UPDATE ssh_keys SET
        encrypted_passphrase = ?,
        has_passphrase = ?
      WHERE id = ?
    `);

    await stmt.run(
      encryptedPassphrase,
      hasPassphrase ? 1 : 0,
      id
    );

    return await this.getByIdPublicOnly(id);
  }

  static async delete(id) {
    // Check if any sessions are using this key
    const sessionsUsingKey = await db.prepare(
      'SELECT COUNT(*) as count FROM ssh_sessions WHERE ssh_key_id = ?'
    ).get(id);

    if (sessionsUsingKey.count > 0) {
      throw new Error(`Cannot delete key: ${sessionsUsingKey.count} session(s) are using this key`);
    }

    const stmt = db.prepare('DELETE FROM ssh_keys WHERE id = ?');
    return await stmt.run(id);
  }

  static async getPublicKey(id) {
    const result = await db.prepare('SELECT public_key FROM ssh_keys WHERE id = ?').get(id);
    return result?.public_key || null;
  }

  static async getEncryptedPrivateKey(id) {
    const result = await db.prepare('SELECT encrypted_private_key FROM ssh_keys WHERE id = ?').get(id);
    return result?.encrypted_private_key || null;
  }

  static async isKeyInUse(id) {
    const result = await db.prepare(
      'SELECT COUNT(*) as count FROM ssh_sessions WHERE ssh_key_id = ?'
    ).get(id);
    return result.count > 0;
  }
}

module.exports = SSHKey;

