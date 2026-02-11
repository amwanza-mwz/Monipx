const db = require('../database/db');

/**
 * Activity Log Categories
 */
const CATEGORIES = {
  AUTH: 'auth',           // Login, logout, 2FA
  USER: 'user',           // User management
  TEAM: 'team',           // Team invitations
  SESSION: 'session',     // SSH sessions CRUD
  TERMINAL: 'terminal',   // Terminal connections
  KEY: 'key',             // SSH key management
  SETTINGS: 'settings',   // System settings
  NETWORK: 'network',     // Subnet/IP management
  MONITOR: 'monitor',     // Monitoring configuration
};

/**
 * Activity Log Actions
 */
const ACTIONS = {
  // Auth
  LOGIN: 'login',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  ENABLE_2FA: 'enable_2fa',
  DISABLE_2FA: 'disable_2fa',

  // User/Team
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  INVITE: 'invite',
  ACCEPT_INVITE: 'accept_invite',
  REVOKE_INVITE: 'revoke_invite',
  CHANGE_ROLE: 'change_role',
  DISABLE: 'disable',
  ENABLE: 'enable',

  // Terminal
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  EXECUTE_COMMAND: 'execute_command',

  // General
  VIEW: 'view',
  EXPORT: 'export',
  IMPORT: 'import',
};

class ActivityLog {
  /**
   * Log an activity
   * @param {Object} data - Activity data
   * @param {number} data.userId - User ID (optional for failed logins)
   * @param {string} data.username - Username
   * @param {string} data.action - Action performed
   * @param {string} data.category - Category of action
   * @param {string} data.resourceType - Type of resource (optional)
   * @param {string|number} data.resourceId - ID of resource (optional)
   * @param {string} data.resourceName - Name of resource (optional)
   * @param {Object} data.details - Additional details (optional)
   * @param {string} data.ipAddress - IP address (optional)
   * @param {string} data.userAgent - User agent (optional)
   * @returns {Promise<Object>}
   */
  static async log(data) {
    const {
      userId,
      username,
      action,
      category,
      resourceType,
      resourceId,
      resourceName,
      details,
      ipAddress,
      userAgent,
    } = data;

    const stmt = db.prepare(`
      INSERT INTO activity_logs
      (user_id, username, action, category, resource_type, resource_id, resource_name, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = await stmt.run(
      userId || null,
      username || null,
      action,
      category,
      resourceType || null,
      resourceId ? String(resourceId) : null,
      resourceName || null,
      details ? JSON.stringify(details) : null,
      ipAddress || null,
      userAgent || null
    );

    return { id: result.lastInsertRowid };
  }

  /**
   * Get activity logs with pagination and filters
   * @param {Object} options - Query options
   * @returns {Promise<{logs: Array, total: number}>}
   */
  static async getAll(options = {}) {
    const {
      page = 1,
      limit = 50,
      userId,
      category,
      action,
      startDate,
      endDate,
      search,
    } = options;

    let whereClause = '1=1';
    const params = [];

    if (userId) {
      whereClause += ' AND al.user_id = ?';
      params.push(userId);
    }

    if (category) {
      whereClause += ' AND al.category = ?';
      params.push(category);
    }

    if (action) {
      whereClause += ' AND al.action = ?';
      params.push(action);
    }

    if (startDate) {
      whereClause += ' AND al.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND al.created_at <= ?';
      params.push(endDate);
    }

    if (search) {
      whereClause += ' AND (al.username LIKE ? OR al.resource_name LIKE ? OR al.details LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // Get total count (use simpler query without join)
    const countWhereClause = whereClause.replace(/al\./g, '');
    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM activity_logs WHERE ${countWhereClause}`);
    const countResult = await countStmt.get(...params);
    const total = countResult?.total || 0;

    // Get paginated logs
    const offset = (page - 1) * limit;
    const logsStmt = db.prepare(`
      SELECT
        al.*,
        u.email as user_email
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `);

    const logs = await logsStmt.all(...params, limit, offset);

    // Parse details JSON
    const parsedLogs = logs.map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    }));

    return { logs: parsedLogs, total };
  }

  /**
   * Get recent activity for a user
   * @param {number} userId - User ID
   * @param {number} limit - Number of logs to return
   * @returns {Promise<Array>}
   */
  static async getRecentByUser(userId, limit = 10) {
    const stmt = db.prepare(`
      SELECT * FROM activity_logs
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);

    const logs = await stmt.all(userId, limit);

    return logs.map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    }));
  }

  /**
   * Get activity summary for dashboard
   * @param {number} days - Number of days to look back
   * @returns {Promise<Object>}
   */
  static async getSummary(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString();

    // Get counts by category
    const categoryStmt = db.prepare(`
      SELECT category, COUNT(*) as count
      FROM activity_logs
      WHERE created_at >= ?
      GROUP BY category
    `);
    const categoryCounts = await categoryStmt.all(startDateStr);

    // Get login activity
    const loginStmt = db.prepare(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count
      FROM activity_logs
      WHERE action = 'login' AND created_at >= ?
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    const loginActivity = await loginStmt.all(startDateStr);

    // Get most active users
    const activeUsersStmt = db.prepare(`
      SELECT
        user_id,
        username,
        COUNT(*) as activity_count
      FROM activity_logs
      WHERE created_at >= ? AND user_id IS NOT NULL
      GROUP BY user_id
      ORDER BY activity_count DESC
      LIMIT 5
    `);
    const activeUsers = await activeUsersStmt.all(startDateStr);

    return {
      categoryCounts,
      loginActivity,
      activeUsers,
    };
  }

  /**
   * Delete old logs (cleanup)
   * @param {number} daysToKeep - Number of days to keep
   * @returns {Promise<number>} - Number of deleted logs
   */
  static async cleanup(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffDateStr = cutoffDate.toISOString();

    const stmt = db.prepare(`DELETE FROM activity_logs WHERE created_at < ?`);
    const result = await stmt.run(cutoffDateStr);

    return result.changes;
  }
}

// Export categories and actions for use in other modules
ActivityLog.CATEGORIES = CATEGORIES;
ActivityLog.ACTIONS = ACTIONS;

module.exports = ActivityLog;
