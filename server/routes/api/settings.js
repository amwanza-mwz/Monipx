const express = require('express');
const router = express.Router();
const Settings = require('../../models/Settings');

// Get all settings
router.get('/', async (req, res) => {
  try {
    const settings = await Settings.getAll();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get setting by key
router.get('/:key', async (req, res) => {
  try {
    const value = await Settings.get(req.params.key);
    res.json({ key: req.params.key, value });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update setting
router.put('/:key', async (req, res) => {
  try {
    const { value } = req.body;
    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }
    await Settings.set(req.params.key, value);
    res.json({ key: req.params.key, value });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update theme
router.put('/theme', async (req, res) => {
  try {
    const { theme } = req.body;
    if (!theme || !['light', 'dark'].includes(theme)) {
      return res.status(400).json({ error: 'Theme must be "light" or "dark"' });
    }
    await Settings.set('theme', theme);
    res.json({ key: 'theme', value: theme });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

