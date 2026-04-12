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

// Let exports point to this Proxy which always routes to the current active client
let activeClient;
const redisProxy = new Proxy({}, {
  get: (target, prop) => {
    if (typeof activeClient[prop] === 'function') {
      return activeClient[prop].bind(activeClient);
    }
    return activeClient[prop];
  }
});

function switchToMemory() {
  if (activeClient instanceof MemoryRedis) return;
  logger.warn('🔄 SWAPPING REDIS -> INTERNAL MEMORY STORE');
  activeClient = new MemoryRedis();
}

try {
  const redisConfig = process.env.REDIS_URL || {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
  };

  const ioredisClient = new Redis(redisConfig, {
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
      if (times > 2) {
        logger.error('❌ Redis Connection Failed after 3 attempts. Fallback initiated.');
        switchToMemory();
        return null;
      }
      return 100;
    }
  });

  ioredisClient.on('error', (err) => {
    logger.error('Redis connection error:', err.message);
    switchToMemory();
  });

  ioredisClient.on('connect', () => {
    logger.info('✅ Successfully connected to Redis Cluster');
  });

  activeClient = ioredisClient;
} catch (e) {
  logger.error('Redis library failure, using memory fallback');
  activeClient = new MemoryRedis();
}

module.exports = redisProxy;
