const db = require('../database/db');

class Monitor {
  static async getAll() {
    const monitors = await db.prepare('SELECT * FROM monitors ORDER BY created_at DESC').all();

    // Enrich each monitor with latest response time from history
    for (const monitor of monitors) {
      const latestHistory = await db.prepare(`
        SELECT response_time
        FROM monitoring_history
        WHERE monitor_id = ?
        ORDER BY checked_at DESC
        LIMIT 1
      `).get(monitor.id);

      monitor.response_time = latestHistory?.response_time || null;
    }

    return monitors;
  }

  static async getById(id) {
    const monitor = await db.prepare('SELECT * FROM monitors WHERE id = ?').get(id);

    if (monitor) {
      // Enrich with latest response time from history
      const latestHistory = await db.prepare(`
        SELECT response_time
        FROM monitoring_history
        WHERE monitor_id = ?
        ORDER BY checked_at DESC
        LIMIT 1
      `).get(id);

      monitor.response_time = latestHistory?.response_time || null;
      monitor.last_response_time = monitor.response_time; // Alias for compatibility
    }

    return monitor;
  }

  static async create(data) {
    const {
      name,
      type,
      target,
      subnet_id,
      port,
      interval,
      timeout,
      enabled,
      expected_status_code,
      expected_keyword,
      group_name,
      description,
      notification_enabled,
      docker_container_name,
      docker_host,
      database_type,
      database_name,
      database_username,
      database_password,
    } = data;

    const stmt = db.prepare(`
      INSERT INTO monitors (
        name, type, target, subnet_id, port, interval, timeout,
        enabled, expected_status_code, expected_keyword, group_name,
        description, notification_enabled, docker_container_name, docker_host,
        database_type, database_name, database_username, database_password
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = await stmt.run(
      name,
      type,
      target,
      subnet_id || null,
      port || null,
      interval || 60,
      timeout || 5000,
      enabled !== undefined ? (enabled ? 1 : 0) : 1,
      expected_status_code || null,
      expected_keyword || null,
      group_name || null,
      description || null,
      notification_enabled !== undefined ? (notification_enabled ? 1 : 0) : 0,
      docker_container_name || null,
      docker_host || null,
      database_type || null,
      database_name || null,
      database_username || null,
      database_password || null
    );

    return await this.getById(result.lastInsertRowid);
  }

  static async update(id, data) {
    const {
      name,
      type,
      target,
      subnet_id,
      port,
      interval,
      timeout,
      enabled,
      expected_status_code,
      expected_keyword,
    } = data;

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (type !== undefined) {
      updates.push('type = ?');
      values.push(type);
    }
    if (target !== undefined) {
      updates.push('target = ?');
      values.push(target);
    }
    if (subnet_id !== undefined) {
      updates.push('subnet_id = ?');
      values.push(subnet_id || null);
    }
    if (port !== undefined) {
      updates.push('port = ?');
      values.push(port || null);
    }
    if (interval !== undefined) {
      updates.push('interval = ?');
      values.push(interval);
    }
    if (timeout !== undefined) {
      updates.push('timeout = ?');
      values.push(timeout);
    }
    if (enabled !== undefined) {
      updates.push('enabled = ?');
      values.push(enabled ? 1 : 0);
    }
    if (expected_status_code !== undefined) {
      updates.push('expected_status_code = ?');
      values.push(expected_status_code || null);
    }
    if (expected_keyword !== undefined) {
      updates.push('expected_keyword = ?');
      values.push(expected_keyword || null);
    }

    if (updates.length === 0) {
      return await this.getById(id);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const sql = `UPDATE monitors SET ${updates.join(', ')} WHERE id = ?`;
    await db.prepare(sql).run(...values);

    return await this.getById(id);
  }

  static async delete(id) {
    return await db.prepare('DELETE FROM monitors WHERE id = ?').run(id);
  }

  static async getHistory(monitorId, limit = 100) {
    return await db
      .prepare(
        'SELECT * FROM monitoring_history WHERE monitor_id = ? ORDER BY checked_at DESC LIMIT ?'
      )
      .all(monitorId, limit);
  }

  static async addHistory(data) {
    const { monitor_id, status, response_time, status_code, error_message } = data;

    const stmt = db.prepare(`
      INSERT INTO monitoring_history (monitor_id, status, response_time, status_code, error_message)
      VALUES (?, ?, ?, ?, ?)
    `);

    return await stmt.run(monitor_id, status, response_time || null, status_code || null, error_message || null);
  }

  static async updateStatus(id, status, responseTime = null, statusCode = null, errorMessage = null) {
    const monitor = await this.getById(id);
    if (!monitor) return null;

    // Update total checks
    const totalChecks = (monitor.total_checks || 0) + 1;
    const failedChecks = status === 'down' ? (monitor.failed_checks || 0) + 1 : (monitor.failed_checks || 0);
    const uptimePercentage = ((totalChecks - failedChecks) / totalChecks) * 100;

    // Check if status changed
    const statusChanged = monitor.status !== status;

    const stmt = db.prepare(`
      UPDATE monitors
      SET status = ?,
          last_check_at = CURRENT_TIMESTAMP,
          last_status_change = CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE last_status_change END,
          total_checks = ?,
          failed_checks = ?,
          uptime_percentage = ?
      WHERE id = ?
    `);

    await stmt.run(status, statusChanged ? 1 : 0, totalChecks, failedChecks, uptimePercentage, id);

    // Add to history
    await this.addHistory({
      monitor_id: id,
      status,
      response_time: responseTime,
      status_code: statusCode,
      error_message: errorMessage,
    });

    return await this.getById(id);
  }

  static async getByGroup(groupName) {
    return await db.prepare('SELECT * FROM monitors WHERE group_name = ? ORDER BY name').all(groupName);
  }

  static async getAllGroups() {
    const result = await db.prepare('SELECT DISTINCT group_name FROM monitors WHERE group_name IS NOT NULL ORDER BY group_name').all();
    return result.map(r => r.group_name);
  }

  static async getStatsByGroup(groupName) {
    const monitors = await this.getByGroup(groupName);
    const total = monitors.length;
    const up = monitors.filter(m => m.status === 'up').length;
    const down = monitors.filter(m => m.status === 'down').length;
    const unknown = monitors.filter(m => m.status === 'unknown').length;
    const avgUptime = monitors.reduce((sum, m) => sum + (m.uptime_percentage || 0), 0) / (total || 1);

    return { total, up, down, unknown, avgUptime };
  }

  static async getUptimeStats(monitorId, hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const history = await db.prepare(`
      SELECT status, COUNT(*) as count
      FROM monitoring_history
      WHERE monitor_id = ? AND checked_at >= ?
      GROUP BY status
    `).all(monitorId, since);

    const total = history.reduce((sum, h) => sum + h.count, 0);
    const up = history.find(h => h.status === 'up')?.count || 0;
    const uptime = total > 0 ? (up / total) * 100 : 0;

    return { total, up, uptime, hours };
  }
}

module.exports = Monitor;


