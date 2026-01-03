const db = require('../db');

async function runMigration() {
  console.log('Running migration: 006_add_password_to_ssh_sessions');

  try {
    // Add password column to ssh_sessions table
    await db.exec(`
      ALTER TABLE ssh_sessions ADD COLUMN password TEXT;
    `).catch((error) => {
      // Column might already exist, ignore error
      if (error.message.includes('duplicate column name')) {
        console.log('Column password already exists, skipping...');
      } else {
        throw error;
      }
    });

    console.log('✅ Migration 006_add_password_to_ssh_sessions completed');
  } catch (error) {
    console.error('❌ Migration 006_add_password_to_ssh_sessions failed:', error);
    throw error;
  }
}

module.exports = { runMigration };

