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

// Initialize Queue only if REDIS_HOST is provided, otherwise mock it
let emailQueue;
const USE_BULLMQ = !!process.env.REDIS_HOST;

if (USE_BULLMQ) {
  emailQueue = new Queue(EMAIL_QUEUE_NAME, { connection });
} else {
  logger.warn('⚠️ REDIS_HOST not set. Disabling BullMQ Email Queue.');
  emailQueue = {
    add: async () => ({ id: 'mock-job' }),
    getWaitingCount: async () => 0,
    getActiveCount: async () => 0,
    getCompletedCount: async () => 0,
    getFailedCount: async () => 0,
    getDelayedCount: async () => 0,
    getJobs: async () => [],
    getJob: async () => null,
  };
}

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

/**
 * Get jobs by status
 */
async function getJobs(status = 'waiting') {
  const jobs = await emailQueue.getJobs([status]);
  return jobs.map(j => ({
    id: j.id,
    data: j.data,
    status: status,
    timestamp: j.timestamp,
    processedOn: j.processedOn,
    failedReason: j.failedReason,
    attemptsMade: j.attemptsMade
  }));
}

/**
 * Retry a failed job
 */
async function retryJob(jobId) {
  const job = await emailQueue.getJob(jobId);
  if (job && (await job.isFailed())) {
    await job.retry();
    return { success: true };
  }
  return { success: false, message: 'Job not found or not in failed state' };
}

/**
 * Cancel/Remove a job
 */
async function cancelJob(jobId) {
  const job = await emailQueue.getJob(jobId);
  if (job) {
    await job.remove();
    return { success: true };
  }
  return { success: false, message: 'Job not found' };
}

module.exports = { addEmailToQueue, getQueueMetrics, emailQueue, getJobs, retryJob, cancelJob };
