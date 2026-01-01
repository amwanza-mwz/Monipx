const db = require('./db');
const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'migrations');

// Get all migration files
const migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.js') && file !== 'migrate.js')
  .sort();

console.log('🔄 Running database migrations...');

async function runMigrations() {
  for (const file of migrationFiles) {
    const migration = require(path.join(migrationsDir, file));
    if (typeof migration.runMigration === 'function') {
      try {
        await migration.runMigration();
      } catch (error) {
        console.error(`❌ Migration ${file} failed:`, error);
        if (require.main === module) {
          process.exit(1);
        }
        throw error;
      }
    }
  }

  console.log('✅ All migrations completed');
}

// Only run if called directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      db.close();
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };

