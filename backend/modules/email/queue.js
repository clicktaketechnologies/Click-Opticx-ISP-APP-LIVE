/**
 * queue.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Dual-Mode Email Queue Backend (ES Module)
 * Supports real BullMQ + robust InMemory fallback with retry & DLQ semantics.
 */

import { Queue } from 'bullmq';
import logger from '../../utils/logger.js';
import emailRouter from './email-router.js';
import nodemailer from 'nodemailer';

// Connection details
const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD
};

const EMAIL_QUEUE_NAME = 'manual-email-reminders';
const USE_BULLMQ = !!process.env.REDIS_HOST;

let emailQueue;
let inMemoryQueueInstance = null;

// Dead-Letter Queue (DLQ) array to log definitive failures
const dlqJobs = [];

class InMemoryQueue {
  constructor() {
    this.jobs = [];
    this.concurrency = 5;
    this.activeWorkers = 0;
    logger.warn('⚠️ INITIALIZING PROD-GRADE IN-MEMORY QUEUE FALLBACK (NO REDIS HOST DETECTED)');
  }

  async add(name, data, options = {}) {
    const delay = options.delay || 0;
    const attempts = options.attempts || 3;

    const job = {
      id: `job_${Math.random().toString(36).substring(2, 11)}`,
      name,
      data,
      attempts,
      attemptsMade: 0,
      status: 'waiting',
      failedReason: null,
      delay,
      timestamp: Date.now(),
      processedOn: null,
      backoff: options.backoff || { type: 'exponential', delay: 60000 }
    };

    this.jobs.push(job);
    logger.info(`[IN-MEMORY-QUEUE] Job ${job.id} added for ${data.to} (Delay: ${delay}ms)`);

    // Process asynchronously after delay
    if (delay > 0) {
      setTimeout(() => {
        job.status = 'waiting';
        this.processQueue();
      }, delay);
    } else {
      process.nextTick(() => this.processQueue());
    }

    return job;
  }

  async processQueue() {
    if (this.activeWorkers >= this.concurrency) return;

    const nextJob = this.jobs.find(j => j.status === 'waiting' && (!j.delay || Date.now() - j.timestamp >= j.delay));
    if (!nextJob) return;

    this.activeWorkers++;
    nextJob.status = 'active';
    nextJob.processedOn = Date.now();

    logger.info(`[IN-MEMORY-QUEUE] Processing Job ${nextJob.id} for ${nextJob.data.to}`);

    try {
      // Execute the job payload
      let result = await emailRouter.sendEmail({
        to: nextJob.data.to,
        subject: nextJob.data.subject,
        html: nextJob.data.html,
        userId: nextJob.data.userId,
        templateId: nextJob.data.category
      });

      if (!result || !result.success) {
        throw new Error(result?.error || 'EmailRouter failed to deliver');
      }

      nextJob.status = 'completed';
      logger.info(`[IN-MEMORY-QUEUE] Job ${nextJob.id} completed successfully`);
    } catch (err) {
      nextJob.attemptsMade++;
      nextJob.failedReason = err.message;

      if (nextJob.attemptsMade >= nextJob.attempts) {
        nextJob.status = 'failed';
        dlqJobs.push(nextJob);
        logger.error(`[IN-MEMORY-QUEUE-DLQ] Job ${nextJob.id} failed definitively after ${nextJob.attemptsMade} attempts: ${err.message}`);
        
        // Attempt SMTP direct fallback
        try {
          logger.info(`[IN-MEMORY-QUEUE-DLQ] Attempting SMTP Fallback directly for ${nextJob.data.to}...`);
          // SECURITY FIX: a live Gmail app password was hardcoded as fallback here.
          // Credentials now come strictly from the environment.
          if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
            throw new Error('GMAIL_USER/GMAIL_APP_PASSWORD not configured — cannot use SMTP fallback');
          }
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.GMAIL_USER,
              pass: process.env.GMAIL_APP_PASSWORD
            }
          });
          await transporter.sendMail({
            from: `"Click Opticx" <${process.env.GMAIL_USER || 'clickopticx@gmail.com'}>`,
            to: nextJob.data.to,
            subject: nextJob.data.subject,
            html: nextJob.data.html
          });
          logger.info(`[IN-MEMORY-QUEUE-DLQ] SMTP Direct Fallback succeeded for ${nextJob.data.to}`);
        } catch (smtpErr) {
          logger.error(`[IN-MEMORY-QUEUE-DLQ] SMTP Direct Fallback also failed: ${smtpErr.message}`);
        }
      } else {
        nextJob.status = 'waiting';
        const backoffDelay = nextJob.backoff.delay * nextJob.attemptsMade;
        logger.warn(`[IN-MEMORY-QUEUE] Job ${nextJob.id} failed (attempt ${nextJob.attemptsMade}/${nextJob.attempts}). Retrying in ${backoffDelay}ms. Error: ${err.message}`);
        setTimeout(() => {
          this.processQueue();
        }, backoffDelay);
      }
    } finally {
      this.activeWorkers--;
      this.processQueue();
    }
  }

  async getWaitingCount() { return this.jobs.filter(j => j.status === 'waiting').length; }
  async getActiveCount() { return this.jobs.filter(j => j.status === 'active').length; }
  async getCompletedCount() { return this.jobs.filter(j => j.status === 'completed').length; }
  async getFailedCount() { return this.jobs.filter(j => j.status === 'failed').length; }
  async getDelayedCount() { return this.jobs.filter(j => j.status === 'waiting' && j.delay > 0 && Date.now() - j.timestamp < j.delay).length; }
}

