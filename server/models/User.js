const db = require('../database/db');
const crypto = require('crypto');

/**
 * User roles
 */
const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  MEMBER: 'member',
  VIEWER: 'viewer',
};

/**
 * User statuses
 */
const STATUSES = {
  ACTIVE: 'active',
  PENDING: 'pending',
  DISABLED: 'disabled',
};

class User {
  static async getByUsername(username) {
    return await db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  }

  static async getByEmail(email) {
    return await db.prepare('SELECT * FROM users WHERE email = ?').get(email?.toLowerCase());
  }

  static async getById(id) {
    return await db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }

  static async create(data) {
    const { username, password, email, is_admin, role, status, invited_by } = data;

    // Hash password
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    // Determine role - admin if is_admin flag is set
    const userRole = is_admin ? ROLES.ADMIN : (role || ROLES.MEMBER);

    const stmt = db.prepare(`
      INSERT INTO users (username, password_hash, email, is_admin, role, status, invited_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = await stmt.run(
      username,
      passwordHash,
      email?.toLowerCase() || null,
      is_admin ? 1 : 0,
      userRole,
      status || STATUSES.ACTIVE,
      invited_by || null
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
    return await db.prepare(`
      SELECT id, username, email, is_admin, role, status, last_login, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `).all();
  }

  static async getTeamMembers() {
    return await db.prepare(`
      SELECT
        u.id,
        u.username,
        u.email,
        u.is_admin,
        u.role,
        u.status,
        u.last_login,
        u.created_at,
        inv.username as invited_by_username
      FROM users u
      LEFT JOIN users inv ON u.invited_by = inv.id
      ORDER BY u.created_at DESC
    `).all();
  }

  static async update(id, data) {
    const { name, username, password, email, two_factor_enabled, two_factor_secret, role, status, last_login } = data;
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (username !== undefined) {
      updates.push('username = ?');
      values.push(username);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email?.toLowerCase() || null);
    }
    if (password !== undefined && password.length > 0) {
      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
      updates.push('password_hash = ?');
      values.push(passwordHash);
    }
    if (two_factor_enabled !== undefined) {
      updates.push('two_factor_enabled = ?');
      values.push(two_factor_enabled ? 1 : 0);
    }
    if (two_factor_secret !== undefined) {
      updates.push('two_factor_secret = ?');
      values.push(two_factor_secret);
    }
    if (role !== undefined) {
      updates.push('role = ?');
      values.push(role);
      // Update is_admin based on role
      updates.push('is_admin = ?');
      values.push(role === ROLES.ADMIN ? 1 : 0);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (last_login !== undefined) {
      updates.push('last_login = ?');
      values.push(last_login);
    }

    if (updates.length === 0) {
      return await this.getById(id);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await db.prepare(sql).run(...values);

    return await this.getById(id);
  }

  static async updateLastLogin(id) {
    const stmt = db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?');
    await stmt.run(id);
  }

  static async changeRole(id, role) {
    return await this.update(id, { role });
  }

  static async disable(id) {
    return await this.update(id, { status: STATUSES.DISABLED });
  }

  static async enable(id) {
    return await this.update(id, { status: STATUSES.ACTIVE });
  }

  static async delete(id) {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = await stmt.run(id);
    return result.changes > 0;
  }

  static async count() {
    const result = await db.prepare('SELECT COUNT(*) as count FROM users').get();
    return result?.count || 0;
  }

  static async countActive() {
    const result = await db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'active'").get();
    return result?.count || 0;
  }

  /**
   * Check if user has permission based on role
   * @param {Object} user - User object
   * @param {string} permission - Permission to check
   * @returns {boolean}
   */
  static hasPermission(user, permission) {
    const rolePermissions = {
      [ROLES.ADMIN]: ['*'], // All permissions
      [ROLES.MANAGER]: ['view', 'create', 'edit', 'delete', 'connect', 'manage_sessions', 'view_logs'],
      [ROLES.MEMBER]: ['view', 'create', 'edit', 'connect'],
      [ROLES.VIEWER]: ['view', 'connect'],
    };

    const userRole = user.role || ROLES.MEMBER;
    const permissions = rolePermissions[userRole] || [];

    return permissions.includes('*') || permissions.includes(permission);
  }
}

// Export roles and statuses
User.ROLES = ROLES;
User.STATUSES = STATUSES;

module.exports = User;

