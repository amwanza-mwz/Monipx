const db = require('../db');

async function runMigration() {
  console.log('Running migration: 008_add_active_terminal_sessions');

  try {
    // Create active_terminal_sessions table to track open terminal tabs
    await db.exec(`
      CREATE TABLE IF NOT EXISTS active_terminal_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tab_id TEXT NOT NULL UNIQUE,
        ssh_session_id INTEGER NOT NULL,
        status TEXT DEFAULT 'connecting',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ssh_session_id) REFERENCES ssh_sessions(id) ON DELETE CASCADE
      );
    `);

    console.log('✅ Created active_terminal_sessions table');

    // Create index for faster lookups
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_active_terminal_sessions_ssh_session 
      ON active_terminal_sessions(ssh_session_id);
    `);

    console.log('✅ Created index on active_terminal_sessions');
    console.log('✅ Migration 008_add_active_terminal_sessions completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

module.exports = { runMigration };

