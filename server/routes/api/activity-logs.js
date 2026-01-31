const express = require('express');
const router = express.Router();
const ActivityLog = require('../../models/ActivityLog');

/**
 * Get activity logs with pagination and filters
 * GET /api/activity-logs
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      category,
      action,
      startDate,
      endDate,
      search,
    } = req.query;

    const result = await ActivityLog.getAll({
      page: parseInt(page),
      limit: parseInt(limit),
      userId: userId ? parseInt(userId) : undefined,
      category,
      action,
      startDate,
      endDate,
      search,
    });

    res.json({
      logs: result.logs,
      total: result.total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(result.total / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get activity summary for dashboard
 * GET /api/activity-logs/summary
 */
router.get('/summary', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const summary = await ActivityLog.getSummary(parseInt(days));

    res.json(summary);
  } catch (error) {
    console.error('Error fetching activity summary:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get activity categories and actions for filtering
 * GET /api/activity-logs/filters
 */
router.get('/filters', async (req, res) => {
  try {
    res.json({
      categories: Object.values(ActivityLog.CATEGORIES),
      actions: Object.values(ActivityLog.ACTIONS),
    });
  } catch (error) {
    console.error('Error fetching filters:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get recent activity for current user
 * GET /api/activity-logs/me
 */
router.get('/me', async (req, res) => {
  try {
    const userId = 1; // Default to user 1 for now
    const { limit = 10 } = req.query;

    const logs = await ActivityLog.getRecentByUser(userId, parseInt(limit));

    res.json({ logs });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Cleanup old logs (admin only)
 * POST /api/activity-logs/cleanup
 */
router.post('/cleanup', async (req, res) => {
  try {
    const { daysToKeep = 90 } = req.body;
    const deleted = await ActivityLog.cleanup(parseInt(daysToKeep));

    res.json({
      message: `Cleaned up ${deleted} old activity logs`,
      deleted,
    });
  } catch (error) {
    console.error('Error cleaning up logs:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
