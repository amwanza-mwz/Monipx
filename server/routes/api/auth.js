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

module.exports = router;

