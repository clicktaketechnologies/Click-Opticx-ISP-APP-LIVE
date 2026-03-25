const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const logger = require('../utils/logger');

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
