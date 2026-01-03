const db = require('../db');

async function runMigration() {
  console.log('Running migration: 007_add_passphrase_to_ssh_keys');

  try {
    // Add encrypted_passphrase column to ssh_keys table
    await db.exec(`
      ALTER TABLE ssh_keys 
      ADD COLUMN encrypted_passphrase TEXT;
    `);

    console.log('✅ Added encrypted_passphrase column to ssh_keys table');
    console.log('✅ Migration 007_add_passphrase_to_ssh_keys completed successfully');
  } catch (error) {
    // Check if column already exists
    if (error.message.includes('duplicate column name')) {
      console.log('⚠️  Column encrypted_passphrase already exists, skipping...');
    } else {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }
}

module.exports = { runMigration };

