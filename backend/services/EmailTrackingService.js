import { Queue, Worker } from 'bullmq';
import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';
import { createClient } from '@supabase/supabase-js';

const redisOptions = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
};

let _supabase = null;
const getSupabase = () => {
    if (!_supabase) {
        _supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    }
    return _supabase;
};

let emailQueue;
let emailWorker;

const USE_BULLMQ = !!process.env.REDIS_HOST;

if (USE_BULLMQ) {
    try {
        emailQueue = new Queue('email-dispatch', { connection: redisOptions });
        logger.info('✅ Email Queue Initialized');
    } catch (e) {
        logger.warn('⚠️ Email Queue failed to initialize (Redis missing):', e.message);
    }
} else {
    logger.warn('⚠️ REDIS_HOST not set. Disabling EmailTrackingService Queue.');
    emailQueue = {
        add: async () => ({ id: 'mock-job' })
    };
}

/**
 * Helper to wrap links with click-tracking
 */
const injectTracking = (html, campaignId, recipient) => {
    const trackingUrl = `${process.env.BACKEND_URL}/api/communication/track`;
    
    // Inject invisible 1x1 tracking pixel
    const pixel = `<img src="${trackingUrl}/open?c=${campaignId}&r=${recipient}" width="1" height="1" style="display:none;" />`;
    
    // Rewrite hrefs for click tracking (Simplified Regex for demo)
    const trackedHtml = html.replace(/href="(http.*?)"/g, `href="${trackingUrl}/click?c=${campaignId}&r=${recipient}&url=$1"`);
    
    return trackedHtml + pixel;
};

if (USE_BULLMQ) {
    try {
        // Create Worker
        emailWorker = new Worker('email-dispatch', async job => {
            const { to, subject, html, campaignId } = job.data;
            logger.info(`[BULLMQ] Processing email job ${job.id} for ${to}`);

            const trackedHtml = injectTracking(html, campaignId, to);

            // Normally read from configManager or DB
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                secure: true,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });

            try {
                const info = await transporter.sendMail({
                    from: `"Click Opticx" <${process.env.SMTP_USER}>`,
                    to,
                    subject,
                    html: trackedHtml
                });
                
                await getSupabase().from('audit_logs').insert({
                    action: 'EMAIL_SENT',
                    details: `Delivered to ${to} (Job ${job.id})`,
                    metadata: { messageId: info.messageId, campaignId }
                });

                return info;
            } catch (error) {
                logger.error(`[BULLMQ] Email failure: ${error.message}`);
                throw error; // Triggers retry mechanism
            }
        }, { connection: redisOptions });

        if (emailWorker) {
            emailWorker.on('completed', job => {
                logger.info(`[BULLMQ] Job ${job.id} has completed!`);
            });

            emailWorker.on('failed', (job, err) => {
                logger.error(`[BULLMQ] Job ${job.id} has failed with ${err.message}`);
            });
        }
    } catch (e) {
        logger.warn('⚠️ Email Worker failed to initialize (Redis missing):', e.message);
    }
}

export const enqueueEmail = async (payload) => {
    return await emailQueue.add('send-email', payload, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 }
    });
};

export default { enqueueEmail };
