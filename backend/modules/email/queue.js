const { Queue, Worker } = require('bullmq');
const logger = require('../../utils/logger');
const redis = require('../../services/redisService');
const { sendEmail } = require('./email-router');

// Queue Name
const EMAIL_QUEUE_NAME = 'manual-email-reminders';

// Redis connection options for BullMQ
const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD
};

// Initialize Queue
const emailQueue = new Queue(EMAIL_QUEUE_NAME, { connection });

/**
 * Add an email job to the queue
 */
async function addEmailToQueue(params) {
  const { to, subject, html, category, scheduledAt } = params;
  
  const delay = scheduledAt ? Math.max(0, new Date(scheduledAt).getTime() - Date.now()) : 0;

  const job = await emailQueue.add('send-email', {
    to, subject, html, category
  }, {
    delay,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60000, // 1 min
    }
  });

  logger.info(`[EMAIL-QUEUE] Job ${job.id} added for ${to} (Delay: ${delay}ms)`);
  return job;
}

/**
 * Get queue metrics
 */
async function getQueueMetrics() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    emailQueue.getWaitingCount(),
    emailQueue.getActiveCount(),
    emailQueue.getCompletedCount(),
    emailQueue.getFailedCount(),
    emailQueue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}

module.exports = { addEmailToQueue, getQueueMetrics, emailQueue };
