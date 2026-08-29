// Realtime socket rooms (ESM — the root package.json declares "type": "module",
// so the previous CommonJS `module.exports` version could never load).
import LiveUsageService from '../services/liveUsageService.js';
import livePoller from '../jobs/livePoller.js';
import logger from '../utils/logger.js';
import OLTHealthAutomator from '../jobs/oltHealthAutomator.js';
import OLTTelemetryPoller from '../services/oltTelemetryPoller.js';
import jwt from 'jsonwebtoken';

// SECURITY: room membership is decided by a verified JWT — the previous
// implementation trusted a client-supplied `role: 'admin'`, letting anyone
// join the admin dashboard room.
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'secret') {
    if (process.env.NODE_ENV === 'production') return null; // refuse admin joins
    return 'insecure-dev-secret-do-not-use-in-production';
  }
  return secret;
};

export default function attachLiveSocket(io) {
  // We initialize the OLT automator but don't start it until requested
  const oltAutomator = new OLTHealthAutomator(io);
  // Initialize the OLT telemetry poller
  const oltTelemetryPoller = new OLTTelemetryPoller(io);

  io.on('connection', (socket) => {

    // --- AUTHENTICATION & ROOM JOINING ---
    socket.on('authenticate', (data) => {
      const { role, onuId, token } = data || {};

      if (role === 'admin') {
        const secret = getJwtSecret();
        if (!secret) {
          logger.warn(`[SOCKET-AUTH] Rejected admin join (no JWT secret configured) for ${socket.id}`);
          socket.emit('auth-error', { message: 'Admin socket access requires server JWT configuration.' });
          return;
        }
        try {
          const decoded = jwt.verify(token, secret);
          const isAdminRole = ['SuperAdmin', 'Admin', 'NetworkAdmin', 'SupportAdmin'].includes(decoded?.role);
          if (!isAdminRole) {
            socket.emit('auth-error', { message: 'Admin socket access denied.' });
            return;
          }
          socket.data.user = decoded;
          socket.join('admin_dashboard');
          socket.join('health-monitor'); // Join real-time health stream
          logger.info(`Socket ${socket.id} (${decoded.role}) joined Admin Dashboard & Health Monitor`);
        } catch (err) {
          logger.warn(`[SOCKET-AUTH] Invalid socket token for ${socket.id}: ${err.message}`);
          socket.emit('auth-error', { message: 'Invalid or missing socket token.' });
          return;
        }
      } else if (role === 'user' && onuId) {
        socket.join(onuId);
        logger.info(`Socket ${socket.id} joined User ONU Room: ${onuId}`);
      }
    });

    socket.on('join-room', (room) => {
      socket.join(room);
      logger.info(`Socket ${socket.id} joined custom room: ${room}`);
    });

    // --- AUTOMATION ENGINE CONTROL ---
    socket.on('olt-registry-update', (olts) => {
      // Receive the full active OLT list from the Admin frontend
      if (Array.isArray(olts)) {
        oltAutomator.updateRegistry(olts);
        // Start telemetry polling for all OLTs
        oltTelemetryPoller.startPollingAll(olts);
        logger.info(`[TELEMETRY] Started polling for ${olts.length} OLTs`);
      }
    });

    socket.on('stop-automation-loop', () => {
      oltAutomator.stop();
      // Stop telemetry polling when automation loop stops
      oltTelemetryPoller.stopPollingAll();
      logger.info('[TELEMETRY] Stopped all OLT polling');
    });

    // When a frontend component subscribes to listen to a specific username's traffic
    socket.on('subscribe-live-traffic', async (data) => {
      const { username, deviceConfig } = data || {};

      if (!username || !deviceConfig) {
        socket.emit('live-error', { message: 'Missing username or device configuration' });
        return;
      }

      logger.info(`Socket client ${socket.id} subscribed to live traffic for: ${username}`);

      // Tell the background job to start polling this user into Redis
      // (This avoids polling all users all the time if no one is looking at them)
      livePoller.addUserToPoll(username, deviceConfig);

      // We set up an interval to push from Redis to this specific socket
      const interval = setInterval(async () => {
        try {
          // getCached returns null if the key expired or hasn't be populated yet
          const cachedData = await LiveUsageService.getCached(username);

          if (cachedData) {
            socket.emit('live-data', cachedData);
          } else {
            // Socket can handle empty state or waiting state
            socket.emit('live-data', { status: 'Waiting for fresh traffic data...' });
          }
        } catch (err) {
          logger.error(`Socket Redis Fetch Error for ${username}: ${err.message}`);
        }
      }, 2000); // Push every 2 seconds

      // Cleanup when the user unmounts or disconnects
      socket.on('unsubscribe-live-traffic', (unsubUsername) => {
        if (unsubUsername === username) {
          clearInterval(interval);
          // Remove from poller if we no longer need it.
          // In a real system, keep track of subscriber count (ref-count) before stopping poll.
          livePoller.removeUserFromPoll(username);
          logger.info(`Socket client ${socket.id} unsubscribed from: ${username}`);
        }
      });

      // Handle socket disconnect to clean up the interval securely
      socket.on('disconnect', () => {
        clearInterval(interval);
        livePoller.removeUserFromPoll(username);
      });
    });

    // --- GLOBAL CACHE CONTROL ---
    socket.on('trigger-global-wipe', () => {
      logger.warn(`[SYSTEM] Global Registry Wipe triggered by ${socket.id}`);
      io.emit('global-wipe', { timestamp: new Date().toISOString() });
    });

    // --- TELEMETRY CONTROL ---
    socket.on('get-telemetry-status', () => {
      const status = oltTelemetryPoller.getStatus();
      socket.emit('telemetry-status', status);
    });
  });
}
