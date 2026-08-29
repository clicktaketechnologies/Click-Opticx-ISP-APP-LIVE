import express from 'express';
import crypto from 'crypto';
import logger from '../utils/logger.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Pre-allocate a 5MB buffer for download tests to avoid CPU overhead during requests
const DOWNLOAD_BUFFER = crypto.randomBytes(5 * 1024 * 1024);

/**
 * @route GET /api/speedtest/ping
 * @desc Measure Round Trip Time (RTT)
 */
router.get('/ping', (req, res) => {
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Response-Time': Date.now()
    });
    res.status(200).send('pong');
});

/**
 * @route GET /api/speedtest/download — auth-gated (bandwidth-abusable)
 * @desc Stream raw binary data for download speed measurement
 */
router.get('/download', protect, (req, res) => {
    // Prevent browser caching at all costs
    res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Length': DOWNLOAD_BUFFER.length,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Content-Disposition': 'attachment; filename=speedtest.bin'
    });

    res.send(DOWNLOAD_BUFFER);
});

/**
 * @route POST /api/speedtest/upload — auth-gated (bandwidth-abusable)
 * @desc Receive chunked data for upload speed measurement
 */
router.post('/upload', protect, (req, res) => {
    let receivedBytes = 0;

    req.on('data', (chunk) => {
        receivedBytes += chunk.length;
        // Optional: Implement early exit if limit exceeded to prevent DOS
    });

    req.on('end', () => {
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.status(200).json({
            success: true,
            received: receivedBytes,
            timestamp: Date.now()
        });
    });

    req.on('error', (err) => {
        logger.error(`[SPEEDTEST-UPLOAD] Stream error: ${err.message}`);
        res.status(500).send('Upload stream interrupted');
    });
});

export default router;
