const db = require('../database/db');
const { parseCIDR, generateIPs } = require('../utils/ip-utils');

class Subnet {
  static async getAll() {
    return await db.prepare('SELECT * FROM subnets ORDER BY created_at DESC').all();
  }

  static async getById(id) {
    return await db.prepare('SELECT * FROM subnets WHERE id = ?').get(id);
  }

  static async create(data) {
    const { name, subnet, description, tags, scan_enabled, scan_interval, monitoring_enabled } = data;

    // Parse CIDR notation
    const networkInfo = parseCIDR(subnet);

    const stmt = db.prepare(`
      INSERT INTO subnets (
        name, subnet, cidr, network_address, total_ips,
        description, tags, scan_enabled, scan_interval, monitoring_enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = await stmt.run(
      name,
      subnet,
      networkInfo.cidr,
      networkInfo.network,
      networkInfo.usableIPs,
      description || null,
      tags ? JSON.stringify(tags) : null,
      scan_enabled !== undefined ? (scan_enabled ? 1 : 0) : 1,
      scan_interval || 1800,
      monitoring_enabled !== undefined ? (monitoring_enabled ? 1 : 0) : 1
    );

    const subnetId = result.lastInsertRowid;

    // Generate and insert all IP addresses for this subnet
    const ips = generateIPs(networkInfo.network, networkInfo.cidr);
    const ipStmt = db.prepare(`
      INSERT INTO ip_addresses (subnet_id, ip_address, status)
      VALUES (?, ?, 'unknown')
    `);

    // Insert IPs sequentially
    for (const ip of ips) {
      await ipStmt.run(subnetId, ip);
    }

    return await this.getById(subnetId);
  }

  static async update(id, data) {
    const { name, description, tags, scan_enabled, scan_interval, monitoring_enabled, health_threshold } = data;

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (tags !== undefined) {
      updates.push('tags = ?');
      values.push(JSON.stringify(tags));
    }
    if (scan_enabled !== undefined) {
      updates.push('scan_enabled = ?');
      values.push(scan_enabled ? 1 : 0);
    }
    if (scan_interval !== undefined) {
      updates.push('scan_interval = ?');
      values.push(scan_interval);
    }
    if (monitoring_enabled !== undefined) {
      updates.push('monitoring_enabled = ?');
      values.push(monitoring_enabled ? 1 : 0);
    }
    if (health_threshold !== undefined) {
      updates.push('health_threshold = ?');
      values.push(health_threshold);
    }

    if (updates.length === 0) {
      return this.getById(id);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const sql = `UPDATE subnets SET ${updates.join(', ')} WHERE id = ?`;
    await db.prepare(sql).run(...values);

    return await this.getById(id);
  }

  static async delete(id) {
    return await db.prepare('DELETE FROM subnets WHERE id = ?').run(id);
  }

  static async getStatistics(id) {
    const subnet = await this.getById(id);
    if (!subnet) return null;

    const stats = await db
      .prepare(
        `
      SELECT 
        COUNT(*) as total_ips,
        SUM(CASE WHEN status = 'connected' THEN 1 ELSE 0 END) as connected,
        SUM(CASE WHEN status = 'disconnected' THEN 1 ELSE 0 END) as disconnected,
        SUM(CASE WHEN status = 'unknown' THEN 1 ELSE 0 END) as unknown
      FROM ip_addresses
      WHERE subnet_id = ?
    `
      )
      .get(id);

    const healthPercentage =
      stats.total_ips > 0 ? Math.round((stats.connected / stats.total_ips) * 100) : 0;

    return {
      ...subnet,
      statistics: {
        total_ips: stats.total_ips || 0,
        connected: stats.connected || 0,
        disconnected: stats.disconnected || 0,
        unknown: stats.unknown || 0,
        health_percentage: healthPercentage,
      },
    };
  }

  static async updateLastScan(id) {
    await db.prepare('UPDATE subnets SET last_scan_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  }
}

module.exports = Subnet;


