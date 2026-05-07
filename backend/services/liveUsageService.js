import redis from './redisService.js';
import MikroTikService from './mikrotikService.js';
import logger from '../utils/logger.js';

class LiveUsageService {

  static async pollUser(device, username) {
    try {
      const mikro = new MikroTikService(device);
      const traffic = await mikro.getUserTraffic(username);

      const key = `live:${username}`;

      // expires in 10 sec, adjust as necessary
      await redis.set(key, JSON.stringify({
        traffic,
        timestamp: Date.now()
      }), 'EX', 10);
      
    } catch (err) {
      logger.error(`LiveUsage poll failed for user ${username}:`, err.message);
    }
  }

  static async getCached(username) {
    try {
      const data = await redis.get(`live:${username}`);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      logger.error('Redis getCached error:', err.message);
      return null;
    }
  }
}

export default LiveUsageService;
