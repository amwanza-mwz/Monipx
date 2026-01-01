// Async database wrapper for sqlite3
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Handle DB_PATH - if it's a file path, use it directly; if it's a directory, append filename
let DB_FILE;
if (process.env.DB_PATH) {
  if (process.env.DB_PATH.endsWith('.db')) {
    DB_FILE = process.env.DB_PATH;
  } else {
    DB_FILE = path.join(process.env.DB_PATH, 'monipx.db');
  }
} else {
  const DB_DIR = path.join(__dirname, '../../data');
  DB_FILE = path.join(DB_DIR, 'monipx.db');
}

const DB_DIR = path.dirname(DB_FILE);

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize database
const db = new sqlite3.Database(DB_FILE);

// Enable foreign keys and WAL mode
db.run('PRAGMA foreign_keys = ON');
db.run('PRAGMA journal_mode = WAL');

console.log(`📦 Database initialized: ${DB_FILE}`);

// Async database wrapper
const dbWrapper = {
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

module.exports = dbWrapper;

