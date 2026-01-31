const express = require('express');
const router = express.Router();
const packageJson = require('../../package.json');

// API routes
router.use('/auth', require('./api/auth'));
router.use('/subnets', require('./api/subnets'));
router.use('/ips', require('./api/ips'));
router.use('/monitors', require('./api/monitors'));
router.use('/status', require('./api/status'));
router.use('/settings', require('./api/settings'));
router.use('/ssh-sessions', require('./api/ssh-sessions'));
router.use('/ssh-keys', require('./api/ssh-keys'));
router.use('/ssh-groups', require('./api/ssh-groups'));
router.use('/ssh-terminal', require('./api/ssh-terminal'));
router.use('/team', require('./api/team'));
router.use('/activity-logs', require('./api/activity-logs'));

// API info
router.get('/', (req, res) => {
  res.json({
    name: 'Monipx API',
    version: packageJson.version,
    endpoints: {
      subnets: '/api/subnets',
      ips: '/api/ips',
      monitors: '/api/monitors',
      status: '/api/status',
      settings: '/api/settings',
      sshSessions: '/api/ssh-sessions',
      sshKeys: '/api/ssh-keys',
      sshGroups: '/api/ssh-groups',
      sshTerminal: '/api/ssh-terminal',
      team: '/api/team',
      activityLogs: '/api/activity-logs',
    },
  });
});

module.exports = router;

