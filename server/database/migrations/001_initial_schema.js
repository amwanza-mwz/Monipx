const db = require('../db');

async function runMigration() {
  console.log('Running migration: 001_initial_schema');

  try {
    // Create subnets table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS subnets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        subnet TEXT NOT NULL UNIQUE,
        cidr INTEGER NOT NULL,
        network_address TEXT NOT NULL,
        total_ips INTEGER NOT NULL,
        description TEXT,
        tags TEXT,
        scan_enabled BOOLEAN DEFAULT 1,
        scan_interval INTEGER DEFAULT 300,
        monitoring_enabled BOOLEAN DEFAULT 1,
        health_threshold INTEGER DEFAULT 80,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_scan_at DATETIME
      );
    `);

    // Create ip_addresses table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS ip_addresses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subnet_id INTEGER NOT NULL,
        ip_address TEXT NOT NULL,
        status TEXT DEFAULT 'unknown',
        hostname TEXT,
        domain TEXT,
        subdomain TEXT,
        full_domain TEXT,
        mac_address TEXT,
        last_seen DATETIME,
        is_manual BOOLEAN DEFAULT 0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (subnet_id) REFERENCES subnets(id) ON DELETE CASCADE,
        UNIQUE(subnet_id, ip_address)
      );
    `);

    // Create monitors table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS monitors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        target TEXT NOT NULL,
        subnet_id INTEGER,
        port INTEGER,
        interval INTEGER DEFAULT 20,
        timeout INTEGER DEFAULT 5000,
        enabled BOOLEAN DEFAULT 1,
        expected_status_code INTEGER,
        expected_keyword TEXT,
        notification_enabled BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (subnet_id) REFERENCES subnets(id) ON DELETE SET NULL
      );
    `);

    // Create monitoring_history table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS monitoring_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        monitor_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        response_time INTEGER,
        status_code INTEGER,
        error_message TEXT,
        checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
      );
    `);

    // Create index
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_monitoring_history_monitor_checked 
      ON monitoring_history(monitor_id, checked_at);
    `);

    // Create settings table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create users table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        email TEXT,
        is_admin BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert default settings
    const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    await insertSetting.run('theme', 'light');
    await insertSetting.run('app_name', 'Monipx');
    await insertSetting.run('setup_completed', '0');

    console.log('✅ Migration 001_initial_schema completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

module.exports = { runMigration };

