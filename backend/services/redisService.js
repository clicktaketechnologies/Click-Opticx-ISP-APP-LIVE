const Redis = require('ioredis');
const logger = require('../utils/logger');

// Fallback Memory Store for environments without Redis
class MemoryRedis {
  constructor() {
    this.data = new Map();
    this.timeouts = new Map();
    logger.warn('⚠️ INITIALIZING MEMORY-ONLY FALLBACK (NO REDIS DETECTED)');
  }

  async set(key, value, mode, duration) {
    this.data.set(key, value);
    if (mode === 'EX' && duration) {
       if (this.timeouts.has(key)) clearTimeout(this.timeouts.get(key));
       const t = setTimeout(() => this.data.delete(key), duration * 1000);
       this.timeouts.set(key, t);
    }
    return 'OK';
  }

  async get(key) {
    return this.data.get(key) || null;
  }

  async del(key) {
    if (this.timeouts.has(key)) clearTimeout(this.timeouts.get(key));
    this.timeouts.delete(key);
    return this.data.delete(key);
  }

  on() { return this; } // Mock event listener
}

let redis;
try {
  redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
      if (times > 2) {
        logger.error('❌ Redis Connection Failed after 3 attempts. Switching to INTERNAL MEMORY.');
        return null; // Stop retrying
      }
      return 100;
    }
  });

  redis.on('error', (err) => {
    if (redis instanceof Redis) {
        logger.error('Redis connection error:', err.message);
        redis = new MemoryRedis(); // Swap to memory on failure
    }
  });

  redis.on('connect', () => {
    logger.info('✅ Successfully connected to Redis Cluster');
  });

} catch (e) {
  logger.error('Redis library failure, using memory fallback');
  redis = new MemoryRedis();
}

module.exports = redis;
