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

let _supabase = null;
async function getSupabase() {
  if (_supabase) return _supabase;
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    _supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    return _supabase;
  } catch {
    return null;
  }
}

async function getProviderStatus(providerId) {
    const sb = await getSupabase();
    if (!sb) return true;
    try {
        const { data } = await sb.from('email_providers').select('enabled').eq('id', providerId).single();
        if (data) return data.enabled;
    } catch(e) {
        // ignore
    }
    return true; // Default to enabled if error
}

export async function sendDirectEmail({ to, subject, html, type = 'transactional' }) {
  // 1st Priority: Try Gmail / SMTP
  const gmailResult = await sendViaGmailFallback({ to, subject, html, type, lastError: null, isPrimary: true });
  if (gmailResult.success) {
    return gmailResult;
  }

  // 2nd Priority: Custom SMTP
  const customSmtpResult = await sendViaGenericSmtp({ to, subject, html, type, lastError: gmailResult.error });
  if (customSmtpResult.success) {
    return customSmtpResult;
  }

  // 3rd Priority: Try Resend
  const isResendEnabled = await getProviderStatus('resend');
  if (!isResendEnabled) {
      logger.info(`[RESEND-DIRECT] Resend provider is disabled by admin. Skipping direct Resend path.`);
      return { success: false, error: 'All paths failed or disabled', provider: 'none' };
  }

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

  return { success: false, error: lastError, provider: 'resend' };
}

/**
 * Gmail SMTP path (nodemailer)
 */
async function sendViaGmailFallback({ to, subject, html, type, lastError, isPrimary = false }) {
  const isGmailEnabled = await getProviderStatus('gmail_smtp');
  const label = isPrimary ? '[GMAIL-PRIMARY]' : '[GMAIL-FALLBACK]';

  if (!isGmailEnabled) {
      const msg = isPrimary ? `Gmail SMTP is disabled by admin.` : `All primary delivery paths failed (or disabled). Gmail SMTP fallback is also disabled by admin.`;
      logger.info(`${label} ${msg}`);
      if (!isPrimary) await logEmailAttempt({ to, type, status: 'failed', error: msg, provider: 'none' });
      return { success: false, error: msg, provider: 'none' };
  }
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    const msg = isPrimary ? `Gmail credentials not configured.` : `All delivery paths failed. Resend: ${lastError}. Gmail not configured.`;
    logger.error(`${label} ${msg}`);
    if (!isPrimary) await logEmailAttempt({ to, type, status: 'failed', error: msg, provider: 'gmail_smtp' });
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
    logger.info(`${label} ✅ Delivered via Gmail SMTP | to=${to} | messageId=${info.messageId}`);
    await logEmailAttempt({ to, type, status: 'success', messageId: info.messageId, provider: 'gmail_smtp' });
    return { success: true, messageId: info.messageId, provider: 'gmail_smtp' };
  } catch (smtpErr) {
    const msg = `Gmail SMTP failed: ${smtpErr.message}`;
    logger.error(`${label} ${msg}`);
    if (!isPrimary) await logEmailAttempt({ to, type, status: 'failed', error: msg, provider: 'gmail_smtp' });
    return { success: false, error: msg, provider: 'none' };
  }
}

export default { sendDirectEmail };

/**
 * Generic Custom SMTP path (nodemailer)
 */
async function sendViaGenericSmtp({ to, subject, html, type, lastError }) {
  const isSmtpEnabled = await getProviderStatus('custom_smtp');
  if (!isSmtpEnabled) {
      return { success: false, error: 'Custom SMTP disabled by admin', provider: 'none' };
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      return { success: false, error: 'Custom SMTP not configured', provider: 'none' };
  }

  try {
    const nodemailer = (await import('nodemailer')).default;
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT, 10),
      secure: parseInt(SMTP_PORT, 10) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    });
    const info = await transporter.sendMail({
      from: `"Click Opticx" <${SMTP_USER}>`,
      to,
      subject,
      html
    });
    logger.info(`[CUSTOM-SMTP] ✅ Delivered via Custom SMTP | to=${to} | messageId=${info.messageId}`);
    await logEmailAttempt({ to, type, status: 'success', messageId: info.messageId, provider: 'custom_smtp' });
    return { success: true, messageId: info.messageId, provider: 'custom_smtp' };
  } catch (smtpErr) {
    const msg = `Custom SMTP failed: ${smtpErr.message}`;
    logger.error(`[CUSTOM-SMTP] ${msg}`);
    await logEmailAttempt({ to, type, status: 'failed', error: msg, provider: 'custom_smtp' });
    return { success: false, error: msg, provider: 'none' };
  }
}
