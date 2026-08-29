/**
 * Migration Dashboard + Phase 3 Cutover API
 */

import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import configManager from '../services/config-manager.js';
import logger from '../utils/logger.js';
import { protect, restrictTo } from '../middleware/auth.js';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// ─── Stats ────────────────────────────────────────────────────────────────────
router.get('/stats', protect, restrictTo('SuperAdmin', 'Admin'), async (req, res) => {
  const supabase = configManager.getSupabaseClient();
  if (!supabase) return res.status(503).json({ success: false, message: 'Supabase offline' });

  try {
    const { data: latestStats } = await supabase
      .from('migration_stats')
      .select('*')
      .order('last_validated', { ascending: false })
      .limit(10);

    const { data: emailStats } = await supabase
      .from('email_logs')
      .select('provider_used, status')
      .limit(1000);

    const providerSuccess = {};
    if (emailStats) {
      emailStats.forEach(log => {
        if (!providerSuccess[log.provider_used]) providerSuccess[log.provider_used] = { success: 0, total: 0 };
        providerSuccess[log.provider_used].total++;
        if (log.status === 'Delivered') providerSuccess[log.provider_used].success++;
      });
    }

    const tables = ['users', 'staff', 'packages', 'invoices', 'payments', 'signup_requests', 'kyc_requests', 'support_tickets'];
    const tableCounts = {};
    for (const table of tables) {
      try {
        const { count } = await supabase.from(table).select('id', { count: 'exact', head: true });
        tableCounts[table] = count || 0;
      } catch (e) {
        tableCounts[table] = 'error';
      }
    }

    const migrationConfig = configManager.getConfig('migration_control', {});

    res.json({
      success: true,
      latestStats,
      providerHealth: providerSuccess,
      tableCounts,
      migrationConfig,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Pre-Flight Checklist ─────────────────────────────────────────────────────
router.get('/preflight', protect, restrictTo('SuperAdmin', 'Admin'), async (req, res) => {
  const supabase = configManager.getSupabaseClient();
  if (!supabase) return res.status(503).json({ success: false, message: 'Supabase offline' });

  try {
    const checks = [];

    // 1. Check Supabase connectivity
    try {
      const { error } = await supabase.from('system_configs').select('key').limit(1);
      checks.push({ name: 'Supabase Connection', status: error ? 'fail' : 'pass', detail: error?.message || 'Connected' });
    } catch (e) {
      checks.push({ name: 'Supabase Connection', status: 'fail', detail: e.message });
    }

    // 2. Check recent validation stats
    const { data: recentStats } = await supabase
      .from('migration_stats')
      .select('*')
      .order('last_validated', { ascending: false })
      .limit(30);

    if (recentStats && recentStats.length > 0) {
      const totalRecords = recentStats.reduce((sum, s) => sum + (s.total_count || 0), 0);
      const syncedRecords = recentStats.reduce((sum, s) => sum + (s.synced_count || 0), 0);
      const syncHealth = totalRecords > 0 ? (syncedRecords / totalRecords) * 100 : 0;

      checks.push({
        name: 'Sync Health ≥ 99.8%',
        status: syncHealth >= 99.8 ? 'pass' : 'warn',
        detail: `${syncHealth.toFixed(2)}% across ${recentStats.length} validations`
      });

      const uniqueDays = new Set(recentStats.map(s => new Date(s.last_validated).toDateString()));
      checks.push({
        name: '7 Consecutive Days Validated',
        status: uniqueDays.size >= 7 ? 'pass' : 'warn',
        detail: `${uniqueDays.size} days of validation data available`
      });
    } else {
      checks.push({ name: 'Sync Health ≥ 99.8%', status: 'fail', detail: 'No validation data found' });
      checks.push({ name: '7 Consecutive Days Validated', status: 'fail', detail: 'No data' });
    }

    // 3. Check Firebase backup exists
    const backupDir = path.join(__dirname, '..', 'backups');
    let backupExists = false;
    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir).filter(f => f.startsWith('firebase-backup'));
      backupExists = files.length > 0;
      checks.push({
        name: 'Firebase Cold Backup',
        status: backupExists ? 'pass' : 'warn',
        detail: backupExists ? `${files.length} backup(s) found. Latest: ${files[files.length - 1]}` : 'No backup found'
      });
    } else {
      checks.push({ name: 'Firebase Cold Backup', status: 'warn', detail: 'No backups directory found' });
    }

    const { count: userCount } = await supabase.from('users').select('id', { count: 'exact', head: true });
    checks.push({
      name: 'Supabase Has User Data',
      status: (userCount || 0) > 0 ? 'pass' : 'fail',
      detail: `${userCount || 0} users in Supabase`
    });

    const emailConfig = configManager.getConfig('email_providers', null);
    checks.push({
      name: 'Email Providers Configured',
      status: emailConfig ? 'pass' : 'warn',
      detail: emailConfig ? `${(emailConfig.providers || []).length} providers configured` : 'No email provider config found'
    });

    const storageConfig = configManager.getConfig('storage_providers', null);
    checks.push({
      name: 'Storage Providers Configured',
      status: storageConfig ? 'pass' : 'warn',
      detail: storageConfig ? `${(storageConfig.providers || []).length} providers configured` : 'No storage provider config found'
    });

    const passCount = checks.filter(c => c.status === 'pass').length;
    const failCount = checks.filter(c => c.status === 'fail').length;
    const overallReady = failCount === 0 && passCount >= 4;

    res.json({
      success: true,
      checks,
      overallReady,
      summary: { pass: passCount, warn: checks.filter(c => c.status === 'warn').length, fail: failCount },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Trigger Manual Validation ────────────────────────────────────────────────
router.post('/validate', protect, restrictTo('SuperAdmin', 'Admin'), async (req, res) => {
  const scriptPath = path.join(__dirname, '..', 'scripts', 'validate-sync.js');
  exec(`node "${scriptPath}"`, { cwd: path.join(__dirname, '..'), timeout: 300000 }, (err) => {
    if (err) logger.error(`[MIGRATION] Validation trigger failed: ${err.message}`);
    else logger.info('[MIGRATION] Manual validation completed');
  });
  res.json({ success: true, message: 'Validation triggered in background' });
});

// ─── Trigger Firebase Cold Backup ─────────────────────────────────────────────
router.post('/backup', protect, restrictTo('SuperAdmin', 'Admin'), async (req, res) => {
  const scriptPath = path.join(__dirname, '..', 'scripts', 'export-firebase-backup.js');
  logger.info('[MIGRATION] Starting Firebase cold backup...');
  exec(`node "${scriptPath}"`, { cwd: path.join(__dirname, '..'), timeout: 300000 }, (err) => {
    if (err) logger.error(`[MIGRATION] Backup failed: ${err.message}`);
    else logger.info('[MIGRATION] Firebase backup completed successfully');
  });
  res.json({ success: true, message: 'Firebase backup triggered in background' });
});

// ─── List Available Backups ───────────────────────────────────────────────────
router.get('/backups', protect, restrictTo('SuperAdmin', 'Admin'), (req, res) => {
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) return res.json({ success: true, backups: [] });

  const files = fs.readdirSync(backupDir)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const stats = fs.statSync(path.join(backupDir, f));
      return {
        name: f,
        size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        created: stats.mtime.toISOString()
      };
    })
    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

  res.json({ success: true, backups: files });
});

// ─── Execute Cutover ──────────────────────────────────────────────────────────
router.post('/cutover', protect, restrictTo('SuperAdmin'), async (req, res) => {
  const supabase = configManager.getSupabaseClient();
  if (!supabase) return res.status(503).json({ success: false, message: 'Supabase offline' });

  const { confirm } = req.body;
  if (confirm !== 'CUTOVER_CONFIRMED') {
    return res.status(400).json({ success: false, message: 'Must send { confirm: "CUTOVER_CONFIRMED" } to execute cutover' });
  }

  try {
    logger.info('🔥 [CUTOVER] Phase 3 Cutover Sequence Initiated');
    const cutoverConfig = {
      migration_mode: 'supabase_primary',
      dual_write_enabled: false,
      firebase_writes_enabled: false,
      supabase_reads_enabled: true,
      cutover_at: new Date().toISOString(),
      cutover_initiated_by: req.user.id,
    };

    await configManager.setConfig('migration_control', cutoverConfig, 'cutover-sequence');
    
    await supabase.from('audit_logs').insert({
      id: crypto.randomUUID(),
      action: 'Phase 3 Cutover Executed',
      user_id: req.user.id,
      user_name: 'Cutover Sequence',
      details: JSON.stringify(cutoverConfig),
      type: 'migration',
      created_at: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Cutover executed successfully. Supabase is now the primary data source.',
      config: cutoverConfig
    });
  } catch (error) {
    logger.error(`[CUTOVER] FAILED: ${error.message}`);
    res.status(500).json({ success: false, message: `Cutover failed: ${error.message}` });
  }
});

// ─── Emergency Rollback ───────────────────────────────────────────────────────
router.post('/rollback', protect, restrictTo('SuperAdmin'), async (req, res) => {
  const supabase = configManager.getSupabaseClient();
  if (!supabase) return res.status(503).json({ success: false, message: 'Supabase offline' });

  try {
    logger.warn('⚠️ [ROLLBACK] Emergency Rollback to Firebase initiated');
    const rollbackConfig = {
      migration_mode: 'dual_write',
      dual_write_enabled: true,
      firebase_writes_enabled: true,
      supabase_reads_enabled: false,
      rolled_back_at: new Date().toISOString(),
      rollback_initiated_by: req.user.id,
    };

    await configManager.setConfig('migration_control', rollbackConfig, 'rollback-sequence');

    await supabase.from('audit_logs').insert({
      id: crypto.randomUUID(),
      action: 'Emergency Rollback to Firebase',
      user_id: req.user.id,
      user_name: 'Rollback Sequence',
      details: JSON.stringify(rollbackConfig),
      type: 'migration',
      created_at: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Rolled back to Firebase primary with dual-write enabled.',
      config: rollbackConfig
    });
  } catch (error) {
    logger.error(`[ROLLBACK] FAILED: ${error.message}`);
    res.status(500).json({ success: false, message: `Rollback failed: ${error.message}` });
  }
});

// ─── Get/Set Migration Mode ───────────────────────────────────────────────────
router.get('/mode', protect, restrictTo('SuperAdmin', 'Admin'), (req, res) => {
  const config = configManager.getConfig('migration_control', {});
  res.json({ success: true, mode: config.migration_mode || 'firebase_only', config });
});

router.put('/mode', protect, restrictTo('SuperAdmin'), async (req, res) => {
  const { mode, firebaseWrites, supabaseReads } = req.body;
  const validModes = ['firebase_only', 'dual_write', 'supabase_primary'];

  if (!validModes.includes(mode)) {
    return res.status(400).json({ success: false, message: `Invalid mode.` });
  }

  try {
    const newConfig = {
      migration_mode: mode,
      dual_write_enabled: mode !== 'firebase_only',
      firebase_writes_enabled: firebaseWrites !== undefined ? firebaseWrites : (mode !== 'supabase_primary'),
      supabase_reads_enabled: supabaseReads !== undefined ? supabaseReads : (mode === 'supabase_primary'),
      updated_at: new Date().toISOString(),
    };
    await configManager.setConfig('migration_control', newConfig, req.user.id);
    res.json({ success: true, config: newConfig });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
