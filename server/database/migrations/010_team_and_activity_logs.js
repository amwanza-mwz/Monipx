const db = require('../db');

async function runMigration() {
  console.log('Running migration: 010_team_and_activity_logs');

  try {
    // Add role column to users table for team roles
    await db.exec(`
      ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'member';
    `).catch(() => {
      console.log('Column role already exists, skipping...');
    });

    // Add status column to users (active, pending, disabled)
    await db.exec(`
      ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active';
    `).catch(() => {
      console.log('Column status already exists, skipping...');
    });

    // Add invited_by column to track who invited the user
    await db.exec(`
      ALTER TABLE users ADD COLUMN invited_by INTEGER REFERENCES users(id);
    `).catch(() => {
      console.log('Column invited_by already exists, skipping...');
    });

    // Add last_login column
    await db.exec(`
      ALTER TABLE users ADD COLUMN last_login DATETIME;
    `).catch(() => {
      console.log('Column last_login already exists, skipping...');
    });

    // Create team_invitations table for pending invites
    await db.exec(`
      CREATE TABLE IF NOT EXISTS team_invitations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        role TEXT DEFAULT 'member',
        token TEXT NOT NULL UNIQUE,
        invited_by INTEGER NOT NULL REFERENCES users(id),
        expires_at DATETIME NOT NULL,
        used_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(email)
      );
    `);

    // Create activity_logs table for tracking user actions
    await db.exec(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        username TEXT,
        action TEXT NOT NULL,
        category TEXT NOT NULL,
        resource_type TEXT,
        resource_id TEXT,
        resource_name TEXT,
        details TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for activity_logs
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
    `);
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
    `);
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_category ON activity_logs(category);
    `);
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
    `);

    // Update existing admin user to have 'admin' role
    await db.exec(`
      UPDATE users SET role = 'admin' WHERE is_admin = 1;
    `);

    console.log('✅ Migration 010_team_and_activity_logs completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

module.exports = { runMigration };
