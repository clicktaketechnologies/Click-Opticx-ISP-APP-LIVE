/**
 * config.js — Runtime Config Routes
 */

import express from 'express';
import axios from 'axios';
import FormData from 'form-data';
import cloudinary from 'cloudinary';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import configManager from '../services/config-manager.js';
import logger from '../utils/logger.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();
const cloudinaryV2 = cloudinary.v2;

// ─── GET all configs ──────────────────────────────────────────────────────────
router.get('/', protect, restrictTo('SuperAdmin', 'Admin'), (req, res) => {
  const all = configManager.getAllConfigs();
  res.json({ success: true, configs: all });
});

// ─── GET single config ────────────────────────────────────────────────────────
router.get('/:key', protect, (req, res) => {
  const value = configManager.getConfig(req.params.key);
  if (value === null) {
    return res.status(404).json({ success: false, message: 'Config key not found' });
  }
  res.json({ success: true, key: req.params.key, value });
});

// ─── PUT update config ────────────────────────────────────────────────────────
router.put('/:key', protect, restrictTo('SuperAdmin', 'Admin'), async (req, res) => {
  try {
    const { key } = req.params;
    const { value, updatedBy } = req.body;

    if (value === undefined) {
      return res.status(400).json({ success: false, message: 'value is required' });
    }

    const result = await configManager.setConfig(key, value, updatedBy || req.user.id);
    if (!result.success) {
      return res.status(500).json({ success: false, message: result.error });
    }

    logger.info(`[CONFIG] Updated: "${key}" by ${updatedBy || req.user.id}`);
    res.json({ success: true, message: `Config "${key}" updated successfully` });
  } catch (e) {
    logger.error('[CONFIG] Update error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── POST rollback ────────────────────────────────────────────────────────────
router.post('/:key/rollback', protect, restrictTo('SuperAdmin', 'Admin'), async (req, res) => {
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

// ─── POST clear-cache ─────────────────────────────────────────────────────────
router.post('/clear-cache', protect, restrictTo('SuperAdmin', 'Admin'), async (req, res) => {
  try {
    logger.warn(`[CONFIG] Global Cache Purge initiated by ${req.user.id}`);
    await configManager.init();
    res.json({ success: true, message: 'Backend cache layers synchronized successfully' });
  } catch (e) {
    logger.error('[CONFIG] Cache purge error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── GET config history ───────────────────────────────────────────────────────
router.get('/:key/history', protect, restrictTo('SuperAdmin', 'Admin'), async (req, res) => {
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
router.post('/test-provider', protect, restrictTo('SuperAdmin', 'Admin'), async (req, res) => {
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

async function testEmailProvider(providerId) {
  const adminEmail = process.env.GMAIL_USER || 'clickopticx@gmail.com';

  if (providerId === 'resend') {
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

async function testStorageProvider(providerId) {
  if (providerId === 'cloudinary') {
    cloudinaryV2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const result = await cloudinaryV2.api.ping();
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

router.get('/app', protect, (req, res) => {
    const portal_access = configManager.getConfig('portal_access') ?? true;
    const app_access = configManager.getConfig('app_access') ?? true;
    res.json({ success: true, portal_access, app_access });
});

router.put('/app', protect, restrictTo('SuperAdmin', 'Admin'), async (req, res) => {
    try {
        const { portal_access, app_access } = req.body;
        if (portal_access !== undefined) await configManager.setConfig('portal_access', portal_access, req.user.id);
        if (app_access !== undefined) await configManager.setConfig('app_access', app_access, req.user.id);
        
        const io = req.app.get('socketio');
        if (io) io.emit('config_updated', { portal_access, app_access });

        res.json({ success: true, message: 'App access settings updated.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
