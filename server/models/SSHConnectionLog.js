const db = require('../database/db');

class SSHConnectionLog {
  static async getAll(limit = 100) {
    return await db.prepare(`
      SELECT cl.*, ss.name as session_name, ss.host, ss.username
      FROM ssh_connection_logs cl
      LEFT JOIN ssh_sessions ss ON cl.session_id = ss.id
      ORDER BY cl.connected_at DESC
      LIMIT ?
    `).all(limit);
  }

  static async getById(id) {
    return await db.prepare(`
      SELECT cl.*, ss.name as session_name, ss.host, ss.username
      FROM ssh_connection_logs cl
      LEFT JOIN ssh_sessions ss ON cl.session_id = ss.id
      WHERE cl.id = ?
    `).get(id);
  }

  static async getBySessionId(sessionId, limit = 50) {
    return await db.prepare(`
      SELECT * FROM ssh_connection_logs
      WHERE session_id = ?
      ORDER BY connected_at DESC
      LIMIT ?
    `).all(sessionId, limit);
  }

  static async create(data) {
    const { session_id } = data;

    const stmt = db.prepare(`
      INSERT INTO ssh_connection_logs (session_id)
      VALUES (?)
    `);

    const result = await stmt.run(session_id);
    return await this.getById(result.lastInsertRowid);
  }

  static async updateDisconnect(id, disconnectReason = null) {
    const stmt = db.prepare(`
      UPDATE ssh_connection_logs SET
        disconnected_at = CURRENT_TIMESTAMP,
        disconnect_reason = ?
      WHERE id = ?
    `);

    await stmt.run(disconnectReason, id);
    return await this.getById(id);
  }

  static async updateStats(id, bytesSent, bytesReceived) {
    const stmt = db.prepare(`
      UPDATE ssh_connection_logs SET
        bytes_sent = ?,
        bytes_received = ?
      WHERE id = ?
    `);

    await stmt.run(bytesSent, bytesReceived, id);
    return await this.getById(id);
  }

  static async getSessionStats(sessionId) {
    const stats = await db.prepare(`
      SELECT 
        COUNT(*) as total_connections,
        SUM(bytes_sent) as total_bytes_sent,
        SUM(bytes_received) as total_bytes_received,
        AVG(
          CASE 
            WHEN disconnected_at IS NOT NULL 
            THEN (julianday(disconnected_at) - julianday(connected_at)) * 86400
            ELSE NULL
          END
        ) as avg_duration_seconds,
        MAX(connected_at) as last_connection
      FROM ssh_connection_logs
      WHERE session_id = ?
    `).get(sessionId);

    return stats;
  }

  static async getRecentConnections(limit = 10) {
    return await db.prepare(`
      SELECT cl.*, ss.name as session_name, ss.host, ss.username
      FROM ssh_connection_logs cl
      LEFT JOIN ssh_sessions ss ON cl.session_id = ss.id
      ORDER BY cl.connected_at DESC
      LIMIT ?
    `).all(limit);
  }

  static async deleteOldLogs(daysToKeep = 30) {
    const stmt = db.prepare(`
      DELETE FROM ssh_connection_logs
      WHERE connected_at < datetime('now', '-' || ? || ' days')
    `);

    const result = await stmt.run(daysToKeep);
    return result.changes;
  }

  static async deleteBySessionId(sessionId) {
    const stmt = db.prepare('DELETE FROM ssh_connection_logs WHERE session_id = ?');
    return await stmt.run(sessionId);
  }
}

module.exports = SSHConnectionLog;

