const db = require('../database/db');
const crypto = require('crypto');

class User {
  static async getByUsername(username) {
    return await db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  }

  static async getById(id) {
    return await db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }

  static async create(data) {
    const { username, password, email, is_admin } = data;
    
    // Hash password
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    
    const stmt = db.prepare(`
      INSERT INTO users (username, password_hash, email, is_admin)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = await stmt.run(
      username,
      passwordHash,
      email || null,
      is_admin ? 1 : 0
    );
    
    return await this.getById(result.lastInsertRowid);
  }

  static async verifyPassword(username, password) {
    const user = await this.getByUsername(username);
    if (!user) return false;
    
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    return user.password_hash === passwordHash;
  }

  static async hasAdmin() {
    const admin = await db.prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = 1').get();
    return admin.count > 0;
  }

  static async getAll() {
    return await db.prepare('SELECT id, username, email, is_admin, created_at FROM users ORDER BY created_at DESC').all();
  }
}

module.exports = User;

