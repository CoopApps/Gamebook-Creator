import { createClient } from 'redis';
import logger from '../utils/logger';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD || undefined,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('❌ Redis reconnection failed after 10 attempts');
        return new Error('Redis reconnection limit exceeded');
      }
      // Exponential backoff: 50ms, 100ms, 200ms, 400ms, ...
      return Math.min(retries * 50, 3000);
    },
  },
});

redisClient.on('error', (err) => {
  logger.error('❌ Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('🔄 Redis connecting...');
});

redisClient.on('ready', () => {
  logger.info('✅ Redis connected and ready');
});

redisClient.on('reconnecting', () => {
  logger.warn('⚠️  Redis reconnecting...');
});

redisClient.on('end', () => {
  logger.info('Redis connection closed');
});

export async function connectRedis() {
  try {
    await redisClient.connect();

    // Test the connection
    await redisClient.ping();
    logger.info('✅ Redis health check passed');
  } catch (error) {
    logger.error('❌ Redis connection failed:', error);
    throw error;
  }
}

export async function disconnectRedis() {
  await redisClient.quit();
  logger.info('Redis disconnected');
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await disconnectRedis();
});

export default redisClient;
