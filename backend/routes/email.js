const express = require('express');
const router = express.Router();
const emailRouter = require('../modules/email/email-router');
const emailQueue = require('../modules/email/queue');
const logger = require('../utils/logger');

/**
 * Direct Email Send (Synchronous)
 */
router.post('/send', async (req, res) => {
  const { to, subject, html, category } = req.body;
  
  if (!to || !subject || !html) {
    return res.status(400).json({ success: false, message: 'to, subject, and html are required' });
  }

  try {
    const result = await emailRouter.sendEmail({ to, subject, html, category });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Queue Email (Asynchronous)
 */
router.post('/queue', async (req, res) => {
  const { to, subject, html, category, scheduledAt } = req.body;
  
  if (!to || !subject || !html) {
    return res.status(400).json({ success: false, message: 'to, subject, and html are required' });
  }

  try {
    const job = await emailQueue.addEmailToQueue({ to, subject, html, category, scheduledAt });
    res.json({ success: true, jobId: job.id, message: 'Email added to background queue' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Queue Status/Metrics
 */
router.get('/queue-status', async (req, res) => {
  try {
    const metrics = await emailQueue.getQueueMetrics();
    res.json({ success: true, metrics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
