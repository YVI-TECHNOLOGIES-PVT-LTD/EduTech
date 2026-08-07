import { ICacheAdapter, CacheOptions } from './cache.types';
import { redisConnectionManager } from './redis.client';

/**
 * Redis-backed implementation of ICacheAdapter (ADR-009).
 *
 * Not wired into CacheService by default — selected only when
 * CACHE_PROVIDER=redis and REDIS_URL are configured (see cache.service.ts).
 * Values are JSON-serialized so any structured-clone-safe value accepted by
 * InMemoryCacheAdapter can also be stored here without callers changing.
 */
export class RedisCacheAdapter implements ICacheAdapter {
  private get client() {
    return redisConnectionManager.getClient();
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const serialized = JSON.stringify(value);
    if (options?.ttlMs && options.ttlMs > 0) {
      await this.client.set(key, serialized, 'PX', options.ttlMs);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async clear(): Promise<void> {
    // Scoped wipe via pattern scan rather than FLUSHDB, in case the Redis
    // instance is ever shared with other consumers (e.g. BullMQ, sessions).
    await this.invalidatePattern('*');
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async ttl(key: string): Promise<number> {
    // PTTL already matches our contract: -1 = no expiry, -2 = missing key.
    return this.client.pttl(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const stream = this.client.scanStream({ match: pattern, count: 100 });
    const keysToDelete: string[] = [];

    await new Promise<void>((resolve, reject) => {
      stream.on('data', (keys: string[]) => {
        keysToDelete.push(...keys);
      });
      stream.on('end', () => resolve());
      stream.on('error', reject);
    });

    if (keysToDelete.length > 0) {
      await this.client.del(...keysToDelete);
    }
  }
}
