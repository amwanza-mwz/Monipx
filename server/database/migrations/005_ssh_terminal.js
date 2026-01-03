const db = require('../db');

async function runMigration() {
  console.log('Running migration: 005_ssh_terminal');

  try {
    // Create ssh_keys table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS ssh_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        key_type TEXT NOT NULL,
        fingerprint TEXT NOT NULL,
        encrypted_private_key TEXT NOT NULL,
        public_key TEXT NOT NULL,
        has_passphrase BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create ssh_sessions table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS ssh_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        group_name TEXT,
        host TEXT NOT NULL,
        port INTEGER DEFAULT 22,
        username TEXT NOT NULL,
        auth_method TEXT NOT NULL,
        ssh_key_id INTEGER,
        terminal_type TEXT DEFAULT 'xterm-256color',
        color_scheme TEXT DEFAULT 'default',
        keep_alive INTEGER DEFAULT 30,
        auto_reconnect BOOLEAN DEFAULT 1,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ssh_key_id) REFERENCES ssh_keys(id) ON DELETE SET NULL
      );
    `);

    // Create ssh_connection_logs table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS ssh_connection_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        disconnected_at DATETIME,
        disconnect_reason TEXT,
        bytes_sent INTEGER DEFAULT 0,
        bytes_received INTEGER DEFAULT 0,
        FOREIGN KEY (session_id) REFERENCES ssh_sessions(id) ON DELETE CASCADE
      );
    `);

    // Create command_snippets table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS command_snippets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        command TEXT NOT NULL,
        description TEXT,
        category TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_ssh_sessions_group 
      ON ssh_sessions(group_name);
    `);

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_ssh_sessions_name 
      ON ssh_sessions(name);
    `);

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_ssh_connection_logs_session 
      ON ssh_connection_logs(session_id);
    `);

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_ssh_connection_logs_connected 
      ON ssh_connection_logs(connected_at);
    `);

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_command_snippets_category 
      ON command_snippets(category);
    `);

    console.log('✅ Migration 005_ssh_terminal completed');
  } catch (error) {
    console.error('❌ Migration 005_ssh_terminal failed:', error);
    throw error;
  }
}

module.exports = { runMigration };

