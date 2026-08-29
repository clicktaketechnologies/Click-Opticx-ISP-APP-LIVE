/**
 * email-log.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Structured email attempt logger.
 * Writes to:
 *   1. logger (winston) — always, synchronous
 *   2. Supabase `email_logs` table — async, non-blocking, best-effort
 *
 * RESILIENT: If new columns (type, job_id, message_id) haven't been migrated yet,
 * it falls back to storing the data in existing columns (error_message, trigger_source).
 *
 * Log record shape:
 *   { to, type, status, error, provider, messageId, jobId, timestamp }
 */

import logger from '../../utils/logger.js';

// Lazy schema check — cached after first probe
let _schemaChecked = false;
let _hasNewColumns = false;
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

async function checkSchema(sb) {
  if (_schemaChecked) return _hasNewColumns;
  try {
    const { data } = await sb.from('email_logs').select('*').limit(1);
    if (data && data.length > 0) {
      _hasNewColumns = 'type' in data[0] && 'job_id' in data[0] && 'message_id' in data[0];
    } else {
      // Empty table — try insert with new columns to see if they exist
      const { error } = await sb.from('email_logs').insert({
        email: 'schema-probe@internal',
        type: 'probe',
        job_id: 'probe',
        message_id: 'probe',
        status: 'Failed',
        provider_used: 'probe',
        template_id: 'probe',
        created_at: new Date().toISOString()
      });
      if (!error) {
        _hasNewColumns = true;
        await sb.from('email_logs').delete().eq('email', 'schema-probe@internal');
      } else if (error.message && error.message.includes('column')) {
        _hasNewColumns = false;
      }
    }
  } catch {
    _hasNewColumns = false;
  }
  _schemaChecked = true;
  return _hasNewColumns;
}

/**
 * Log an email delivery attempt.
 *
 * @param {{
 *   to: string,
 *   type: string,          // 'otp' | 'password_reset' | 'transactional'
 *   status: 'success' | 'failed',
 *   error?: string,
 *   provider?: string,     // 'resend' | 'gmail_smtp' | 'brevo'
 *   jobId?: string,
 *   messageId?: string
 * }} opts
 */
export async function logEmailAttempt({ to, type, status, error, provider = 'resend', jobId, messageId }) {
  const timestamp = new Date().toISOString();

  // ── 1. Structured log to winston (ALWAYS fires) ────────────────────────────
  const record = {
    to,
    type,
    status,
    error:     error     || null,
    provider,
    jobId:     jobId     || null,
    messageId: messageId || null,
    timestamp
  };

  if (status === 'success') {
    logger.info('[EMAIL-LOG] ' + JSON.stringify(record));
  } else {
    logger.error('[EMAIL-LOG] ' + JSON.stringify(record));
  }

  // ── 2. Supabase persist (non-blocking, resilient) ──────────────────────────
  const sb = await getSupabase();
  if (!sb) return;

  try {
    const hasNew = await checkSchema(sb);

    // Build insert row based on what columns exist
    const row = {
      email:         to,
      status:        status === 'success' ? 'Delivered' : 'Failed',
      provider_used: provider,
      subject:       `[${type.toUpperCase()}] Auto-logged`,
      created_at:    timestamp,
      template_id:   type || 'transactional'
    };

    if (hasNew) {
      // New columns available — use them directly
      row.type       = type;
      row.job_id     = jobId     || null;
      row.message_id = messageId || null;
      if (error) row.error_message = error;
    } else {
      // Fallback: pack extra data into existing columns
      const extraInfo = [];
      if (type)      extraInfo.push(`type=${type}`);
      if (jobId)     extraInfo.push(`jobId=${jobId}`);
      if (messageId) extraInfo.push(`msgId=${messageId}`);
      if (error)     extraInfo.push(`err=${error}`);
      row.error_message  = error || null;
      row.trigger_source = extraInfo.join(' | ').slice(0, 255); // use trigger_source for metadata
    }

    const { error: dbErr } = await sb.from('email_logs').insert(row);
    if (dbErr) {
      logger.warn(`[EMAIL-LOG] DB persist non-critical: ${dbErr.message}`);
    }
  } catch (persistErr) {
    logger.warn(`[EMAIL-LOG] DB persist exception (non-critical): ${persistErr.message}`);
  }
}

export default { logEmailAttempt };
