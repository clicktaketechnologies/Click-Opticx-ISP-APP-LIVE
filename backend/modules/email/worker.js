const { Worker } = require('bullmq');
const logger = require('../../utils/logger');
const { sendEmail } = require('./email-router');

const EMAIL_QUEUE_NAME = 'manual-email-reminders';

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD
};

/**
 * Initialize Email Queue Worker
 */
function initWorker() {
  const worker = new Worker(EMAIL_QUEUE_NAME, async (job) => {
    const { to, subject, html, category } = job.data;
    
    logger.info(`[EMAIL-WORKER] Processing job ${job.id} for ${to}`);
    
    try {
      await sendEmail({ to, subject, html, category });
      logger.info(`[EMAIL-WORKER] Job ${job.id} completed successfully`);
    } catch (error) {
      logger.error(`[EMAIL-WORKER] Job ${job.id} failed: ${error.message}`);
      throw error; // Let BullMQ handle retries
    }
  }, { 
    connection,
    concurrency: 5 
  });

  worker.on('completed', (job) => {
    // Optional: Log completion to DB
  });

  worker.on('failed', (job, err) => {
    logger.error(`[EMAIL-WORKER] Job ${job.id} failed definitively: ${err.message}`);
  });

  logger.info('🚀 Email Queue Worker started');
  return worker;
}

module.exports = { initWorker };
