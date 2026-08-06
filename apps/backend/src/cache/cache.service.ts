import { CacheOptions, CacheMetrics } from './cache.types';
import { cacheManager } from './manager/cache.manager';
import { CacheHealthService } from './health/cache.health';

export class CacheService {
  private static instance: CacheService;
  private hitCount = 0;
  private missCount = 0;

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    const val = await cacheManager.get<T>(key);
    if (val !== null) {
      this.hitCount++;
    } else {
      this.missCount++;
    }
    return val;
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    await cacheManager.set<T>(key, value, { ttlSeconds: options?.ttlSeconds, tags: options?.tags });
  }

  async delete(key: string): Promise<void> {
    await cacheManager.delete(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    await cacheManager.clearNamespace(pattern);
  }

  async getMetrics(): Promise<CacheMetrics> {
    const total = this.hitCount + this.missCount;
    const hitRate = total > 0 ? Number((this.hitCount / total).toFixed(2)) : 0;
    const health = await CacheHealthService.getStatus();

    return {
      provider: health.provider,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate,
      entryCount: 0,
      status: health.status === 'ok' ? 'active' : 'degraded',
    };
  }
}

export const cacheService = CacheService.getInstance();
