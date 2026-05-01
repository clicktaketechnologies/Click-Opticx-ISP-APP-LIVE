const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const logger = require('../utils/logger');
const paymentRouter = require('../modules/payments/payment-router');
const emailRouter = require('../modules/email/email-router');
const configManager = require('../services/config-manager');
const admin = require('firebase-admin');

// 1. Aggregated System Health
router.get('/', async (req, res) => {
    try {
        const start = Date.now();
        
        // Parallel health checks
        const [ai, db, email, payments] = await Promise.all([
            checkAIHealth(),
            checkDBHealth(),
            checkEmailHealth(),
            checkPaymentHealth()
        ]);

        const latency = Date.now() - start;

        res.json({
            success: true,
            status: 'online',
            timestamp: new Date().toISOString(),
            latency_ms: latency,
            version: process.env.npm_package_version || '8.6.0',
            components: { ai, db, email, payments }
        });
    } catch (error) {
        logger.error(`[HEALTH] Aggregate check failed: ${error.message}`);
        res.status(500).json({ success: false, message: 'Internal Health Failure' });
    }
});

// 2. Component: AI Core
router.get('/ai', async (req, res) => {
    const health = await checkAIHealth();
    res.json(health);
});

async function checkAIHealth() {
    // Simple check for API keys presence and mock ping
    const keys = await configManager.get('technicalKeys') || {};
    const hasGemini = !!keys.geminiApiKey;
    return {
        status: hasGemini ? 'healthy' : 'degraded',
        latency_ms: Math.floor(Math.random() * 200) + 50, // Mock latency
        model: 'Gemini-1.5-Pro',
        last_verified: new Date().toISOString()
    };
}

// 3. Component: Cloud DB
router.get('/db', async (req, res) => {
    const health = await checkDBHealth();
    res.json(health);
});

async function checkDBHealth() {
    try {
        const start = Date.now();
        // Check Firebase connection
        let firebaseStatus = 'disconnected';
        if (admin.apps.length > 0) {
            // Check if firestore is initialized
            try {
                await admin.firestore().collection('system').doc('health').get();
                firebaseStatus = 'connected';
            } catch (err) {
                firebaseStatus = 'error: ' + err.message;
            }
        }
        
        // Check Supabase
        const supabase = configManager.getSupabaseClient();
        const hasSupabase = !!supabase;

        return {
            status: (firebaseStatus === 'connected' && hasSupabase) ? 'healthy' : 'degraded',
            firebase: firebaseStatus,
            supabase: hasSupabase ? 'connected' : 'disconnected',
            latency_ms: Date.now() - start,
            last_verified: new Date().toISOString()
        };
    } catch (e) {
        return { status: 'unhealthy', error: e.message };
    }
}

// 4. Component: Email Gateway
router.get('/email', async (req, res) => {
    const health = await checkEmailHealth();
    res.json(health);
});

async function checkEmailHealth() {
    const healthy = emailRouter.getHealthyProviders ? emailRouter.getHealthyProviders() : [];
    const total = emailRouter.providers ? emailRouter.providers.length : 0;
    return {
        status: healthy.length > 0 ? 'healthy' : 'unhealthy',
        active_adapters: emailRouter.adapters ? Object.keys(emailRouter.adapters).length : 0,
        providers_online: `${healthy.length}/${total}`,
        last_verified: new Date().toISOString()
    };
}

// 5. Component: Fiscal Node (Payments)
router.get('/payments', async (req, res) => {
    const health = await checkPaymentHealth();
    res.json(health);
});

async function checkPaymentHealth() {
    const available = paymentRouter.getAvailableGateways ? paymentRouter.getAvailableGateways() : [];
    return {
        status: available.length > 0 ? 'healthy' : 'unhealthy',
        active_gateways: available.length,
        primary_gateway: available[0]?.name || 'None',
        last_verified: new Date().toISOString()
    };
}

// 6. Component: Deployment / CI/CD
router.get('/deploy', async (req, res) => {
    res.json({
        status: 'idle',
        last_build: new Date().toISOString(),
        version: 'v8.6.0 Stable',
        branch: 'main',
        environment: process.env.NODE_ENV || 'production'
    });
});

// GET /api/health-monitor/logs
router.get('/logs', async (req, res) => {
    const logPath = path.join(__dirname, '../logs/combined.log');
    
    if (!fs.existsSync(logPath)) {
        return res.json({ success: true, logs: [] });
    }

    try {
        const fileStream = fs.createReadStream(logPath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        const logs = [];
        for await (const line of rl) {
            if (line.trim()) {
                try {
                    const parsed = JSON.parse(line);
                    logs.push({
                        timestamp: parsed.timestamp,
                        level: parsed.level,
                        message: parsed.message,
                        service: parsed.service
                    });
                } catch (e) {
                    // Fallback for non-JSON lines
                    logs.push({
                        timestamp: new Date().toISOString(),
                        level: 'info',
                        message: line,
                        service: 'system'
                    });
                }
            }
        }
        
        // Return only the last 100 logs
        res.json({ success: true, logs: logs.slice(-100) });
    } catch (error) {
        logger.error(`[HEALTH-MONITOR] Failed to read logs: ${error.message}`);
        res.status(500).json({ success: false, message: 'Failed to read logs' });
    }
});

module.exports = router;
