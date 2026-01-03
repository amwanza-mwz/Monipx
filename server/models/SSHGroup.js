const db = require('../database/db');

class SSHGroup {
  /**
   * Get all SSH groups
   */
  static async getAll() {
    return await db.prepare('SELECT * FROM ssh_groups ORDER BY name').all();
  }

  /**
   * Get SSH group by ID
   */
  static async getById(id) {
    return await db.prepare('SELECT * FROM ssh_groups WHERE id = ?').get(id);
  }

  /**
   * Get SSH group by name
   */
  static async getByName(name) {
    return await db.prepare('SELECT * FROM ssh_groups WHERE name = ?').get(name);
  }

  /**
   * Create new SSH group
   */
  static async create(data) {
    const { name, description, color, icon } = data;

    if (!name || !name.trim()) {
      throw new Error('Group name is required');
    }

    // Check if group already exists
    const existing = await this.getByName(name.trim());
    if (existing) {
      throw new Error('Group with this name already exists');
    }

    const stmt = db.prepare(`
      INSERT INTO ssh_groups (name, description, color, icon)
      VALUES (?, ?, ?, ?)
    `);

    const result = await stmt.run(
      name.trim(),
      description?.trim() || null,
      color || '#007acc',
      icon || 'folder'
    );

    return await this.getById(result.lastInsertRowid);
  }

  /**
   * Update SSH group
   */
  static async update(id, data) {
    const { name, description, color, icon } = data;

    const stmt = db.prepare(`
      UPDATE ssh_groups SET
        name = ?,
        description = ?,
        color = ?,
        icon = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    await stmt.run(
      name?.trim(),
      description?.trim() || null,
      color || '#007acc',
      icon || 'folder',
      id
    );

    return await this.getById(id);
  }

  /**
   * Delete SSH group
   */
  static async delete(id) {
    // Check if group has sessions
    const sessionsCount = await db.prepare(
      'SELECT COUNT(*) as count FROM ssh_sessions WHERE group_name = (SELECT name FROM ssh_groups WHERE id = ?)'
    ).get(id);

    if (sessionsCount && sessionsCount.count > 0) {
      throw new Error('Cannot delete group with existing sessions. Please move or delete sessions first.');
    }

    const stmt = db.prepare('DELETE FROM ssh_groups WHERE id = ?');
    await stmt.run(id);
  }

  /**
   * Get group with session count
   */
  static async getAllWithCounts() {
    const groups = await db.prepare(`
      SELECT 
        g.*,
        COUNT(s.id) as session_count
      FROM ssh_groups g
      LEFT JOIN ssh_sessions s ON s.group_name = g.name
      GROUP BY g.id
      ORDER BY g.name
    `).all();

    return groups;
  }
}

module.exports = SSHGroup;

