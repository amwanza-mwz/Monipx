const express = require('express');
const router = express.Router();

// API routes
router.use('/auth', require('./api/auth'));
router.use('/subnets', require('./api/subnets'));
router.use('/ips', require('./api/ips'));
router.use('/monitors', require('./api/monitors'));
router.use('/status', require('./api/status'));
router.use('/settings', require('./api/settings'));

// API info
router.get('/', (req, res) => {
  res.json({
    name: 'Monipx API',
    version: '1.0.0',
    endpoints: {
      subnets: '/api/subnets',
      ips: '/api/ips',
      monitors: '/api/monitors',
      status: '/api/status',
      settings: '/api/settings',
    },
  });
});

module.exports = router;

