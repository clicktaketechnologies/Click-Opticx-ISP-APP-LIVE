/**
 * provider-management.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin Routes for Gateways & Providers
 *
 * GET /api/provider-mgmt/gateways
 * PUT /api/provider-mgmt/gateways/:id
 * GET /api/provider-mgmt/email-providers
 * PUT /api/provider-mgmt/email-providers/:id
 */

const express = require('express');
const router = express.Router();
const configManager = require('../services/config-manager');
const logger = require('../utils/logger');

function adminGuard(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authorization required' });
  }
  next();
}

// ─── Payment Gateways ────────────────────────────────────────────────────────
router.get('/gateways', adminGuard, async (req, res) => {
  const supabase = configManager.getSupabaseClient();
  const { data, error } = await supabase
    .from('payment_gateways')
    .select('*')
    .order('priority', { ascending: true });

  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, gateways: data });
});

router.put('/gateways/:id', adminGuard, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const supabase = configManager.getSupabaseClient();

  const { error } = await supabase
    .from('payment_gateways')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return res.status(500).json({ success: false, error: error.message });
  
  logger.info(`[PROVIDER-MGMT] Updated Gateway: ${id}`);
  res.json({ success: true, message: `Gateway ${id} updated` });
});

// ─── Email Providers ─────────────────────────────────────────────────────────
router.get('/email-providers', adminGuard, async (req, res) => {
  const supabase = configManager.getSupabaseClient();
  const { data, error } = await supabase
    .from('email_providers')
    .select('*')
    .order('priority', { ascending: true });

  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, providers: data });
});

router.put('/email-providers/:id', adminGuard, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const supabase = configManager.getSupabaseClient();

  const { error } = await supabase
    .from('email_providers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return res.status(500).json({ success: false, error: error.message });

  logger.info(`[PROVIDER-MGMT] Updated Email Provider: ${id}`);
  res.json({ success: true, message: `Email provider ${id} updated` });
});

// ─── Response Mappings ───────────────────────────────────────────────────────
router.get('/mappings', adminGuard, async (req, res) => {
  const supabase = configManager.getSupabaseClient();
  const { data, error } = await supabase
    .from('response_mappings')
    .select('*')
    .order('provider_id', { ascending: true });

  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, mappings: data });
});

router.post('/mappings', adminGuard, async (req, res) => {
  const data = req.body;
  const supabase = configManager.getSupabaseClient();

  const { error } = await supabase
    .from('response_mappings')
    .insert([{ 
      ...data, 
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString() 
    }]);

  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, message: 'Mapping created' });
});

router.put('/mappings/:id', adminGuard, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const supabase = configManager.getSupabaseClient();

  // Remove system fields if present in update payload
  delete updates.id;
  delete updates.created_at;

  const { data: current } = await supabase.from('response_mappings').select('version').eq('id', id).single();
  const nextVersion = (current?.version || 0) + 1;

  const { error } = await supabase
    .from('response_mappings')
    .update({ 
      ...updates, 
      version: nextVersion,
      updated_at: new Date().toISOString() 
    })
    .eq('id', id);

  if (error) return res.status(500).json({ success: false, error: error.message });
  
  logger.info(`[PROVIDER-MGMT] Updated Response Mapping: ${id} (v${nextVersion})`);
  res.json({ success: true, message: `Mapping ${id} updated to v${nextVersion}` });
});

module.exports = router;
