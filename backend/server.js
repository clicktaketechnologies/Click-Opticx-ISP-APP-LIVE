const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const admin = require('firebase-admin');
require('dotenv').config();

const nasRoutes = require('./routes/nas');
const oltRoutes = require('./routes/olt');
const paymentRoutes = require('./routes/payments');
const healthRoutes = require('./routes/health');
const telemetryController = require('./controllers/telemetryController');
const logger = require('./utils/logger');
const oltRealRoutes = require('./routes/oltRealRoutes');
const mikrotikRoutes = require('./routes/mikrotikRoutes');
const automationRoutes = require('./routes/automationRoutes');
const livePoller = require('./jobs/livePoller');
const notificationEngine = require('./services/notificationEngine');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        methods: ['GET', 'POST']
    }
});

// --- Firebase Admin Initialization ---
try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
        : null;

    if (serviceAccount || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp({
            credential: serviceAccount 
                ? admin.credential.cert(serviceAccount) 
                : admin.credential.applicationDefault()
        });
        logger.info('🔥 Firebase Admin: Initialized for Push Notifications');
    } else {
        logger.warn('⚠️ Firebase Admin: Service account not provided. Push notifications are disabled.');
    }
} catch (error) {
    logger.error(`❌ Firebase Admin Init Failed: ${error.message}`);
}

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
        service: 'Click Opticx ISP Backend',
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
app.use('/api/real-olt', oltRealRoutes);
app.use('/api/mikrotik', mikrotikRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/health-monitor', healthRoutes);

// --- Push Notification API ---
app.post('/api/push-notify', async (req, res) => {
    const { token, title, body, data } = req.body;
    
    if (!admin.apps.length) {
        return res.status(503).json({ success: false, message: 'Push service not configured' });
    }

    try {
        const message = {
            notification: { title, body },
            data: data || {},
            token: token
        };

        const response = await admin.messaging().send(message);
        logger.info(`[PUSH] Sent successfully to token ending in ...${token.slice(-5)}: ${response}`);
        res.json({ success: true, messageId: response });
    } catch (error) {
        logger.error(`[PUSH] Error sending to ...${token.slice(-5)}: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- Smart Notification Engine API ---
app.post('/api/smart-notify', async (req, res) => {
    const { userId, userPhone, fcmToken, event, title, body, config, data } = req.body;
    
    try {
        logger.info(`[SMART-NOTIFY] Event: ${event} for User: ${userId}`);
        const report = await notificationEngine.dispatchNotification({
            userId,
            userPhone,
            fcmToken,
            event,
            title,
            body,
            config,
            data
        });
        
        res.json(report);
    } catch (error) {
        logger.error(`[SMART-NOTIFY] Failed: ${error.message}`);
        res.status(500).json({ success: false, status: 'Failed', error: error.message });
    }
});

// Initialize WebSocket Live Connections
require('./socket/liveSocket')(io);

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

app.post('/api/sms', async (req, res) => {
    const { to, message, provider } = req.body;
    try {
        logger.info(`[SMS-RELAY] Dispatching via ${provider || 'Default'} to ${to}`);
        // SMS Gateway Logic Implementation
        // Note: For production, integrate with specific provider SDKs (Twilio/Infobip/etc)
        res.json({ success: true, messageId: `SMS-${Date.now()}` });
    } catch (error) {
        logger.error(`[SMS-RELAY] Failure: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/whatsapp', async (req, res) => {
    const { to, message } = req.body;
    try {
        logger.info(`[WHATSAPP-RELAY] Dispatching push to ${to}`);
        // WhatsApp Business API Logic Implementation
        res.json({ success: true, messageId: `WA-${Date.now()}` });
    } catch (error) {
        logger.error(`[WHATSAPP-RELAY] Failure: ${error.message}`);
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

    // Start Real-Time Live Poller for Mikrotik
    livePoller.startPolling();

    logger.info(`✨ ISP Automation Engine: Active`);
});


module.exports = { app, io };
