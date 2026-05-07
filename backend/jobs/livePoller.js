import LiveUsageService from '../services/liveUsageService.js';
import logger from '../utils/logger.js';

// Store the users actively being polled
let activePollingUsers = new Map();
let pollIntervalObject = null;

// The polling interval (in milliseconds)
const POLLING_INTERVAL_MS = 2000; 

export function startPolling() {
  if (pollIntervalObject) return;
  
  logger.info(`Started live polling engine for active endpoints.`);
  pollIntervalObject = setInterval(async () => {
    
    // We poll all users in the Map
    for (const [username, userConfig] of activePollingUsers.entries()) {
      try {
        await LiveUsageService.pollUser(userConfig.device, username);
      } catch (err) {
        logger.error(`Live polling failed for ${username}: ${err.message}`);
      }
    }
  }, POLLING_INTERVAL_MS);
}

export function stopPolling() {
  if (pollIntervalObject) {
    clearInterval(pollIntervalObject);
    pollIntervalObject = null;
    logger.info(`Stopped live polling engine.`);
  }
}

export function addUserToPoll(username, deviceConfig) {
  if (!activePollingUsers.has(username)) {
    activePollingUsers.set(username, { device: deviceConfig });
    logger.info(`Added ${username} to live polling`);
  }
}

export function removeUserFromPoll(username) {
  if (activePollingUsers.has(username)) {
    activePollingUsers.delete(username);
    logger.info(`Removed ${username} from live polling`);
  }
}

export const getActivePolledUsers = () => Array.from(activePollingUsers.keys());

export default {
  startPolling,
  stopPolling,
  addUserToPoll,
  removeUserFromPoll,
  getActivePolledUsers
};
