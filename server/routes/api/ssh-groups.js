const express = require('express');
const router = express.Router();
const SSHGroup = require('../../models/SSHGroup');

/**
 * GET /api/ssh-groups
 * Get all SSH groups
 */
router.get('/', async (req, res) => {
  try {
    const groups = await SSHGroup.getAll();
    res.json(groups);
  } catch (error) {
    console.error('❌ Error fetching SSH groups:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ssh-groups/with-counts
 * Get all SSH groups with session counts
 */
router.get('/with-counts', async (req, res) => {
  try {
    const groups = await SSHGroup.getAllWithCounts();
    res.json(groups);
  } catch (error) {
    console.error('❌ Error fetching SSH groups with counts:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ssh-groups/:id
 * Get SSH group by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const group = await SSHGroup.getById(req.params.id);
    if (!group) {
      return res.status(404).json({ error: 'SSH group not found' });
    }
    res.json(group);
  } catch (error) {
    console.error('❌ Error fetching SSH group:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ssh-groups
 * Create new SSH group
 */
router.post('/', async (req, res) => {
  try {
    console.log('📝 Creating SSH group:', req.body.name);
    
    if (!req.body.name || !req.body.name.trim()) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const group = await SSHGroup.create(req.body);
    console.log('✅ SSH group created:', group.id);
    res.status(201).json(group);
  } catch (error) {
    console.error('❌ Error creating SSH group:', error);
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/ssh-groups/:id
 * Update SSH group
 */
router.put('/:id', async (req, res) => {
  try {
    console.log('📝 Updating SSH group:', req.params.id);
    
    const group = await SSHGroup.update(req.params.id, req.body);
    if (!group) {
      return res.status(404).json({ error: 'SSH group not found' });
    }
    
    console.log('✅ SSH group updated:', group.id);
    res.json(group);
  } catch (error) {
    console.error('❌ Error updating SSH group:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/ssh-groups/:id
 * Delete SSH group
 */
router.delete('/:id', async (req, res) => {
  try {
    console.log('🗑️  Deleting SSH group:', req.params.id);
    await SSHGroup.delete(req.params.id);
    console.log('✅ SSH group deleted');
    res.status(204).send();
  } catch (error) {
    console.error('❌ Error deleting SSH group:', error);
    if (error.message.includes('Cannot delete group')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

