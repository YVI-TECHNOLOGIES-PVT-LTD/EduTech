import { ICacheAdapter, CacheOptions, CacheMetrics } from './cache.types';
import { InMemoryCacheAdapter } from './cache.adapter';
import { logger } from '../utils/logger';

export class CacheService {
  private static instance: CacheService;
  private adapter: ICacheAdapter;
  private hitCount = 0;
  private missCount = 0;

  private constructor() {
    this.adapter = new InMemoryCacheAdapter();
    logger.info('[CacheService] Initialized with InMemoryCacheAdapter');
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

  async getMetrics(): Promise<CacheMetrics> {
    const entryCount = (this.adapter as InMemoryCacheAdapter).size ? (this.adapter as InMemoryCacheAdapter).size() : 0;
    const total = this.hitCount + this.missCount;
    const hitRate = total > 0 ? Number((this.hitCount / total).toFixed(2)) : 0;

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
