const db = require('../db');

async function runMigration() {
  console.log('Running migration: 004_add_name_to_users');

  try {
    await db.exec(`
      ALTER TABLE users ADD COLUMN name TEXT;
    `).catch(() => {
      console.log('Column name already exists, skipping...');
    });

    console.log('✅ Migration 004_add_name_to_users completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

module.exports = { runMigration };
