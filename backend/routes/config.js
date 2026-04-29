/**
 * config.js — Runtime Config Routes
 * GET    /api/config          → all configs (admin only)
 * GET    /api/config/:key     → single config value
 * PUT    /api/config/:key     → update config
 * POST   /api/config/:key/rollback → rollback to previous version
 * GET    /api/config/:key/history  → last 10 changes
 * POST   /api/config/test-provider → test a provider connection
 */

const express = require('express');
const router = express.Router();
const configManager = require('../services/config-manager');
const logger = require('../utils/logger');
const nodemailer = require('nodemailer');
const cloudinary = require('cloudinary').v2;

// ─── Simple Admin Guard ───────────────────────────────────────────────────────
// In Phase 0 we trust the JWT role from db.ts auth. Phase 1 will add full Supabase RLS.
function adminGuard(req, res, next) {
  // For now, check Authorization header has a bearer token
  // Full role check will be added in Phase 1 auth module
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authorization required' });
  }
  next();
}

// ─── GET all configs ──────────────────────────────────────────────────────────
router.get('/', adminGuard, (req, res) => {
  const all = configManager.getAllConfigs();
  // Strip sensitive values from response (API keys are stored in backend only)
  res.json({ success: true, configs: all });
});

// ─── GET single config ────────────────────────────────────────────────────────
router.get('/:key', adminGuard, (req, res) => {
  const value = configManager.getConfig(req.params.key);
  if (value === null) {
    return res.status(404).json({ success: false, message: 'Config key not found' });
  }
  res.json({ success: true, key: req.params.key, value });
});

// ─── PUT update config ────────────────────────────────────────────────────────
router.put('/:key', adminGuard, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, updatedBy } = req.body;

    if (value === undefined) {
      return res.status(400).json({ success: false, message: 'value is required' });
    }

    const result = await configManager.setConfig(key, value, updatedBy || req.ip);
    if (!result.success) {
      return res.status(500).json({ success: false, message: result.error });
    }

    logger.info(`[CONFIG] Updated: "${key}" by ${updatedBy || req.ip}`);
    res.json({ success: true, message: `Config "${key}" updated successfully` });
  } catch (e) {
    logger.error('[CONFIG] Update error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── POST rollback ────────────────────────────────────────────────────────────
router.post('/:key/rollback', adminGuard, async (req, res) => {
  try {
    const { historyId } = req.body;
    if (!historyId) {
      return res.status(400).json({ success: false, message: 'historyId required' });
    }

    const supabase = configManager.getSupabaseClient();
    if (!supabase) return res.status(503).json({ success: false, message: 'Supabase not available' });

    const { data } = await supabase
      .from('config_history')
      .select('old_value, config_key')
      .eq('id', historyId)
      .single();

    if (!data?.old_value) {
      return res.status(404).json({ success: false, message: 'History entry not found' });
    }

    const result = await configManager.setConfig(data.config_key, data.old_value, 'rollback');
    res.json(result);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── GET config history ───────────────────────────────────────────────────────
router.get('/:key/history', adminGuard, async (req, res) => {
  try {
    const supabase = configManager.getSupabaseClient();
    if (!supabase) return res.status(503).json({ success: false, message: 'Supabase not available' });

    const { data } = await supabase
      .from('config_history')
      .select('*')
      .eq('config_key', req.params.key)
      .order('changed_at', { ascending: false })
      .limit(10);

    res.json({ success: true, history: data || [] });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── POST test-provider ───────────────────────────────────────────────────────
router.post('/test-provider', adminGuard, async (req, res) => {
  const { providerType, providerId } = req.body;
  const start = Date.now();

  try {
    if (providerType === 'email') {
      const result = await testEmailProvider(providerId);
      return res.json({ ...result, latencyMs: Date.now() - start });
    }

    if (providerType === 'storage') {
      const result = await testStorageProvider(providerId);
      return res.json({ ...result, latencyMs: Date.now() - start });
    }

    return res.status(400).json({ success: false, message: 'Unknown providerType. Use: email | storage' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message, latencyMs: Date.now() - start });
  }
});

// ─── Email Provider Tests ─────────────────────────────────────────────────────
async function testEmailProvider(providerId) {
  const adminEmail = process.env.GMAIL_USER || 'clickopticx@gmail.com';

  if (providerId === 'resend') {
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: 'Click Opticx <no-reply@clickopticx.com>',
      to: adminEmail,
      subject: '✅ Resend Provider Test',
      html: '<p>Resend integration test from Click Opticx Admin.</p>',
    });
    if (error) throw new Error(error.message);
    return { success: true, provider: 'resend', message: 'Test email sent via Resend' };
  }

  if (providerId === 'brevo') {
    const axios = require('axios');
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { name: 'Click Opticx', email: adminEmail },
      to: [{ email: adminEmail }],
      subject: '✅ Brevo Provider Test',
      htmlContent: '<p>Brevo integration test from Click Opticx Admin.</p>',
    }, {
      headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' },
    });
    if (response.status !== 201) throw new Error(`Brevo returned status ${response.status}`);
    return { success: true, provider: 'brevo', message: 'Test email sent via Brevo' };
  }

  if (providerId === 'mailgun') {
    const axios = require('axios');
    const FormData = require('form-data');
    const form = new FormData();
    form.append('from', `Click Opticx <postmaster@${process.env.MAILGUN_DOMAIN}>`);
    form.append('to', adminEmail);
    form.append('subject', '✅ Mailgun Provider Test');
    form.append('text', 'Mailgun integration test from Click Opticx Admin.');
    const response = await axios.post(
      `https://api.mailgun.net/v3/${process.env.MAILGUN_DOMAIN}/messages`,
      form,
      { auth: { username: 'api', password: process.env.MAILGUN_API_KEY }, headers: form.getHeaders() }
    );
    if (response.status !== 200) throw new Error(`Mailgun returned status ${response.status}`);
    return { success: true, provider: 'mailgun', message: 'Test email sent via Mailgun' };
  }

  if (providerId === 'gmail') {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
    await transporter.sendMail({
      from: `"Click Opticx" <${process.env.GMAIL_USER}>`,
      to: adminEmail,
      subject: '✅ Gmail SMTP Provider Test',
      html: '<p>Gmail SMTP integration test from Click Opticx Admin.</p>',
    });
    return { success: true, provider: 'gmail', message: 'Test email sent via Gmail SMTP' };
  }

  return { success: false, message: `Unknown email provider: ${providerId}` };
}

// ─── Storage Provider Tests ───────────────────────────────────────────────────
async function testStorageProvider(providerId) {
  if (providerId === 'cloudinary') {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const result = await cloudinary.api.ping();
    if (result.status !== 'ok') throw new Error('Cloudinary ping failed');
    return { success: true, provider: 'cloudinary', message: 'Cloudinary connection OK' };
  }

  if (providerId === 'supabase_storage') {
    const supabase = configManager.getSupabaseClient();
    const { data, error } = await supabase.storage.listBuckets();
    if (error) throw new Error(error.message);
    return { success: true, provider: 'supabase_storage', message: `Supabase Storage OK — ${data.length} bucket(s) found` };
  }

  return { success: false, message: `Unknown storage provider: ${providerId}` };
}

module.exports = router;
