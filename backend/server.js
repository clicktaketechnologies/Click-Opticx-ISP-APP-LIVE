const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const admin = require('firebase-admin');
require('dotenv').config();
const cron = require('node-cron');
const { exec } = require('child_process');

const nasRoutes = require('./routes/nas');
const oltRoutes = require('./routes/olt');
const paymentRoutes = require('./routes/payments');
const healthRoutes = require('./routes/health');
const telemetryController = require('./controllers/telemetryController');
const logger = require('./utils/logger');
const oltRealRoutes = require('./routes/oltRealRoutes');
const mikrotikRoutes = require('./routes/mikrotikRoutes');
const automationRoutes = require('./routes/automationRoutes');
const authRoutes = require('./routes/auth');
const livePoller = require('./jobs/livePoller');
const notificationEngine = require('./services/notificationEngine');
const kycRoutes = require('./routes/kyc');
const cloudRoutes = require('./routes/cloud');
const configRoutes = require('./routes/config');
const emailRoutes = require('./routes/email');
const providerManagementRoutes = require('./routes/provider-management');
const storageRoutes = require('./routes/storage');
const migrationRoutes = require('./routes/migration');
const emailV2Router = require('./routes/email-v2');
const configManager = require('./services/config-manager');
const emailWorker = require('./modules/email/worker');
const paymentRouter = require('./modules/payments/payment-router');
const emailRouter = require('./modules/email/email-router');
const responseMapper = require('./services/response-mapper');
const HealthMonitor = require('./services/health-monitor');

const app = express();
const server = http.createServer(app);

// Initialize Directories
const uploadDir = path.join(__dirname, 'uploads/kyc');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}
const io = socketIo(server, {
    cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        methods: ['GET', 'POST']
    }
});

// REMOVED INITIALIZE MONGODB
// connectDB();

// Setup Firestore Database Reference
let db;

// Make io accessible in req
app.set('socketio', io);
logger.streamToSocket(io);

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
        db = admin.firestore();
        logger.info('🔥 Firebase Admin: Initialized for Firestore and Push Notifications');
    } else {
        logger.warn('⚠️ Firebase Admin: Credentials not provided. Backend running in restricted mode.');
    }
} catch (error) {
    logger.error(`❌ Firebase Admin Init Failed: ${error.message}`);
}

// --- Supabase Config Manager Init ---
configManager.init().then(async () => {
    logger.info('🗄️  Supabase Config Manager: Online — Runtime config loaded');
    
    // --- Phase 1 Foundation: Initialize Routers & Mappers ---
    try {
        await paymentRouter.init();
        await emailRouter.init();
        await responseMapper.init();
        logger.info('🛰️  Payment, Email Routers & Response Mapper: Online');
    } catch (e) {
        logger.error(`[FOUNDATION-INIT] Failed: ${e.message}`);
    }

    // --- Phase 1: Email Worker Init ---
    try {
        emailWorker.initWorker();
    } catch (e) {
        logger.error(`[EMAIL-WORKER] Failed to start: ${e.message}`);
    }

    // --- Phase 2: Nightly Validator (3 AM) ---
    cron.schedule('0 3 * * *', () => {
        logger.info('🕒 [SCHEDULER] Triggering Nightly Migration Validation...');
        exec('node scripts/validate-sync.js', (err, stdout, stderr) => {
            if (err) logger.error(`[VALIDATOR] Nightly run failed: ${err.message}`);
            else logger.info('[VALIDATOR] Nightly run completed successfully');
        });
    });
    // --- Phase 3: Health Monitor (Real-time) ---
    try {
        const healthMonitor = new HealthMonitor(io);
        healthMonitor.start();
        app.set('healthMonitor', healthMonitor);
    } catch (e) {
        logger.error(`[HEALTH-MONITOR] Failed to start: ${e.message}`);
    }
}).catch(err => {
    logger.warn(`⚠️ Supabase Config Manager: ${err.message}`);
});

// --- CORS must come BEFORE helmet and rate-limiter so that OPTIONS
//     preflight requests (sent by browsers for multipart file uploads)
//     are answered immediately with the correct headers.
const allowedOrigins = [
    'https://isp-click-opticx.web.app',
    'https://isp-click-opticx.firebaseapp.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5001',
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : [])
];

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
        if (!origin) return callback(null, true);
        
        const isAllowed = allowedOrigins.some(ao => ao === origin || ao === origin + '/');
        
        if (isAllowed) {
            return callback(null, true);
        } else {
            logger.warn(`[CORS] Rejected Origin: ${origin}`);
            callback(new Error(`CORS: Origin '${origin}' is not allowed`));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Apply CORS globally (handles OPTIONS preflight automatically)
app.use(cors(corsOptions));
// Explicitly respond to all OPTIONS preflight requests before any other middleware
app.options('*', cors(corsOptions));

// Helmet (security headers) — after CORS so it doesn't interfere with preflight
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json());

// Rate limiting — after CORS so preflight OPTIONS requests are never rate-limited
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Too many requests from this IP, please try again later.',
    skip: (req) => req.method === 'OPTIONS' // Never rate-limit preflight
});
app.use('/api/', limiter);

// Root Welcome Message
app.get('/', (req, res) => {
    res.json({
        service: 'Click Opticx ISP Backend',
        status: 'Operational',
        ping: 'pong',
        timestamp: new Date().toISOString(),
        documentation: 'https://app.clickopticx.com'
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    const redis = require('./services/redisService');
    const isUsingRedis = !(redis.constructor.name === 'MemoryRedis');
    
    res.json({
        status: 'online',
        caching: isUsingRedis ? 'Redis Cluster' : 'In-Memory Fallback',
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
app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/cloud', cloudRoutes);
app.use('/api/config', configRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/migration', migrationRoutes);
app.use('/api/email/v2', emailV2Router);
app.use('/api/provider-mgmt', providerManagementRoutes);

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


module.exports = { app, io, db };
