/**
 * Migration: Add SSH Groups Table
 * Creates a dedicated table for SSH session groups
 */

const db = require('../db');

async function runMigration() {
  console.log('Running migration: 009_add_ssh_groups');

  try {
    // Create ssh_groups table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS ssh_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        color TEXT DEFAULT '#007acc',
        icon TEXT DEFAULT 'folder',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Created ssh_groups table');

    // Migrate existing groups from ssh_sessions
    await db.exec(`
      INSERT OR IGNORE INTO ssh_groups (name, description)
      SELECT DISTINCT group_name, 'Migrated from existing sessions'
      FROM ssh_sessions
      WHERE group_name IS NOT NULL AND group_name != ''
    `);

    console.log('✅ Migrated existing groups from ssh_sessions');
    console.log('✅ Migration 009_add_ssh_groups completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

module.exports = { runMigration };

