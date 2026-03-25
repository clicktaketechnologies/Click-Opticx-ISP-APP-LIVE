const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const nasRoutes = require('./routes/nas');
const oltRoutes = require('./routes/olt');
const paymentRoutes = require('./routes/payments');
const healthRoutes = require('./routes/health');
const telemetryController = require('./controllers/telemetryController');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*'
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Routes
app.use('/api', nasRoutes);
app.use('/api', oltRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/health-monitor', healthRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    socket.on('subscribe-bandwidth', (data) => {
        logger.info(`Bandwidth subscription for user: ${data.userId}`);
        telemetryController.streamBandwidth(socket, data.userId);
    });

    socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});


// --- Communication Gateway (Nodemailer Integration) ---
let nodemailer;
try {
    nodemailer = require('nodemailer');
} catch (e) {
    logger.warn('CRITICAL WARNING: nodemailer not found. Real-time email dispatch is in SLEEP MODE.');
}

app.post('/api/verify-smtp', async (req, res) => {
    const { config } = req.body;
    if (!nodemailer) return res.status(503).json({ success: false, message: 'Nodemailer Sleep Mode' });

    try {
        const transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.encryption === 'SSL',
            auth: { user: config.username, pass: config.password },
        });
        await transporter.verify();
        logger.info(`[INFRA-VERIFY] SMTP Handshake Successful: ${config.host}`);
        res.json({ success: true, message: 'Handshake Successful' });
    } catch (error) {
        logger.error(`[INFRA-VERIFY] Handshake Failed: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/communicate', async (req, res) => {
    const { config, payload } = req.body;

    if (!nodemailer) {
        return res.status(503).json({
            success: false,
            message: 'TRANSMISSION_FAILURE: Node does not have nodemailer installed. Handshake aborted.'
        });
    }

    try {
        logger.info(`[INFRA-DISPATCH] Attempting relay via ${config.host}:${config.port} for ${payload.to}`);
        const transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.encryption === 'SSL',
            auth: {
                user: config.username,
                pass: config.password,
            },
        });

        // Verify before send to catch early auth/network errors
        await transporter.verify();

        const info = await transporter.sendMail({
            from: `"${payload.senderName || 'NetRecover Relay'}" <${payload.from}>`,
            to: payload.to,
            subject: payload.subject,
            text: payload.text,
            html: payload.html,
        });

        logger.info(`[INFRA-DISPATCH] Success. MessageId: ${info.messageId}`);
        res.json({ success: true, messageId: info.messageId });
    } catch (error) {
        logger.error(`[INFRA-DISPATCH] Delivery Error: ${error.message} (Host: ${config.host})`);
        res.status(500).json({ success: false, message: error.message });
    }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    logger.info(`🚀 Backend middleware running on port ${PORT}`);
    logger.info(`📡 WebSocket server ready for real-time telemetry`);
    logger.info(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`📧 Communication Gateway: ${nodemailer ? 'OPTIMAL' : 'SLEEP MODE'}`);
});


module.exports = { app, io };
