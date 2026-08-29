const express = require('express');
const router = express.Router();
const emailRouter = require('../modules/email/email-router');
const configManager = require('../services/config-manager');
const logger = require('../utils/logger');

// 1. Dashboard Stats
router.get('/stats', async (req, res) => {
    try {
        const supabase = configManager.getSupabaseClient();
        if (!supabase) throw new Error('Supabase not initialized');

        const { data: logs, error: logError } = await supabase
            .from('email_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        const { data: providers, error: pError } = await supabase
            .from('email_providers')
            .select('*');

        const stats = {
            total_sent: logs?.length || 0,
            success_rate: logs?.filter(l => l.status === 'Sent').length / (logs?.length || 1) * 100,
            active_nodes: providers?.filter(p => p.enabled).length || 0,
            recent_logs: logs || []
        };

        res.json({ success: true, stats });
    } catch (e) {
        logger.error(`[EMAIL-V2] Stats failed: ${e.message}`);
        res.status(500).json({ success: false, message: e.message });
    }
});

// 2. Provider Management
router.get('/providers', async (req, res) => {
    try {
        const supabase = configManager.getSupabaseClient();
        const { data, error } = await supabase.from('email_providers').select('*').order('priority');
        res.json({ success: true, providers: data });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.post('/providers', async (req, res) => {
    try {
        const supabase = configManager.getSupabaseClient();
        const { data, error } = await supabase.from('email_providers').insert(req.body).select();
        res.json({ success: true, provider: data[0] });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.patch('/providers/:id', async (req, res) => {
    try {
        const supabase = configManager.getSupabaseClient();
        const { data, error } = await supabase.from('email_providers').update(req.body).eq('id', req.params.id).select();
        res.json({ success: true, provider: data[0] });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// 3. Manual Dispatch
router.post('/dispatch', async (req, res) => {
    const { to, subject, html, templateId } = req.body;
    try {
        const result = await emailRouter.sendEmail({ to, subject, html, templateId });
        res.json(result);
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// 4. Template Management
router.get('/templates', async (req, res) => {
    try {
        const supabase = configManager.getSupabaseClient();
        const { data, error } = await supabase.from('email_templates').select('*');
        res.json({ success: true, templates: data });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

module.exports = router;
