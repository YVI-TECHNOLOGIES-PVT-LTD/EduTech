import { ICacheAdapter, CacheOptions, CacheItem } from './cache.types';
import { getRedisClient } from './redis.client';
import { logger } from '../utils/logger';

export class InMemoryCacheAdapter implements ICacheAdapter {
  private store: Map<string, CacheItem> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) return null;

    if (item.expiresAt !== null && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return item.value as T;
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const ttlMs = options?.ttlMs;
    const expiresAt = ttlMs ? Date.now() + ttlMs : null;
    this.store.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const val = await this.get(key);
    return val !== null;
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    }
  }

  async incr(key: string): Promise<number> {
    const item = this.store.get(key);
    let currentVal = 0;
    let expiresAt: number | null = null;

    if (item) {
      if (item.expiresAt !== null && Date.now() > item.expiresAt) {
        this.store.delete(key);
      } else {
        currentVal =
          typeof item.value === 'number' ? item.value : parseInt(String(item.value), 10) || 0;
        expiresAt = item.expiresAt;
      }
    }

    const newVal = currentVal + 1;
    this.store.set(key, { value: newVal, expiresAt });
    return newVal;
  }

  async setNX<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    const keyExists = await this.exists(key);
    if (keyExists) {
      return false;
    }
    const ttlMs = ttlSeconds ? ttlSeconds * 1000 : undefined;
    await this.set(key, value, { ttlMs });
    return true;
  }

  async ttl(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item) return -2;

    if (item.expiresAt !== null && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return -2;
    }

    if (item.expiresAt === null) return -1;
    return Math.max(0, Math.ceil((item.expiresAt - Date.now()) / 1000));
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const item = this.store.get(key);
    if (!item) return false;

    if (item.expiresAt !== null && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return false;
    }

    item.expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, item);
    return true;
  }

  async getAndDelete<T>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) return null;

    if (item.expiresAt !== null && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    this.store.delete(key);
    return item.value as T;
  }

  size(): number {
    return this.store.size;
  }
}

export class RedisCacheAdapter implements ICacheAdapter {
  private get client() {
    return getRedisClient();
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    if (data === null) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    const ttlMs = options?.ttlMs;

    if (ttlMs && ttlMs > 0) {
      await this.client.set(key, serialized, 'PX', ttlMs);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const count = await this.client.exists(key);
    return count > 0;
  }

  async clear(): Promise<void> {
    await this.client.flushdb();
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  async incr(key: string): Promise<number> {
    return await this.client.incr(key);
  }

  async setNX<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    let result: string | null;

    if (ttlSeconds && ttlSeconds > 0) {
      result = await this.client.set(key, serialized, 'EX', ttlSeconds, 'NX');
    } else {
      result = await this.client.set(key, serialized, 'NX');
    }

    return result === 'OK';
  }

  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const res = await this.client.expire(key, ttlSeconds);
    return res === 1;
  }

  async getAndDelete<T>(key: string): Promise<T | null> {
    let data: string | null = null;

    try {
      // Redis 6.2+ GETDEL command
      data = await (this.client as any).getdel(key);
    } catch {
      // Fallback Lua script for atomic GET-and-DEL if GETDEL unsupported
      const luaScript = `
        local val = redis.call('GET', KEYS[1])
        if val then
          redis.call('DEL', KEYS[1])
        end
        return val
      `;
      data = (await this.client.eval(luaScript, 1, key)) as string | null;
    }

    if (data === null) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  }
}
