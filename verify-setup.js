#!/usr/bin/env node

/**
 * Setup Verification Script
 * Checks if Monipx is ready for testing
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Monipx Setup...\n');

let errors = [];
let warnings = [];

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
if (majorVersion < 20) {
  errors.push(`Node.js version ${nodeVersion} is too old. Required: >= 20.4.0`);
} else {
  console.log(`✅ Node.js version: ${nodeVersion}`);
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  errors.push('node_modules not found. Run: npm install');
} else {
  console.log('✅ Dependencies installed');
}

// Check if package.json exists
const packageJsonPath = path.join(__dirname, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  errors.push('package.json not found');
} else {
  console.log('✅ package.json found');
}

// Check if server files exist
const serverFiles = [
  'server/server.js',
  'server/database/db.js',
  'server/database/migrations/001_initial_schema.js',
  'server/models/Subnet.js',
  'server/models/IPAddress.js',
  'server/models/Monitor.js',
];

serverFiles.forEach((file) => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing file: ${file}`);
  }
});

if (serverFiles.every((file) => fs.existsSync(path.join(__dirname, file)))) {
  console.log('✅ Server files present');
}

// Check if frontend files exist
const frontendFiles = [
  'src/main.js',
  'src/App.vue',
  'src/router/index.js',
  'src/i18n/index.js',
  'public/index.html',
];

frontendFiles.forEach((file) => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing file: ${file}`);
  }
});

if (frontendFiles.every((file) => fs.existsSync(path.join(__dirname, file)))) {
  console.log('✅ Frontend files present');
}

// Check if data directory exists (will be created on first run)
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  warnings.push('data/ directory will be created on first run');
} else {
  console.log('✅ Data directory exists');
}

// Check if .env exists (optional)
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  warnings.push('.env file not found (optional, will use defaults)');
} else {
  console.log('✅ .env file found');
}

// Summary
console.log('\n📊 Summary:');

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All checks passed! Ready to test.\n');
  console.log('Next steps:');
  console.log('  1. Run: node server/database/migrate.js');
  console.log('  2. Run: npm run dev');
  console.log('  3. Open: http://localhost:5173\n');
  process.exit(0);
} else {
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach((warning) => console.log(`   - ${warning}`));
  }

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach((error) => console.log(`   - ${error}`));
    console.log('\nPlease fix the errors above before testing.\n');
    process.exit(1);
  } else {
    console.log('\n✅ Ready to test (with warnings)\n');
    process.exit(0);
  }
}

