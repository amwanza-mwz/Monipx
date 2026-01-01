const db = require('../database/db');

class Monitor {
  static async getAll() {
    return await db.prepare('SELECT * FROM monitors ORDER BY created_at DESC').all();
  }

  static async getById(id) {
    return await db.prepare('SELECT * FROM monitors WHERE id = ?').get(id);
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
    } = data;

    const stmt = db.prepare(`
      INSERT INTO monitors (
        name, type, target, subnet_id, port, interval, timeout,
        enabled, expected_status_code, expected_keyword
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = await stmt.run(
      name,
      type,
      target,
      subnet_id || null,
      port || null,
      interval || 20,
      timeout || 5000,
      enabled !== undefined ? (enabled ? 1 : 0) : 1,
      expected_status_code || null,
      expected_keyword || null
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
}

module.exports = Monitor;


