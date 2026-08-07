import { ICacheAdapter, CacheOptions, CacheMetrics } from './cache.types';
import { InMemoryCacheAdapter } from './cache.adapter';
import { RedisCacheAdapter } from './redis-cache.adapter';
import { redisConnectionManager } from './redis.client';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export class CacheService {
  private static instance: CacheService;
  private adapter: ICacheAdapter;
  private provider: 'memory' | 'redis';
  private hitCount = 0;
  private missCount = 0;

  private constructor() {
    // Provider selection is centralized here (ADR-009) — callers only ever
    // depend on CacheService and remain unaware of which adapter is active.
    if (env.CACHE_PROVIDER === 'redis') {
      if (env.REDIS_URL) {
        this.adapter = new RedisCacheAdapter();
        this.provider = 'redis';
        logger.info('[CacheService] Initialized with RedisCacheAdapter');
      } else {
        logger.warn(
          '[CacheService] CACHE_PROVIDER=redis but REDIS_URL is not set. Falling back to InMemoryCacheAdapter.',
        );
        this.adapter = new InMemoryCacheAdapter();
        this.provider = 'memory';
      }
    } else {
      this.adapter = new InMemoryCacheAdapter();
      this.provider = 'memory';
      logger.info('[CacheService] Initialized with InMemoryCacheAdapter');
    }
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const val = await this.adapter.get<T>(key);
      if (val !== null) {
        this.hitCount++;
        logger.info(`[Cache HIT] key: ${key}`);
      } else {
        this.missCount++;
        logger.info(`[Cache MISS] key: ${key}`);
      }
      return val;
    } catch (err: any) {
      logger.error(`[Cache Error] Failed to get key ${key}:`, err);
      return null;
    }
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      await this.adapter.set<T>(key, value, options);
      logger.info(`[Cache SET] key: ${key}`);
    } catch (err: any) {
      logger.error(`[Cache Error] Failed to set key ${key}:`, err);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.adapter.delete(key);
      logger.info(`[Cache DELETE] key: ${key}`);
    } catch (err: any) {
      logger.error(`[Cache Error] Failed to delete key ${key}:`, err);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      await this.adapter.invalidatePattern(pattern);
      logger.info(`[Cache INVALIDATE] pattern: ${pattern}`);
    } catch (err: any) {
      logger.error(`[Cache Error] Failed to invalidate pattern ${pattern}:`, err);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return await this.adapter.exists(key);
    } catch (err: any) {
      logger.error(`[Cache Error] Failed to check existence of key ${key}:`, err);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.adapter.ttl(key);
    } catch (err: any) {
      logger.error(`[Cache Error] Failed to read TTL for key ${key}:`, err);
      return -2;
    }
  }

  async getMetrics(): Promise<CacheMetrics> {
    const total = this.hitCount + this.missCount;
    const hitRate = total > 0 ? Number((this.hitCount / total).toFixed(2)) : 0;

    if (this.provider === 'redis') {
      const health = await redisConnectionManager.getHealth();
      return {
        provider: 'Redis',
        hitCount: this.hitCount,
        missCount: this.missCount,
        hitRate,
        entryCount: -1, // Redis does not expose an O(1) key count; not tracked.
        status: health.connected ? 'active' : 'unavailable',
        connected: health.connected,
        latencyMs: health.latencyMs,
      };
    }

    const entryCount = (this.adapter as InMemoryCacheAdapter).size
      ? (this.adapter as InMemoryCacheAdapter).size()
      : 0;

    return {
      provider: 'InMemory',
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate,
      entryCount,
      status: 'active',
    };
  }
}

export const cacheService = CacheService.getInstance();
