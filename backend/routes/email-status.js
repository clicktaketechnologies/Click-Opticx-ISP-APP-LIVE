/**
 * email-status.js — Email Health Check Route
 * GET /api/email/status
 * ─────────────────────────────────────────────────────────────────────────────
 * Returns:
 *  - Resend API connectivity status
 *  - Gmail SMTP config presence
 *  - Queue depth (BullMQ or in-memory)
 *  - Last 5 email log entries (success / failure)
 *  - Overall health: 'healthy' | 'degraded' | 'down'
 */

import express from 'express';
import { Resend } from 'resend';
import { getQueueMetrics } from '../modules/email/queue.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.get('/status', async (req, res) => {
  const startTime = Date.now();
  const report = {
    timestamp: new Date().toISOString(),
    overall: 'unknown',
    providers: {},
    queue: {},
    recent_logs: [],
    latency_ms: 0
  };

  // ── 1. Resend API check ──────────────────────────────────────────────────
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      report.providers.resend = { status: 'misconfigured', error: 'RESEND_API_KEY not set' };
    } else {
      // Verify key is valid by fetching domains list (lightweight read op)
      const resend = new Resend(apiKey);
      const { data, error } = await resend.domains.list();
      if (error) throw new Error(error.message);
      report.providers.resend = {
        status: 'healthy',
        domains: (data?.data || []).map(d => ({ name: d.name, status: d.status }))
      };
    }
  } catch (err) {
    report.providers.resend = { status: 'error', error: err.message };
  }

  // ── 2. Gmail SMTP config presence check ─────────────────────────────────
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (gmailUser && gmailPass) {
    report.providers.gmail_smtp = { status: 'configured', user: gmailUser };
  } else {
    report.providers.gmail_smtp = {
      status: 'misconfigured',
      error: !gmailUser ? 'GMAIL_USER not set' : 'GMAIL_APP_PASSWORD not set'
    };
  }

  // ── 3. Queue depth ───────────────────────────────────────────────────────
  try {
    const metrics = await getQueueMetrics();
    report.queue = {
      mode: process.env.REDIS_HOST ? 'bullmq' : 'in-memory',
      ...metrics
    };
  } catch (qErr) {
    report.queue = { mode: 'unknown', error: qErr.message };
  }

  // ── 4. Recent email logs from Supabase ───────────────────────────────────
  try {
    const { createClient } = await import('@supabase/supabase-js');
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      // Use only guaranteed columns — type/job_id/message_id may not exist yet
      const { data: logs } = await supabase
        .from('email_logs')
        .select('email, status, error_message, provider_used, trigger_source, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      report.recent_logs = logs || [];
    }
  } catch (logErr) {
    report.recent_logs = [{ note: `Could not fetch logs: ${logErr.message}` }];
  }

  // ── 5. Overall health determination ──────────────────────────────────────
  const resendOk  = report.providers.resend?.status === 'healthy';
  const gmailOk   = report.providers.gmail_smtp?.status === 'configured';
  const queueFail = report.queue?.failed > 10;

  if (resendOk) {
    report.overall = queueFail ? 'degraded' : 'healthy';
  } else if (gmailOk) {
    report.overall = 'degraded'; // Resend down, Gmail fallback available
  } else {
    report.overall = 'down';
  }

  report.latency_ms = Date.now() - startTime;

  const statusCode = report.overall === 'down' ? 503 : 200;
  logger.info(`[EMAIL-STATUS] Health check: ${report.overall} (${report.latency_ms}ms)`);
  res.status(statusCode).json({ success: report.overall !== 'down', ...report });
});

export default router;
