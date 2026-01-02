const express = require('express');
const router = express.Router();
const Subnet = require('../../models/Subnet');
const IPAddress = require('../../models/IPAddress');
const { isValidCIDR } = require('../../utils/ip-utils');

function getIO(req) {
  return req.app.get('io');
}

// Get all subnets
router.get('/', async (req, res) => {
  try {
    const subnets = await Subnet.getAll();
    res.json(subnets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new subnet
router.post('/', async (req, res) => {
  try {
    const { name, subnet, description, tags, scan_enabled, scan_interval, monitoring_enabled } = req.body;

    if (!name || !subnet) {
      return res.status(400).json({ error: 'Name and subnet are required' });
    }

    if (!isValidCIDR(subnet)) {
      return res.status(400).json({ error: 'Invalid CIDR notation' });
    }

    const newSubnet = await Subnet.create({
      name,
      subnet,
      description,
      tags,
      scan_enabled,
      scan_interval,
      monitoring_enabled,
    });

    // Emit socket event
    const io = getIO(req);
    if (io) {
      io.emit('subnet:created', newSubnet);
    }

    res.status(201).json(newSubnet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get subnet by ID
router.get('/:id', async (req, res) => {
  try {
    const subnet = await Subnet.getById(req.params.id);
    if (!subnet) {
      return res.status(404).json({ error: 'Subnet not found' });
    }
    res.json(subnet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update subnet
router.put('/:id', async (req, res) => {
  try {
    const subnet = await Subnet.update(req.params.id, req.body);
    if (!subnet) {
      return res.status(404).json({ error: 'Subnet not found' });
    }

    // Emit socket event
    const io = getIO(req);
    if (io) {
      io.emit('subnet:update', subnet);
    }

    res.json(subnet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete subnet
router.delete('/:id', async (req, res) => {
  try {
    const subnet = await Subnet.getById(req.params.id);
    if (!subnet) {
      return res.status(404).json({ error: 'Subnet not found' });
    }

    Subnet.delete(req.params.id);

    // Emit socket event
    const io = getIO(req);
    if (io) {
      io.emit('subnet:deleted', { id: req.params.id });
    }

    res.json({ message: 'Subnet deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get subnet statistics
router.get('/:id/statistics', async (req, res) => {
  try {
    const stats = await Subnet.getStatistics(req.params.id);
    if (!stats) {
      return res.status(404).json({ error: 'Subnet not found' });
    }
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get IPs in subnet
router.get('/:id/ips', async (req, res) => {
  try {
    const ips = await IPAddress.getBySubnetId(req.params.id);
    res.json(ips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger subnet scan
router.post('/:id/scan', async (req, res) => {
  try {
    const subnet = await Subnet.getById(req.params.id);
    if (!subnet) {
      return res.status(404).json({ error: 'Subnet not found' });
    }

    const io = getIO(req);
    const SubnetScanner = require('../../services/subnet/scanner');
    const scanner = new SubnetScanner(io);

    // Start scan in background
    scanner.scanSubnet(req.params.id, { timeout: 1000, concurrent: 20 })
      .catch((error) => {
        console.error('Scan error:', error);
      });

    res.json({ message: 'Scan initiated', subnet_id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Scan all subnets
router.post('/scan-all', async (req, res) => {
  try {
    const subnets = await Subnet.getAll();
    const enabledSubnets = subnets.filter((s) => s.scan_enabled);

    const io = getIO(req);
    const SubnetScanner = require('../../services/subnet/scanner');
    const scanner = new SubnetScanner(io);

    // Start scans in background
    enabledSubnets.forEach((subnet) => {
      scanner.scanSubnet(subnet.id, { timeout: 1000, concurrent: 20 })
        .catch((error) => {
          console.error(`Scan error for subnet ${subnet.id}:`, error);
        });
    });

    res.json({ message: 'Scan initiated for all enabled subnets', count: enabledSubnets.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get summary
router.get('/summary', async (req, res) => {
  try {
    const subnets = await Subnet.getAll();
    const summary = await Promise.all(subnets.map(async (subnet) => {
      const stats = await Subnet.getStatistics(subnet.id);
      return {
        id: subnet.id,
        name: subnet.name,
        subnet: subnet.subnet,
        total_ips: stats?.statistics?.total_ips || 0,
        connected: stats?.statistics?.connected || 0,
        disconnected: stats?.statistics?.disconnected || 0,
        health_percentage: stats?.statistics?.health_percentage || 0,
      };
    }));

    res.json({
      total_subnets: subnets.length,
      subnets: summary,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

