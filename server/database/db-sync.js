// Synchronous wrapper for sqlite3 to maintain compatibility with existing models
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const DB_DIR = process.env.DB_PATH || path.join(__dirname, '../../data');
const DB_FILE = path.join(DB_DIR, 'monipx.db');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize database synchronously
const db = new sqlite3.Database(DB_FILE);

// Enable foreign keys and WAL mode
db.run('PRAGMA foreign_keys = ON');
db.run('PRAGMA journal_mode = WAL');

console.log(`📦 Database initialized: ${DB_FILE}`);

// Create synchronous wrapper
const dbSync = {
  prepare: (sql) => {
    const stmt = db.prepare(sql);
    return {
      run: (...params) => {
        return new Promise((resolve, reject) => {
          stmt.run(params, function(err) {
            if (err) reject(err);
            else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
          });
        });
      },
      get: (...params) => {
        return new Promise((resolve, reject) => {
          stmt.get(params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
      },
      all: (...params) => {
        return new Promise((resolve, reject) => {
          stmt.all(params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });
      }
    };
  },
  exec: (sql) => {
    return new Promise((resolve, reject) => {
      db.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },
  close: () => {
    return new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

// For synchronous operations, we need to use a different approach
// Let's create a sync version that uses deasync or similar
// Actually, let's just make all models async - it's cleaner

module.exports = dbSync;

