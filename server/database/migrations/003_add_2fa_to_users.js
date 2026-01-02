const db = require('../db');

async function runMigration() {
  console.log('Running migration: 003_add_2fa_to_users');

  try {
    // Add two_factor_enabled and two_factor_secret columns to users table
    await db.exec(`
      ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT 0;
    `).catch(() => {
      // Column might already exist, ignore error
      console.log('Column two_factor_enabled already exists, skipping...');
    });

    await db.exec(`
      ALTER TABLE users ADD COLUMN two_factor_secret TEXT;
    `).catch(() => {
      // Column might already exist, ignore error
      console.log('Column two_factor_secret already exists, skipping...');
    });

    console.log('✅ Migration 003_add_2fa_to_users completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

module.exports = { runMigration };