if (USE_BULLMQ) {
  emailQueue = new Queue(EMAIL_QUEUE_NAME, { connection });
  logger.info('🚀 BULLMQ EMAIL QUEUE INITIALIZED SUCCESSFULLY');
} else {
  inMemoryQueueInstance = new InMemoryQueue();
  emailQueue = inMemoryQueueInstance;
}

/**
 * Add an email job to the queue
 */
export async function addEmailToQueue(params) {
  const { to, subject, html, category, scheduledAt, userId } = params;
  const delay = scheduledAt ? Math.max(0, new Date(scheduledAt).getTime() - Date.now()) : 0;

  if (USE_BULLMQ) {
    const job = await emailQueue.add('send-email', {
      to, subject, html, category, userId
    }, {
      delay,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 60000, // 1 min
      }
    });
    logger.info(`[BULLMQ-QUEUE] Job ${job.id} added for ${to} (Delay: ${delay}ms)`);
    return job;
  } else {
    return await emailQueue.add('send-email', { to, subject, html, category, userId }, {
      delay,
      attempts: 3,
      backoff: { type: 'exponential', delay: 60000 }
    });
  }
}

/**
 * Get queue metrics
 */
export async function getQueueMetrics() {
  if (USE_BULLMQ) {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      emailQueue.getWaitingCount(),
      emailQueue.getActiveCount(),
      emailQueue.getCompletedCount(),
      emailQueue.getFailedCount(),
      emailQueue.getDelayedCount(),
    ]);
    return { waiting, active, completed, failed, delayed, dlq: dlqJobs.length };
  } else {
    return {
      waiting: await emailQueue.getWaitingCount(),
      active: await emailQueue.getActiveCount(),
      completed: await emailQueue.getCompletedCount(),
      failed: await emailQueue.getFailedCount(),
      delayed: await emailQueue.getDelayedCount(),
      dlq: dlqJobs.length
    };
  }
}

/**
 * Get jobs by status
 */
export async function getJobs(status = 'waiting') {
  if (USE_BULLMQ) {
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
  } else {
    return emailQueue.jobs
      .filter(j => j.status === status)
      .map(j => ({
        id: j.id,
        data: j.data,
        status: j.status,
        timestamp: j.timestamp,
        processedOn: j.processedOn,
        failedReason: j.failedReason,
        attemptsMade: j.attemptsMade
      }));
  }
}

/**
 * Get dead letter queue (DLQ) jobs
 */
export function getDLQJobs() {
  return dlqJobs;
}

export default { addEmailToQueue, getQueueMetrics, getJobs, getDLQJobs, emailQueue };
