/**
 * Migration: Add name field to users table
 * Date: 2026-01-02
 */

module.exports = {
  up: async (db) => {
    console.log('Running migration: Add name field to users table');

    // Check if name column already exists
    const tableInfo = await db.all("PRAGMA table_info(users)");
    const hasNameColumn = tableInfo.some(col => col.name === 'name');

    if (!hasNameColumn) {
      // Add name column to users table
      await db.exec(`
        ALTER TABLE users ADD COLUMN name TEXT;
      `);
      console.log('✅ Added name column to users table');
    } else {
      console.log('ℹ️  Name column already exists in users table');
    }
  },

  down: async (db) => {
    console.log('Rolling back migration: Add name field to users table');
    
    // SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
    await db.exec(`
      CREATE TABLE users_backup AS SELECT id, username, password_hash, email, is_admin, two_factor_enabled, two_factor_secret, created_at, updated_at FROM users;
      DROP TABLE users;
      ALTER TABLE users_backup RENAME TO users;
    `);
    
    console.log('✅ Removed name column from users table');
  }
};

