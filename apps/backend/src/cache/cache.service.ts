import { ICacheAdapter, CacheOptions, CacheMetrics } from './cache.types';
import { InMemoryCacheAdapter, RedisCacheAdapter } from './cache.adapter';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface CacheServiceOperationOptions {
  failClosed?: boolean;
}

export class CacheService {
  private static instance: CacheService;
  private adapter: ICacheAdapter;
  private providerName: string;
  private hitCount = 0;
  private missCount = 0;

  private constructor() {
    if (env.CACHE_PROVIDER === 'redis') {
      this.adapter = new RedisCacheAdapter();
      this.providerName = 'Redis';
      logger.info('[CacheService] Initialized with RedisCacheAdapter');
    } else {
      this.adapter = new InMemoryCacheAdapter();
      this.providerName = 'InMemory';
      logger.info('[CacheService] Initialized with InMemoryCacheAdapter');
    }
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async get<T>(key: string, options?: CacheServiceOperationOptions): Promise<T | null> {
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
      if (options?.failClosed) {
        throw new Error(`Cache error on GET [${key}]: ${err.message || err}`);
      }
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    options?: CacheOptions & CacheServiceOperationOptions,
  ): Promise<void> {
    try {
      await this.adapter.set<T>(key, value, options);
      logger.info(`[Cache SET] key: ${key}`);
    } catch (err: any) {
      logger.error(`[Cache Error] Failed to set key ${key}:`, err);
      if (options?.failClosed) {
        throw new Error(`Cache error on SET [${key}]: ${err.message || err}`);
      }
    }
  }

  async delete(key: string, options?: CacheServiceOperationOptions): Promise<void> {
    try {
      await this.adapter.delete(key);
      logger.info(`[Cache DELETE] key: ${key}`);
    } catch (err: any) {
      logger.error(`[Cache Error] Failed to delete key ${key}:`, err);
      if (options?.failClosed) {
        throw new Error(`Cache error on DELETE [${key}]: ${err.message || err}`);
      }
    }
  }

  async exists(key: string, options?: CacheServiceOperationOptions): Promise<boolean> {
    try {
      return await this.adapter.exists(key);
    } catch (err: any) {
      logger.error(`[Cache Error] Failed to check exists key ${key}:`, err);
      if (options?.failClosed) {
        throw new Error(`Cache error on EXISTS [${key}]: ${err.message || err}`);
      }
      return false;
    }
  }

  async invalidatePattern(pattern: string, options?: CacheServiceOperationOptions): Promise<void> {
    try {
      await this.adapter.invalidatePattern(pattern);
      logger.info(`[Cache INVALIDATE] pattern: ${pattern}`);
    } catch (err: any) {
      logger.error(`[Cache Error] Failed to invalidate pattern ${pattern}:`, err);
      if (options?.failClosed) {
        throw new Error(`Cache error on INVALIDATE [${pattern}]: ${err.message || err}`);
      }
    }
  }

  async clear(options?: CacheServiceOperationOptions): Promise<void> {
    try {
      await this.adapter.clear();
      logger.info('[Cache CLEAR] cleared all entries');
    } catch (err: any) {
      logger.error('[Cache Error] Failed to clear cache:', err);
      if (options?.failClosed) {
        throw new Error(`Cache error on CLEAR: ${err.message || err}`);
      }
    }
  }

  async incr(key: string, options?: CacheServiceOperationOptions): Promise<number> {
    try {
      return await this.adapter.incr(key);
    } catch (err: any) {
      logger.error(`[Cache Error] Failed to incr key ${key}:`, err);
      if (options?.failClosed) {
        throw new Error(`Cache error on INCR [${key}]: ${err.message || err}`);
      }
      return 0;
    }
  }

  async setNX<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
    options?: CacheServiceOperationOptions,
  ): Promise<boolean> {
    try {
      return await this.adapter.setNX<T>(key, value, ttlSeconds);
    } catch (err: any) {
      logger.error(`[Cache Error] Failed to setNX key ${key}:`, err);
      if (options?.failClosed) {
        throw new Error(`Cache error on SETNX [${key}]: ${err.message || err}`);
      }
      return false;
    }
  }

  async ttl(key: string, options?: CacheServiceOperationOptions): Promise<number> {
    try {
      return await this.adapter.ttl(key);
    } catch (err: any) {
      logger.error(`[Cache Error] Failed to get ttl key ${key}:`, err);
      if (options?.failClosed) {
        throw new Error(`Cache error on TTL [${key}]: ${err.message || err}`);
      }
      return -2;
    }
  }

  async expire(
    key: string,
    ttlSeconds: number,
    options?: CacheServiceOperationOptions,
  ): Promise<boolean> {
    try {
      return await this.adapter.expire(key, ttlSeconds);
    } catch (err: any) {
      logger.error(`[Cache Error] Failed to expire key ${key}:`, err);
      if (options?.failClosed) {
        throw new Error(`Cache error on EXPIRE [${key}]: ${err.message || err}`);
      }
      return false;
    }
  }

  async getAndDelete<T>(key: string, options?: CacheServiceOperationOptions): Promise<T | null> {
    try {
      const val = await this.adapter.getAndDelete<T>(key);
      if (val !== null) {
        this.hitCount++;
        logger.info(`[Cache GETDEL HIT] key: ${key}`);
      } else {
        this.missCount++;
        logger.info(`[Cache GETDEL MISS] key: ${key}`);
      }
      return val;
    } catch (err: any) {
      logger.error(`[Cache Error] Failed to getAndDelete key ${key}:`, err);
      if (options?.failClosed) {
        throw new Error(`Cache error on GETDEL [${key}]: ${err.message || err}`);
      }
      return null;
    }
  }

  async getMetrics(): Promise<CacheMetrics> {
    const entryCount = (this.adapter as InMemoryCacheAdapter).size
      ? (this.adapter as InMemoryCacheAdapter).size()
      : 0;
    const total = this.hitCount + this.missCount;
    const hitRate = total > 0 ? Number((this.hitCount / total).toFixed(2)) : 0;

    return {
      provider: this.providerName,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate,
      entryCount,
      status: 'active',
    };
  }
}

export const cacheService = CacheService.getInstance();
