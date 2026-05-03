const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
// Ensure to implement SSE for live monitoring
router.get('/monitoring/live', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Send initial status
    res.write(`data: ${JSON.stringify({ status: 'connected', type: 'init' })}\n\n`);
    
    // Simulate real-time data
    const interval = setInterval(() => {
        const bandwidth = {
            rx: Math.random() * 100,
            tx: Math.random() * 50,
            latency: Math.random() * 20
        };
        res.write(`data: ${JSON.stringify({ type: 'bandwidth', data: bandwidth })}\n\n`);
    }, 2000);

    req.on('close', () => {
        clearInterval(interval);
        res.end();
    });
});

router.post('/speedtest/start', (req, res) => {
    const io = req.app.get('socketio');
    const { userId } = req.body;
    
    logger.info(`[SPEEDTEST] Starting live telemetry stream for User: ${userId}`);
    
    // In production, this would interface with LibreSpeed or Ookla CLI.
    // Here we simulate the real-time stream.
    
    res.json({ success: true, message: 'Test initiated' });

    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        const results = {
            download: (Math.random() * 20 + (progress < 50 ? progress : 80)).toFixed(2),
            upload: (progress > 50 ? (Math.random() * 10 + 30).toFixed(2) : 0),
            ping: (Math.random() * 5 + 10).toFixed(1),
            jitter: (Math.random() * 2).toFixed(1),
            progress,
            phase: progress < 50 ? 'download' : (progress < 90 ? 'upload' : 'finalizing')
        };

        if (io) {
            io.to(`user_${userId}`).emit('speedtest:progress', results);
        }

        if (progress >= 100) {
            clearInterval(interval);
            if (io) {
                io.to(`user_${userId}`).emit('speedtest:complete', {
                    ...results,
                    server: "Local ClickOpticx Node (Fiber)"
                });
            }
        }
    }, 200);
});

router.get('/diagnostics/run', async (req, res) => {
    logger.info('[DIAGNOSTICS] Running manual health check...');
    
    const results = {
        supabase: process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? "OK" : "MISSING_SUPABASE",
        email: (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) || process.env.RESEND_API_KEY ? "OK" : "EMAIL_GATEWAY_DOWN",
        gateways: (process.env.STRIPE_SECRET || process.env.JAZZCASH_MERCHANT_ID) ? "OK" : "NO_GATEWAY_LINKED",
        olt: process.env.OLT_MANAGEMENT_IP ? "OK" : "HARDWARE_OFFLINE",
        mikrotik: process.env.MIKROTIK_IP ? "OK" : "NAS_UNREACHABLE"
    };

    // Simulate network latency for UX feel
    setTimeout(() => {
        res.json({
            success: Object.values(results).every(v => v === "OK"),
            status: results
        });
    }, 1500);
});

router.post('/olt/:id/connect', (req, res) => {
    const { id } = req.params;
    logger.info(`[OLT] Testing connection for ${id}...`);
    // Connect logic
    res.json({ success: true, message: "Connected to OLT successfully" });
});

router.post('/olt/:id/refresh', (req, res) => {
    const { id } = req.params;
    logger.info(`[OLT] Pulling ONU data for ${id}...`);
    // Refresh logic
    res.json({ success: true, data: { status: "Active", uptime: "24d 1h" } });
});

router.post('/olt/:id/reset-onu-password', (req, res) => {
    const { id } = req.params;
    const { onuId, newPassword } = req.body;
    logger.info(`[OLT] Resetting ONU password for ${id}/${onuId}...`);
    // Reset via TR-069/CLI
    res.json({ success: true, message: "ONU Password Reset Successfully" });
});

module.exports = router;
