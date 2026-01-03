const db = require('../database/db-sync');

class ActiveTerminalSession {
  /**
   * Get all active terminal sessions
   * @returns {Promise<Array>}
   */
  static async getAll() {
    const stmt = db.prepare(`
      SELECT ats.*, ss.name, ss.host, ss.username, ss.group_name
      FROM active_terminal_sessions ats
      JOIN ssh_sessions ss ON ats.ssh_session_id = ss.id
      ORDER BY ats.created_at ASC
    `);
    return await stmt.all();
  }

  /**
   * Get active session by tab ID
   * @param {string} tabId
   * @returns {Promise<object|null>}
   */
  static async getByTabId(tabId) {
    const stmt = db.prepare(`
      SELECT ats.*, ss.name, ss.host, ss.username, ss.group_name
      FROM active_terminal_sessions ats
      JOIN ssh_sessions ss ON ats.ssh_session_id = ss.id
      WHERE ats.tab_id = ?
    `);
    return await stmt.get(tabId);
  }

  /**
   * Create new active terminal session
   * @param {object} data
   * @returns {Promise<object>}
   */
  static async create(data) {
    const { tab_id, ssh_session_id, status } = data;

    const stmt = db.prepare(`
      INSERT INTO active_terminal_sessions (tab_id, ssh_session_id, status)
      VALUES (?, ?, ?)
    `);

    const result = await stmt.run(
      tab_id,
      ssh_session_id,
      status || 'connecting'
    );

    return await this.getByTabId(tab_id);
  }

  /**
   * Update active terminal session status
   * @param {string} tabId
   * @param {string} status
   * @returns {Promise<object>}
   */
  static async updateStatus(tabId, status) {
    const stmt = db.prepare(`
      UPDATE active_terminal_sessions 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE tab_id = ?
    `);

    await stmt.run(status, tabId);
    return await this.getByTabId(tabId);
  }

  /**
   * Delete active terminal session
   * @param {string} tabId
   * @returns {Promise<void>}
   */
  static async delete(tabId) {
    const stmt = db.prepare('DELETE FROM active_terminal_sessions WHERE tab_id = ?');
    return await stmt.run(tabId);
  }

  /**
   * Delete all active terminal sessions
   * @returns {Promise<void>}
   */
  static async deleteAll() {
    const stmt = db.prepare('DELETE FROM active_terminal_sessions');
    return await stmt.run();
  }

  /**
   * Get active sessions for a specific SSH session
   * @param {number} sshSessionId
   * @returns {Promise<Array>}
   */
  static async getBySshSessionId(sshSessionId) {
    const stmt = db.prepare(`
      SELECT * FROM active_terminal_sessions 
      WHERE ssh_session_id = ?
    `);
    return await stmt.all(sshSessionId);
  }
}

module.exports = ActiveTerminalSession;

