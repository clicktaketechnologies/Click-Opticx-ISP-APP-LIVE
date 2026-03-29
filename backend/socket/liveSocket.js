const LiveUsageService = require('../services/liveUsageService');
const livePoller = require('../jobs/livePoller');
const logger = require('../utils/logger');

const OLTHealthAutomator = require('../jobs/oltHealthAutomator');

module.exports = (io) => {
  // We initialize the OLT automator but don't start it until requested
  const oltAutomator = new OLTHealthAutomator(io);

  io.on('connection', (socket) => {
    
    // --- AUTHENTICATION & ROOM JOINING ---
    socket.on('authenticate', (data) => {
      const { role, onuId } = data;
      
      if (role === 'admin') {
        socket.join('admin_dashboard');
        logger.info(`Socket ${socket.id} joined Admin Dashboard`);
      } else if (role === 'user' && onuId) {
        socket.join(onuId);
        logger.info(`Socket ${socket.id} joined User ONU Room: ${onuId}`);
      }
    });

    // --- AUTOMATION ENGINE CONTROL ---
    socket.on('olt-registry-update', (olts) => {
      // Receive the full active OLT list from the Admin frontend
      if (Array.isArray(olts)) {
        oltAutomator.updateRegistry(olts);
      }
    });

    socket.on('stop-automation-loop', () => {
      oltAutomator.stop();
    });
    
    // When a frontend component subscribes to listen to a specific username's traffic
    socket.on('subscribe-live-traffic', async (data) => {
      const { username, deviceConfig } = data;
      
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
        // Note: Disconnect already logged in server.js, no need to log twice excessively
      });
    });

  });
};
