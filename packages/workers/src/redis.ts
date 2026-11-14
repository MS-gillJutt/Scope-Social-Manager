import { Redis } from 'ioredis';
import { logger } from './utils/logger.js';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export function createRedisConnection(): Redis {
  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times) => Math.min(times * 100, 3000),
  });

  client.on('error', (err) => {
    logger.error({ err: err.message }, 'Redis connection error');
  });

  return client;
}

// Singleton connection for general queue commands / publish / subscribe
export const redisConnection = createRedisConnection();

export default redisConnection;
