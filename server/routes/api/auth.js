const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const Settings = require('../../models/Settings');

// Check if setup is needed
router.get('/setup-status', async (req, res) => {
  try {
    const setupCompleted = await Settings.get('setup_completed');
    const hasAdmin = await User.hasAdmin();
    
    res.json({
      setup_completed: setupCompleted === '1',
      has_admin: hasAdmin,
      needs_setup: setupCompleted !== '1' || !hasAdmin,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create admin user (first time setup)
router.post('/setup', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if setup already completed
    const setupCompleted = await Settings.get('setup_completed');
    if (setupCompleted === '1') {
      return res.status(400).json({ error: 'Setup already completed' });
    }

    // Check if admin exists
    const hasAdmin = await User.hasAdmin();
    if (hasAdmin) {
      return res.status(400).json({ error: 'Admin user already exists' });
    }

    // Create admin user
    const user = await User.create({
      username,
      password,
      email,
      is_admin: true,
    });

    // Mark setup as completed
    await Settings.set('setup_completed', '1');

    res.status(201).json({
      message: 'Admin user created successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const isValid = await User.verifyPassword(username, password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = await User.getByUsername(username);
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin === 1,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user (first admin user for now)
router.get('/me', async (req, res) => {
  try {
    const users = await User.getAll();
    const adminUser = users.find(u => u.is_admin === 1) || users[0];

    if (!adminUser) {
      return res.status(404).json({ error: 'No user found' });
    }

    res.json({
      id: adminUser.id,
      username: adminUser.username,
      email: adminUser.email || '',
      is_admin: adminUser.is_admin === 1,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/me', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    const users = await User.getAll();
    const adminUser = users.find(u => u.is_admin === 1) || users[0];

    if (!adminUser) {
      return res.status(404).json({ error: 'No user found' });
    }

    const updatedUser = await User.update(adminUser.id, {
      username,
      password,
      email,
    });

    res.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        is_admin: updatedUser.is_admin === 1,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2FA Routes
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// In-memory storage for temporary 2FA secrets (since we don't have sessions)
const tempSecrets = new Map();

// Clean up old secrets every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [userId, data] of tempSecrets.entries()) {
    if (now - data.timestamp > 10 * 60 * 1000) { // 10 minutes
      tempSecrets.delete(userId);
      console.log(`🧹 Cleaned up expired 2FA secret for user ${userId}`);
    }
  }
}, 10 * 60 * 1000);

// Get 2FA status
router.get('/2fa/status', async (req, res) => {
  try {
    const userId = 1; // Default to user 1 for now (admin)
    const user = await User.getById(userId);

    console.log('📊 2FA Status check:', { userId, enabled: user?.two_factor_enabled === 1 });

    res.json({
      enabled: user?.two_factor_enabled === 1,
    });
  } catch (error) {
    console.error('❌ 2FA status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Setup 2FA - Generate secret and QR code
router.post('/2fa/setup', async (req, res) => {
  try {
    const userId = 1; // Default to user 1 for now (admin)
    const user = await User.getById(userId);

    if (!user) {
      console.error('❌ User not found for 2FA setup:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('🔐 Setting up 2FA for user:', user.username);

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Monipx (${user.username})`,
      issuer: 'Monipx',
    });

    console.log('✅ Generated 2FA secret:', secret.base32.substring(0, 10) + '...');

    // Store temporary secret in memory with timestamp
    tempSecrets.set(userId, {
      secret: secret.base32,
      timestamp: Date.now(),
    });

    console.log('💾 Stored temp secret for user:', userId);

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    console.log('✅ Generated QR code, length:', qrCode.length);

    res.json({
      secret: secret.base32,
      qrCode: qrCode,
    });
  } catch (error) {
    console.error('❌ 2FA setup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify 2FA token and enable
router.post('/2fa/verify', async (req, res) => {
  try {
    const { token } = req.body;
    const userId = 1; // Default to user 1 for now (admin)

    console.log('🔍 Verifying 2FA token for user:', userId);

    const tempData = tempSecrets.get(userId);

    if (!tempData) {
      console.error('❌ No temp secret found for user:', userId);
      return res.status(400).json({ error: 'No 2FA setup in progress. Please start setup again.' });
    }

    const tempSecret = tempData.secret;

    console.log('🔑 Found temp secret:', tempSecret.substring(0, 10) + '...');

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: tempSecret,
      encoding: 'base32',
      token: token,
      window: 2, // Allow 2 time steps before/after
    });

    console.log('✅ Token verification result:', verified);

    if (!verified) {
      console.error('❌ Invalid verification code');
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Enable 2FA for user
    await User.update(userId, {
      two_factor_enabled: true,
      two_factor_secret: tempSecret,
    });

    console.log('✅ 2FA enabled for user:', userId);

    // Clear temp secret
    tempSecrets.delete(userId);

    res.json({ message: '2FA enabled successfully' });
  } catch (error) {
    console.error('❌ 2FA verify error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Disable 2FA
router.post('/2fa/disable', async (req, res) => {
  try {
    const userId = 1; // Default to user 1 for now (admin)

    console.log('🔓 Disabling 2FA for user:', userId);

    await User.update(userId, {
      two_factor_enabled: false,
      two_factor_secret: null,
    });

    console.log('✅ 2FA disabled for user:', userId);

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('❌ 2FA disable error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

