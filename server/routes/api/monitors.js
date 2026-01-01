const express = require('express');
const router = express.Router();
const Monitor = require('../../models/Monitor');

function getIO(req) {
  return req.app.get('io');
}

// Get all monitors
router.get('/', async (req, res) => {
  try {
    const monitors = await Monitor.getAll();
    res.json(monitors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create monitor
router.post('/', async (req, res) => {
  try {
    const { name, type, target, subnet_id, port, interval, timeout, enabled } = req.body;

    if (!name || !type || !target) {
      return res.status(400).json({ error: 'Name, type, and target are required' });
    }

    const monitor = await Monitor.create({
      name,
      type,
      target,
      subnet_id,
      port,
      interval,
      timeout,
      enabled,
    });

    // Emit socket event
    const io = getIO(req);
    if (io) {
      io.emit('monitor:created', monitor);
    }

    res.status(201).json(monitor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get monitor by ID
router.get('/:id', async (req, res) => {
  try {
    const monitor = await Monitor.getById(req.params.id);
    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }
    res.json(monitor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update monitor
router.put('/:id', async (req, res) => {
  try {
    const monitor = await Monitor.update(req.params.id, req.body);
    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    // Emit socket event
    const io = getIO(req);
    if (io) {
      io.to(`monitor:${monitor.id}`).emit('monitor:update', monitor);
    }

    res.json(monitor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete monitor
router.delete('/:id', async (req, res) => {
  try {
    const monitor = await Monitor.getById(req.params.id);
    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    Monitor.delete(req.params.id);

    // Emit socket event
    const io = getIO(req);
    if (io) {
      io.emit('monitor:deleted', { id: req.params.id });
    }

    res.json({ message: 'Monitor deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get monitor history
router.get('/:id/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const history = await Monitor.getHistory(req.params.id, limit);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

