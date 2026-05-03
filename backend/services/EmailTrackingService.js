/**
 * EmailTrackingService.js
 * 
 * Handles email queuing, sending, tracking pixels, and bounce processing using BullMQ.
 */

const { Queue, Worker } = require('bullmq');
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const IORedis = require('ioredis');

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

// Email Queue
const emailQueue = new Queue('email-queue', { connection });

// Email Worker
const emailWorker = new Worker('email-queue', async (job) => {
  const { to, subject, html, trackingId, isMarketing } = job.data;
  
  // Setup Nodemailer transporter with SPF/DKIM configured SMTP
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // DKIM Signature setup
    dkim: {
      domainName: process.env.DKIM_DOMAIN,
      keySelector: process.env.DKIM_SELECTOR,
      privateKey: process.env.DKIM_PRIVATE_KEY
    }
  });

  // Inject tracking pixel
  const trackingPixel = `<img src="${process.env.API_BASE_URL}/api/communication/track/open/${trackingId}" width="1" height="1" />`;
  const trackedHtml = html.replace('</body>', `${trackingPixel}</body>`);

  // Rewrite links for click tracking (simplified example)
  const clickTrackedHtml = trackedHtml.replace(/href="([^"]*)"/g, (match, url) => {
    const encodedUrl = Buffer.from(url).toString('base64');
    return `href="${process.env.API_BASE_URL}/api/communication/track/click/${trackingId}?url=${encodedUrl}"`;
  });

  const mailOptions = {
    from: `"ClickOpticx" <${process.env.SMTP_FROM}>`,
    to,
    subject,
    html: clickTrackedHtml,
    headers: {
      'X-Entity-Ref-ID': trackingId,
      'List-Unsubscribe': `<${process.env.API_BASE_URL}/api/communication/unsubscribe/${trackingId}>`
    }
  };

  const info = await transporter.sendMail(mailOptions);
  logger.info(`[EMAIL SENT] ${info.messageId} to ${to}`);
  return info;
}, { connection });

emailWorker.on('failed', (job, err) => {
  logger.error(`[EMAIL QUEUE ERROR] Job ${job.id} failed: ${err.message}`);
});

class EmailTrackingService {
  async queueEmail(to, subject, html, trackingId, isMarketing = false) {
    await emailQueue.add('send-email', {
      to,
      subject,
      html,
      trackingId,
      isMarketing
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 }
    });
  }

  // Generate SPF/DKIM verification instructions
  getSpfDkimInstructions(domain) {
    return {
      spf: { type: 'TXT', name: '@', value: `v=spf1 include:${process.env.SMTP_PROVIDER_DOMAIN} ~all` },
      dkim: { type: 'TXT', name: `${process.env.DKIM_SELECTOR}._domainkey`, value: 'v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY' },
      dmarc: { type: 'TXT', name: '_dmarc', value: 'v=DMARC1; p=quarantine; rua=mailto:postmaster@yourdomain.com' }
    };
  }
}

module.exports = new EmailTrackingService();
