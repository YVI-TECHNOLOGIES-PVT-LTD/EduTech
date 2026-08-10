import Redis, { RedisOptions } from 'ioredis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let redisInstance: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisInstance) {
    const redisUrl = env.REDIS_URL || 'redis://localhost:6379';

    // Mask password in logs if present
    const safeUrl = redisUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    logger.info(`[RedisClient] Initializing ioredis client with URL: ${safeUrl}`);

    const options: RedisOptions = {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      enableOfflineQueue: true,
      retryStrategy(times) {
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
    };

    redisInstance = new Redis(redisUrl, options);

    redisInstance.on('connect', () => {
      logger.info('[RedisClient] Connected to Redis successfully');
    });

    redisInstance.on('error', (err) => {
      logger.error('[RedisClient Error] Redis connection error:', err.message || err);
    });

    redisInstance.on('ready', () => {
      logger.info('[RedisClient] Redis client ready');
    });
  }

  return redisInstance;
}

export async function closeRedisClient(): Promise<void> {
  if (redisInstance) {
    try {
      await redisInstance.quit();
      logger.info('[RedisClient] Disconnected from Redis');
    } catch (err: any) {
      logger.error('[RedisClient Error] Error during disconnection:', err.message || err);
    } finally {
      redisInstance = null;
    }
  }
}
