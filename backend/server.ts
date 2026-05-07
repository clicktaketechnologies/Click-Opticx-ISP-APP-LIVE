import 'dotenv/config';
console.log('🏁 [BOOT] Server script execution started');
import express from 'express';
import http from 'http';
import { Server as SocketIoServer } from 'socket.io';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cron from 'node-cron';
import { exec } from 'child_process';
import nodemailer from 'nodemailer';

// Import Utils & Services
import logger from './utils/logger.js';
import configManager from './services/config-manager.js';
import notificationEngine from './services/notificationEngine.js';
import livePoller from './jobs/livePoller.js';

// Import Routes
import authRoutes from './routes/auth.js';
import billingRoutes from './routes/billing.js';
import usersRoutes from './routes/users.js';
import kycRoutes from './routes/kyc.js';
import networkRoutes from './routes/network.js';
import financeRoutes from './routes/finance.js';
import healthRoutes from './routes/health.js';
import configRoutes from './routes/config.js';
import storageRoutes from './routes/storage.js';
import migrationRoutes from './routes/migration.js';

// ESM dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);

// Initialize Directories
const uploadDir = path.join(__dirname, 'uploads/kyc');
const tempDir = path.join(__dirname, 'uploads/temp');
[uploadDir, tempDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const io = new SocketIoServer(server, {
    cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        methods: ['GET', 'POST']
    }
});

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
        logger.info('🔥 Firebase Admin: Initialized');
    }
} catch (error: any) {
    logger.error(`❌ Firebase Admin Init Failed: ${error.message}`);
}

// --- Supabase Config Manager Init ---
configManager.init().then(async () => {
    logger.info('🗄️  Supabase Config Manager: Online');
    livePoller.startPolling();
}).catch((err: any) => {
    logger.warn(`⚠️ Supabase Config Manager: ${err.message}`);
});

// --- Middleware ---
app.use(cors({ origin: '*', credentials: true })); // Temporary for recovery
app.use(express.json());

// --- IMMEDIATE AUTH PATH (Before Limiter) ---
app.post('/api/auth/login', authRoutes);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    skip: (req) => req.method === 'OPTIONS'
});
app.use('/api/', limiter);

// --- API Versioning (v1) ---
const apiV1 = express.Router();
apiV1.use('/auth', authRoutes);
apiV1.use('/billing', billingRoutes);
apiV1.use('/users', usersRoutes);
apiV1.use('/kyc', kycRoutes);
apiV1.use('/network', networkRoutes);
apiV1.use('/finance', financeRoutes);
apiV1.use('/health', healthRoutes);
apiV1.use('/config', configRoutes);
apiV1.use('/storage', storageRoutes);
apiV1.use('/migration', migrationRoutes);

app.use('/api/v1', apiV1);
app.use('/api', apiV1);

app.get('/', (req, res) => res.json({ status: 'Operational', recovery: true }));

const PORT = Number(process.env.PORT) || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 RECOVERY MODE: Backend running on port ${PORT}`);
});

export { app, io };
