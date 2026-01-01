const express = require('express');
const router = express.Router();
const IPAddress = require('../../models/IPAddress');
const dns = require('dns').promises;

function getIO(req) {
  return req.app.get('io');
}

// Get IP by ID
router.get('/:id', async (req, res) => {
  try {
    const ip = await IPAddress.getById(req.params.id);
    if (!ip) {
      return res.status(404).json({ error: 'IP address not found' });
    }
    res.json(ip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update IP
router.put('/:id', async (req, res) => {
  try {
    const ip = await IPAddress.update(req.params.id, req.body);
    if (!ip) {
      return res.status(404).json({ error: 'IP address not found' });
    }

    // Emit socket event
    const io = getIO(req);
    if (io) {
      io.to(`subnet:${ip.subnet_id}`).emit('ip:update', ip);
      
      // Emit subnet statistics update to refresh connected/disconnected counts
      const Subnet = require('../../models/Subnet');
      const stats = await Subnet.getStatistics(ip.subnet_id);
      if (stats) {
        io.to(`subnet:${ip.subnet_id}`).emit('subnet:statistics:update', {
          subnet_id: ip.subnet_id,
          statistics: stats.statistics
        });
      }
    }

    res.json(ip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DNS resolution
router.post('/:id/resolve', async (req, res) => {
  try {
    const ip = IPAddress.getById(req.params.id);
    if (!ip) {
      return res.status(404).json({ error: 'IP address not found' });
    }

    const { type, target } = req.body;

    try {
      if (type === 'forward') {
        // Forward DNS: domain to IP
        const addresses = await dns.resolve4(target);
        res.json({ type: 'forward', target, result: addresses[0] });
      } else if (type === 'reverse') {
        // Reverse DNS: IP to hostname
        const hostnames = await dns.reverse(target || ip.ip_address);
        res.json({ type: 'reverse', target: target || ip.ip_address, result: hostnames[0] });
      } else {
        res.status(400).json({ error: 'Invalid resolution type. Use "forward" or "reverse"' });
      }
    } catch (dnsError) {
      res.status(404).json({ error: 'DNS resolution failed', details: dnsError.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

