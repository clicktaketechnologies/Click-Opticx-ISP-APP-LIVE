import { Worker } from 'bullmq';
import logger from '../../utils/logger.js';
import emailRouter from './email-router.js';
import nodemailer from 'nodemailer';

const EMAIL_QUEUE_NAME = 'manual-email-reminders';

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD
};

/**
 * Initialize Email Queue Worker
 */
export function initWorker() {
  if (!process.env.REDIS_HOST) {
    logger.warn('⚠️ REDIS_HOST not set. Skipping BullMQ Worker initialization.');
    return null;
  }

  const worker = new Worker(EMAIL_QUEUE_NAME, async (job) => {
    const { to, subject, html, category } = job.data;
    
    logger.info(`[EMAIL-WORKER] Processing job ${job.id} for ${to}`);
    
    try {
      await emailRouter.sendEmail({ to, subject, html, category });
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

import { addEmailToQueue } from './queue.js';

export const queueEmail = async (data) => {
    try {
        await addEmailToQueue(data);
    } catch (e) {
        logger.error(`[EMAIL-WORKER] Failed to add email to queue: ${e.message}`);
    }
};

export default { initWorker, queueEmail };
