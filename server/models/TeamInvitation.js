const db = require('../database/db');
const crypto = require('crypto');

class TeamInvitation {
  /**
   * Create a new team invitation
   * @param {Object} data - Invitation data
   * @param {string} data.email - Email to invite
   * @param {string} data.role - Role for the invited user
   * @param {number} data.invitedBy - User ID of inviter
   * @param {number} data.expiresInDays - Days until expiration (default 7)
   * @returns {Promise<Object>}
   */
  static async create(data) {
    const { email, role = 'member', invitedBy, expiresInDays = 7 } = data;

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const stmt = db.prepare(`
      INSERT INTO team_invitations (email, role, token, invited_by, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = await stmt.run(
      email.toLowerCase(),
      role,
      token,
      invitedBy,
      expiresAt.toISOString()
    );

    return this.getById(result.lastInsertRowid);
  }

  /**
   * Get invitation by ID
   * @param {number} id - Invitation ID
   * @returns {Promise<Object|null>}
   */
  static async getById(id) {
    const stmt = db.prepare(`
      SELECT ti.*, u.username as invited_by_username
      FROM team_invitations ti
      LEFT JOIN users u ON ti.invited_by = u.id
      WHERE ti.id = ?
    `);
    return await stmt.get(id);
  }

  /**
   * Get invitation by token
   * @param {string} token - Invitation token
   * @returns {Promise<Object|null>}
   */
  static async getByToken(token) {
    const stmt = db.prepare(`
      SELECT ti.*, u.username as invited_by_username
      FROM team_invitations ti
      LEFT JOIN users u ON ti.invited_by = u.id
      WHERE ti.token = ?
    `);
    return await stmt.get(token);
  }

  /**
   * Get invitation by email
   * @param {string} email - Email address
   * @returns {Promise<Object|null>}
   */
  static async getByEmail(email) {
    const stmt = db.prepare(`
      SELECT ti.*, u.username as invited_by_username
      FROM team_invitations ti
      LEFT JOIN users u ON ti.invited_by = u.id
      WHERE ti.email = ? AND ti.used_at IS NULL
    `);
    return await stmt.get(email.toLowerCase());
  }

  /**
   * Get all pending invitations
   * @returns {Promise<Array>}
   */
  static async getAllPending() {
    const stmt = db.prepare(`
      SELECT ti.*, u.username as invited_by_username
      FROM team_invitations ti
      LEFT JOIN users u ON ti.invited_by = u.id
      WHERE ti.used_at IS NULL AND ti.expires_at > datetime('now')
      ORDER BY ti.created_at DESC
    `);
    return await stmt.all();
  }

  /**
   * Mark invitation as used
   * @param {number} id - Invitation ID
   * @returns {Promise<Object>}
   */
  static async markAsUsed(id) {
    const stmt = db.prepare(`
      UPDATE team_invitations
      SET used_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    await stmt.run(id);
    return this.getById(id);
  }

  /**
   * Delete invitation
   * @param {number} id - Invitation ID
   * @returns {Promise<boolean>}
   */
  static async delete(id) {
    const stmt = db.prepare('DELETE FROM team_invitations WHERE id = ?');
    const result = await stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Check if invitation is valid (not expired, not used)
   * @param {Object} invitation - Invitation object
   * @returns {boolean}
   */
  static isValid(invitation) {
    if (!invitation) return false;
    if (invitation.used_at) return false;

    const expiresAt = new Date(invitation.expires_at);
    return expiresAt > new Date();
  }

  /**
   * Cleanup expired invitations
   * @returns {Promise<number>} - Number of deleted invitations
   */
  static async cleanupExpired() {
    const stmt = db.prepare(`
      DELETE FROM team_invitations
      WHERE expires_at < datetime('now') AND used_at IS NULL
    `);
    const result = await stmt.run();
    return result.changes;
  }
}

module.exports = TeamInvitation;
