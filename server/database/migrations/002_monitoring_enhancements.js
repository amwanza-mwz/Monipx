const db = require('../db');

async function runMigration() {
  console.log('Running migration: 002_monitoring_enhancements');

  try {
    // Add new columns to monitors table
    await db.exec(`
      ALTER TABLE monitors ADD COLUMN group_name TEXT;
    `).catch(() => console.log('Column group_name already exists'));

    await db.exec(`
      ALTER TABLE monitors ADD COLUMN description TEXT;
    `).catch(() => console.log('Column description already exists'));

    await db.exec(`
      ALTER TABLE monitors ADD COLUMN status TEXT DEFAULT 'unknown';
    `).catch(() => console.log('Column status already exists'));

    await db.exec(`
      ALTER TABLE monitors ADD COLUMN last_check_at DATETIME;
    `).catch(() => console.log('Column last_check_at already exists'));

    await db.exec(`
      ALTER TABLE monitors ADD COLUMN last_status_change DATETIME;
    `).catch(() => console.log('Column last_status_change already exists'));

    await db.exec(`
      ALTER TABLE monitors ADD COLUMN uptime_percentage REAL DEFAULT 100.0;
    `).catch(() => console.log('Column uptime_percentage already exists'));

    await db.exec(`
      ALTER TABLE monitors ADD COLUMN total_checks INTEGER DEFAULT 0;
    `).catch(() => console.log('Column total_checks already exists'));

    await db.exec(`
      ALTER TABLE monitors ADD COLUMN failed_checks INTEGER DEFAULT 0;
    `).catch(() => console.log('Column failed_checks already exists'));

    // Docker-specific fields
    await db.exec(`
      ALTER TABLE monitors ADD COLUMN docker_container_name TEXT;
    `).catch(() => console.log('Column docker_container_name already exists'));

    await db.exec(`
      ALTER TABLE monitors ADD COLUMN docker_host TEXT;
    `).catch(() => console.log('Column docker_host already exists'));

    // Database-specific fields
    await db.exec(`
      ALTER TABLE monitors ADD COLUMN database_type TEXT;
    `).catch(() => console.log('Column database_type already exists'));

    await db.exec(`
      ALTER TABLE monitors ADD COLUMN database_name TEXT;
    `).catch(() => console.log('Column database_name already exists'));

    await db.exec(`
      ALTER TABLE monitors ADD COLUMN database_username TEXT;
    `).catch(() => console.log('Column database_username already exists'));

    await db.exec(`
      ALTER TABLE monitors ADD COLUMN database_password TEXT;
    `).catch(() => console.log('Column database_password already exists'));

    // Create monitor_groups table for better organization
    await db.exec(`
      CREATE TABLE IF NOT EXISTS monitor_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        color TEXT DEFAULT '#ff2667',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create email_notifications table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS email_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        monitor_id INTEGER NOT NULL,
        email TEXT NOT NULL,
        notify_on_down BOOLEAN DEFAULT 1,
        notify_on_up BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
      );
    `);

    // Create notification_history table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS notification_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        monitor_id INTEGER NOT NULL,
        email TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        message TEXT,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
      );
    `);

    // Insert default email settings
    const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    await insertSetting.run('smtp_host', '');
    await insertSetting.run('smtp_port', '587');
    await insertSetting.run('smtp_secure', 'true');
    await insertSetting.run('smtp_user', '');
    await insertSetting.run('smtp_password', '');
    await insertSetting.run('smtp_from', '');
    await insertSetting.run('notifications_enabled', 'false');

    console.log('✅ Migration 002_monitoring_enhancements completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

module.exports = { runMigration };

