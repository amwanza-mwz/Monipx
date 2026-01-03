/**
 * Migration: Reset Setup Status
 * This migration resets the setup status to allow re-running the initial setup
 */

module.exports = {
  up: async (db) => {
    console.log('🔄 Resetting setup status...');
    
    // Delete all users to allow fresh setup
    await db.run('DELETE FROM users');
    console.log('✅ Deleted all users');
    
    // Reset setup_completed setting
    await db.run(`
      INSERT OR REPLACE INTO settings (key, value, updated_at)
      VALUES ('setup_completed', '0', datetime('now'))
    `);
    console.log('✅ Reset setup_completed to 0');
    
    // Clear any existing sessions
    await db.run('DELETE FROM sessions');
    console.log('✅ Cleared all sessions');
    
    console.log('✅ Setup reset complete - you can now run initial setup again');
  },

  down: async (db) => {
    // This migration cannot be reversed
    console.log('⚠️  This migration cannot be reversed');
  }
};

