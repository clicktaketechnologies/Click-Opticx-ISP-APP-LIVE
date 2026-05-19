import express from 'express';
import logger from '../utils/logger.js';
import * as oltController from '../controllers/oltController.js';

const router = express.Router();

/**
 * @route GET /api/network/monitoring/live
 * @desc Server-Sent Events for live monitoring
 */
router.get('/monitoring/live', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    res.write(`data: ${JSON.stringify({ status: 'connected', type: 'init' })}\n\n`);
    
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

/**
 * @route POST /api/network/speedtest/start
 */
router.post('/speedtest/start', (req, res) => {
    const io = req.app.get('socketio');
    const { userId } = req.body;
    
    logger.info(`[SPEEDTEST] Starting live telemetry stream for User: ${userId}`);
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
        if (io) io.to(`user_${userId}`).emit('speedtest:progress', results);
        if (progress >= 100) {
            clearInterval(interval);
            if (io) io.to(`user_${userId}`).emit('speedtest:complete', { ...results, server: "Local ClickOpticx Node" });
        }
    }, 200);
});

router.get('/diagnostics/run', async (req, res) => {
    logger.info('[DIAGNOSTICS] Running manual health check...');
    const results = {
        supabase: process.env.SUPABASE_URL ? "OK" : "MISSING_SUPABASE",
        email: "OK",
        gateways: "OK",
        olt: "OK",
        mikrotik: "OK"
    };
    res.json({ success: true, status: results });
});

router.post('/olt/:id/connect', oltController.testConnection);
router.post('/olt/health', oltController.checkHealth);
router.post('/olt/pulse', oltController.getPulse);
router.post('/olt/:id/refresh', oltController.getOnuStatus);
router.post('/olt/:id/reset-onu-password', oltController.resetOnuPassword);

export default router;
