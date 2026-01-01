const express = require('express');
const router = express.Router();
const Subnet = require('../../models/Subnet');
const Monitor = require('../../models/Monitor');
const db = require('../../database/db');

router.get('/', (req, res) => {
  try {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/dashboard', async (req, res) => {
  try {
    const subnets = await Subnet.getAll();
    const monitors = await Monitor.getAll();

    // Calculate aggregate statistics
    let totalIPs = 0;
    let connectedIPs = 0;
    let disconnectedIPs = 0;

    const subnetStats = await Promise.all(subnets.map(async (subnet) => {
      const stats = await Subnet.getStatistics(subnet.id);
      const statsData = stats?.statistics || {
        total_ips: 0,
        connected: 0,
        disconnected: 0,
        health_percentage: 0,
      };

      totalIPs += statsData.total_ips;
      connectedIPs += statsData.connected;
      disconnectedIPs += statsData.disconnected;

      return {
        id: subnet.id,
        name: subnet.name,
        subnet: subnet.subnet,
        total_ips: statsData.total_ips,
        connected: statsData.connected,
        disconnected: statsData.disconnected,
        health_percentage: statsData.health_percentage,
      };
    }));

    const activeMonitors = monitors.filter((m) => m.enabled).length;

    res.json({
      total_subnets: subnets.length,
      total_ips: totalIPs,
      connected_ips: connectedIPs,
      disconnected_ips: disconnectedIPs,
      active_monitors: activeMonitors,
      overall_uptime: totalIPs > 0 ? Math.round((connectedIPs / totalIPs) * 100) : 100,
      subnets: subnetStats,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

