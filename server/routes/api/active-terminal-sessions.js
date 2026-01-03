const express = require('express');
const router = express.Router();
const ActiveTerminalSession = require('../../models/ActiveTerminalSession');
const SSHSession = require('../../models/SSHSession');

/**
 * GET /api/active-terminal-sessions
 * Get all active terminal sessions
 */
router.get('/', async (req, res) => {
  try {
    const sessions = await ActiveTerminalSession.getAll();
    
    // Fetch full SSH session details for each active session
    const sessionsWithDetails = await Promise.all(
      sessions.map(async (activeSession) => {
        const sshSession = await SSHSession.getById(activeSession.ssh_session_id);
        return {
          id: activeSession.tab_id,
          session: sshSession,
          status: activeSession.status,
        };
      })
    );

    res.json(sessionsWithDetails);
  } catch (error) {
    console.error('❌ Failed to get active terminal sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/active-terminal-sessions
 * Create new active terminal session
 */
router.post('/', async (req, res) => {
  try {
    const { tab_id, ssh_session_id, status } = req.body;

    if (!tab_id || !ssh_session_id) {
      return res.status(400).json({ error: 'tab_id and ssh_session_id are required' });
    }

    // Verify SSH session exists
    const sshSession = await SSHSession.getById(ssh_session_id);
    if (!sshSession) {
      return res.status(404).json({ error: 'SSH session not found' });
    }

    const activeSession = await ActiveTerminalSession.create({
      tab_id,
      ssh_session_id,
      status: status || 'connecting',
    });

    res.status(201).json(activeSession);
  } catch (error) {
    console.error('❌ Failed to create active terminal session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/active-terminal-sessions/:tabId
 * Update active terminal session status
 */
router.patch('/:tabId', async (req, res) => {
  try {
    const { tabId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const activeSession = await ActiveTerminalSession.updateStatus(tabId, status);
    
    if (!activeSession) {
      return res.status(404).json({ error: 'Active terminal session not found' });
    }

    res.json(activeSession);
  } catch (error) {
    console.error('❌ Failed to update active terminal session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/active-terminal-sessions/:tabId
 * Delete active terminal session
 */
router.delete('/:tabId', async (req, res) => {
  try {
    const { tabId } = req.params;
    await ActiveTerminalSession.delete(tabId);
    res.status(204).send();
  } catch (error) {
    console.error('❌ Failed to delete active terminal session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/active-terminal-sessions
 * Delete all active terminal sessions
 */
router.delete('/', async (req, res) => {
  try {
    await ActiveTerminalSession.deleteAll();
    res.status(204).send();
  } catch (error) {
    console.error('❌ Failed to delete all active terminal sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

