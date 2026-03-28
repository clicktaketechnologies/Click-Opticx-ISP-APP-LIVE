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

// Root Welcome Message
app.get('/', (req, res) => {
    res.json({
        service: 'Click Optix ISP Backend',
        status: 'Operational',
        timestamp: new Date().toISOString(),
        documentation: 'https://isp-click-opticx.web.app'
    });
});

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

    socket.on('send-email', async (data) => {
        const { config, payload } = data;
        if (!nodemailer) {
            socket.emit('email-error', { message: 'Email service unavailable' });
            return;
        }

        try {
            logger.info(`[SOCKET-EMAIL] Sending via ${config.host}:${config.port} to ${payload.to}`);
            const transporter = nodemailer.createTransport({
                host: config.host,
                port: config.port,
                secure: config.encryption === 'SSL',
                auth: { user: config.username, pass: config.password },
            });

            await transporter.verify();
            const info = await transporter.sendMail({
                from: `"${payload.senderName || 'Click Opticx'}" <${payload.from}>`,
                to: payload.to,
                subject: payload.subject,
                text: payload.text,
                html: payload.html,
            });

            logger.info(`[SOCKET-EMAIL] Sent successfully. MessageId: ${info.messageId}`);
            socket.emit('email-sent', { messageId: info.messageId });
        } catch (error) {
            logger.error(`[SOCKET-EMAIL] Delivery Error: ${error.message}`);
            socket.emit('email-error', { message: error.message });
        }
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
    logger.warn('WARNING: nodemailer not found. Email sending is disabled.');
}

app.post('/api/verify-smtp', async (req, res) => {
    const { config } = req.body;
    if (!nodemailer) return res.status(503).json({ success: false, message: 'Email service unavailable' });

    try {
        const transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.encryption === 'SSL',
            auth: { user: config.username, pass: config.password },
        });
        await transporter.verify();
        logger.info(`[SMTP-VERIFY] Connection Successful: ${config.host}`);
        res.json({ success: true, message: 'Connection Successful' });
    } catch (error) {
        logger.error(`[SMTP-VERIFY] Connection Failed: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/communicate', async (req, res) => {
    const { config, payload } = req.body;

    if (!nodemailer) {
        return res.status(503).json({
            success: false,
            message: 'Email service unavailable. Nodemailer is not installed on this server.'
        });
    }

    try {
        logger.info(`[EMAIL] Sending via ${config.host}:${config.port} to ${payload.to}`);
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
            from: `"${payload.senderName || 'Click Opticx'}" <${payload.from}>`,
            to: payload.to,
            subject: payload.subject,
            text: payload.text,
            html: payload.html,
        });

        logger.info(`[EMAIL] Sent successfully. MessageId: ${info.messageId}`);
        res.json({ success: true, messageId: info.messageId });
    } catch (error) {
        logger.error(`[EMAIL] Delivery Error: ${error.message} (Host: ${config.host})`);
        res.status(500).json({ success: false, message: error.message });
    }
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';

server.listen(PORT, HOST, () => {
    logger.info(`🚀 Backend middleware running on ${HOST}:${PORT}`);
    logger.info(`📡 WebSocket server ready for real-time telemetry`);
    logger.info(`🔒 Environment: ${process.env.NODE_ENV || 'production'}`);
    logger.info(`📧 Email Service: ${nodemailer ? 'Active' : 'Disabled'}`);
});


module.exports = { app, io };
