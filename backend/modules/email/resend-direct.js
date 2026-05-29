/**
 * resend-direct.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Zero-dependency Resend client for guaranteed OTP / password-reset delivery.
 * Does NOT depend on the `email_providers` DB table or BullMQ — fires directly
 * via the Resend REST API with 3× exponential-backoff retry.
 *
 * Usage:
 *   import { sendDirectEmail } from '../modules/email/resend-direct.js';
 *   await sendDirectEmail({ to, subject, html, type });
 */

import logger from '../../utils/logger.js';
import { logEmailAttempt } from './email-log.js';

const RESEND_API_URL = 'https://api.resend.com/emails';
const MAX_ATTEMPTS   = 3;
const BASE_DELAY_MS  = 2000; // 2 s → 4 s → 8 s

function getFromAddress() {
  const name    = process.env.EMAIL_FROM_NAME    || 'Click Opticx';
  const address = process.env.EMAIL_FROM_ADDRESS || 'no-reply@clickopticx.com';
  return `${name} <${address}>`;
}

/**
 * Sleep helper
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Send an email directly via Resend REST API with retry.
 * @param {{ to: string, subject: string, html: string, type?: string }} opts
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string, provider: string }>}
 */
export async function sendDirectEmail({ to, subject, html, type = 'transactional' }) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    const msg = 'RESEND_API_KEY is not set — cannot send email';
    logger.error(`[RESEND-DIRECT] ${msg}`);
    await logEmailAttempt({ to, type, status: 'failed', error: msg });
    return { success: false, error: msg, provider: 'resend' };
  }

  let lastError = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const jobId = `resend_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    try {
      logger.info(`[RESEND-DIRECT] Attempt ${attempt}/${MAX_ATTEMPTS} → ${to} | jobId=${jobId} | type=${type}`);

      const response = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: getFromAddress(),
          to: Array.isArray(to) ? to : [to],
          subject,
          html
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || data?.name || `HTTP ${response.status}`);
      }

      logger.info(`[RESEND-DIRECT] ✅ Delivered | to=${to} | messageId=${data.id} | jobId=${jobId}`);
      await logEmailAttempt({ to, type, status: 'success', jobId, messageId: data.id });
      return { success: true, messageId: data.id, jobId, provider: 'resend' };

    } catch (err) {
      lastError = err.message;
      logger.warn(`[RESEND-DIRECT] ❌ Attempt ${attempt} failed | to=${to} | error=${lastError}`);

      if (attempt < MAX_ATTEMPTS) {
        const waitMs = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        logger.info(`[RESEND-DIRECT] Retrying in ${waitMs}ms...`);
        await sleep(waitMs);
      }
    }
  }

  // All attempts exhausted — try Gmail SMTP as last-resort fallback
  logger.error(`[RESEND-DIRECT] All ${MAX_ATTEMPTS} Resend attempts failed for ${to}. Falling back to Gmail SMTP.`);
  return await sendViaGmailFallback({ to, subject, html, type, lastError });
}

/**
 * Gmail SMTP last-resort fallback (nodemailer)
 */
async function sendViaGmailFallback({ to, subject, html, type, lastError }) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    const msg = `All delivery paths failed. Resend: ${lastError}. Gmail not configured.`;
    logger.error(`[GMAIL-FALLBACK] ${msg}`);
    await logEmailAttempt({ to, type, status: 'failed', error: msg, provider: 'gmail_smtp' });
    return { success: false, error: msg, provider: 'none' };
  }

  try {
    const nodemailer = (await import('nodemailer')).default;
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass }
    });
    const info = await transporter.sendMail({
      from: `"Click Opticx" <${gmailUser}>`,
      to,
      subject,
      html
    });
    logger.info(`[GMAIL-FALLBACK] ✅ Delivered via Gmail SMTP | to=${to} | messageId=${info.messageId}`);
    await logEmailAttempt({ to, type, status: 'success', messageId: info.messageId, provider: 'gmail_smtp' });
    return { success: true, messageId: info.messageId, provider: 'gmail_smtp' };
  } catch (smtpErr) {
    const msg = `Gmail SMTP also failed: ${smtpErr.message}`;
    logger.error(`[GMAIL-FALLBACK] ${msg}`);
    await logEmailAttempt({ to, type, status: 'failed', error: msg, provider: 'gmail_smtp' });
    return { success: false, error: msg, provider: 'none' };
  }
}

export default { sendDirectEmail };
