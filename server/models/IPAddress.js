const db = require('../database/db');

class IPAddress {
  static async getBySubnetId(subnetId) {
    const ips = await db
      .prepare('SELECT * FROM ip_addresses WHERE subnet_id = ?')
      .all(subnetId);
    
    // Sort IPs numerically (not lexicographically)
    return ips.sort((a, b) => {
      const ipA = a.ip_address.split('.').map(Number);
      const ipB = b.ip_address.split('.').map(Number);
      
      for (let i = 0; i < 4; i++) {
        if (ipA[i] !== ipB[i]) {
          return ipA[i] - ipB[i];
        }
      }
      return 0;
    });
  }

  static async getById(id) {
    return await db.prepare('SELECT * FROM ip_addresses WHERE id = ?').get(id);
  }

  static async update(id, data) {
    const {
      status,
      hostname,
      domain,
      subdomain,
      full_domain,
      mac_address,
      notes,
      is_manual,
    } = data;

    // Auto-generate full_domain if subdomain and domain are provided
    let finalFullDomain = full_domain;
    if (subdomain && domain && !full_domain) {
      finalFullDomain = `${subdomain}.${domain}`;
    } else if (domain && !subdomain && !full_domain) {
      finalFullDomain = domain;
    }

    const updates = [];
    const values = [];

    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (hostname !== undefined) {
      updates.push('hostname = ?');
      values.push(hostname || null);
    }
    if (domain !== undefined) {
      updates.push('domain = ?');
      values.push(domain || null);
    }
    if (subdomain !== undefined) {
      updates.push('subdomain = ?');
      values.push(subdomain || null);
    }
    if (finalFullDomain !== undefined) {
      updates.push('full_domain = ?');
      values.push(finalFullDomain || null);
    }
    if (mac_address !== undefined) {
      updates.push('mac_address = ?');
      values.push(mac_address || null);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes || null);
    }
    if (is_manual !== undefined) {
      updates.push('is_manual = ?');
      values.push(is_manual ? 1 : 0);
    }

    if (updates.length === 0) {
      return await this.getById(id);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    if (status === 'connected') {
      updates.push('last_seen = CURRENT_TIMESTAMP');
    }
    values.push(id);

    const sql = `UPDATE ip_addresses SET ${updates.join(', ')} WHERE id = ?`;
    await db.prepare(sql).run(...values);

    return await this.getById(id);
  }

  static async bulkUpdateStatus(subnetId, status) {
    return await db
      .prepare(
        'UPDATE ip_addresses SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE subnet_id = ?'
      )
      .run(status, subnetId);
  }

  static async updateStatusByIP(subnetId, ipAddress, status) {
    // First check if IP exists
    const existing = await db
      .prepare('SELECT id FROM ip_addresses WHERE subnet_id = ? AND ip_address = ?')
      .get(subnetId, ipAddress);

    if (existing) {
      // Update existing IP
      const stmt = db.prepare(
        'UPDATE ip_addresses SET status = ?, updated_at = CURRENT_TIMESTAMP, last_seen = CASE WHEN ? = "connected" THEN CURRENT_TIMESTAMP ELSE last_seen END WHERE subnet_id = ? AND ip_address = ?'
      );
      return await stmt.run(status, status, subnetId, ipAddress);
    } else {
      // Create new IP record
      const stmt = db.prepare(
        'INSERT INTO ip_addresses (subnet_id, ip_address, status, last_seen) VALUES (?, ?, ?, CASE WHEN ? = "connected" THEN CURRENT_TIMESTAMP ELSE NULL END)'
      );
      return await stmt.run(subnetId, ipAddress, status, status);
    }
  }
}

module.exports = IPAddress;


