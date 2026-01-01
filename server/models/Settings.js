const db = require('../database/db');

class Settings {
  static async get(key) {
    const result = await db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return result ? result.value : null;
  }

  static async getAll() {
    const results = await db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    results.forEach((row) => {
      settings[row.key] = row.value;
    });
    return settings;
  }

  static async set(key, value) {
    const stmt = db.prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP'
    );
    await stmt.run(key, value, value);
    return await this.get(key);
  }
}

module.exports = Settings;


