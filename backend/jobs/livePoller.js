const LiveUsageService = require('../services/liveUsageService');
const logger = require('../utils/logger');

// Store the users actively being polled
let activePollingUsers = new Map();
let pollIntervalObject = null;

// The polling interval (in milliseconds)
const POLLING_INTERVAL_MS = 2000; 

function startPolling() {
  if (pollIntervalObject) return;
  
  logger.info(`Started live polling engine for active endpoints.`);
  pollIntervalObject = setInterval(async () => {
    
    // We poll all users in the Map
    for (const [username, userConfig] of activePollingUsers.entries()) {
      try {
        await LiveUsageService.pollUser(userConfig.device, username);
        // Uncomment below to see logs every 2s for each user:
        // logger.debug(`Live poller updated cache for ${username}`);
      } catch (err) {
        logger.error(`Live polling failed for ${username}: ${err.message}`);
      }
    }
  }, POLLING_INTERVAL_MS);
}

function stopPolling() {
  if (pollIntervalObject) {
    clearInterval(pollIntervalObject);
    pollIntervalObject = null;
    logger.info(`Stopped live polling engine.`);
  }
}

function addUserToPoll(username, deviceConfig) {
  if (!activePollingUsers.has(username)) {
    activePollingUsers.set(username, { device: deviceConfig });
    logger.info(`Added ${username} to live polling`);
  }
}

function removeUserFromPoll(username) {
  if (activePollingUsers.has(username)) {
    activePollingUsers.delete(username);
    logger.info(`Removed ${username} from live polling`);
  }
}

module.exports = {
  startPolling,
  stopPolling,
  addUserToPoll,
  removeUserFromPoll,
  getActivePolledUsers: () => Array.from(activePollingUsers.keys())
};
