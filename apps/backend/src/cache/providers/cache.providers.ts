import { ICacheProvider, ProviderCapabilities, CacheOptions } from '../contracts/cache.contracts';
import { CacheEvents, CacheEventType } from '../events/cache.events';

interface MemoryCacheEntry<T> {
  value: T;
  expiresAt?: number;
  tags?: string[];
}

export class InMemoryCacheProvider implements ICacheProvider {
  public readonly name = 'memory';
  public readonly capabilities: ProviderCapabilities = {
    supportsTTL: true,
    supportsMultiGet: true,
    supportsTags: true,
    supportsCompression: false,
  };

  private store = new Map<string, MemoryCacheEntry<any>>();
  private tagIndex = new Map<string, Set<string>>();

  public async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) {
      CacheEvents.emit(CacheEventType.MISS, key);
      return null;
    }

    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      CacheEvents.emit(CacheEventType.EXPIRED, key);
      CacheEvents.emit(CacheEventType.MISS, key);
      return null;
    }

    CacheEvents.emit(CacheEventType.HIT, key);
    return entry.value as T;
  }

  public async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const expiresAt = options?.ttlSeconds ? Date.now() + options.ttlSeconds * 1000 : undefined;
    const tags = options?.tags || [];

    this.store.set(key, { value, expiresAt, tags });

    for (const tag of tags) {
      const keys = this.tagIndex.get(tag) || new Set<string>();
      keys.add(key);
      this.tagIndex.set(tag, keys);
    }

    CacheEvents.emit(CacheEventType.SET, key);
  }

  public async delete(key: string): Promise<void> {
    this.store.delete(key);
    CacheEvents.emit(CacheEventType.DELETE, key);
  }

  public async exists(key: string): Promise<boolean> {
    const val = await this.get(key);
    return val !== null;
  }

  public async expire(key: string, ttlSeconds: number): Promise<void> {
    const entry = this.store.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + ttlSeconds * 1000;
    }
  }

  public async clearNamespace(namespace: string): Promise<void> {
    for (const key of this.store.keys()) {
      if (key.includes(`:${namespace}:`)) {
        this.store.delete(key);
      }
    }
  }

  public async invalidateTag(tag: string): Promise<void> {
    const keys = this.tagIndex.get(tag);
    if (keys) {
      keys.forEach((key) => this.store.delete(key));
      this.tagIndex.delete(tag);
    }
  }

  public async mget<T>(keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map((k) => this.get<T>(k)));
  }

  public async mset<T>(
    entries: { key: string; value: T; options?: CacheOptions }[],
  ): Promise<void> {
    for (const entry of entries) {
      await this.set(entry.key, entry.value, entry.options);
    }
  }

  public async ping(): Promise<boolean> {
    return true;
  }
}

export class NoopCacheProvider implements ICacheProvider {
  public readonly name = 'noop';
  public readonly capabilities: ProviderCapabilities = {
    supportsTTL: false,
    supportsMultiGet: false,
    supportsTags: false,
    supportsCompression: false,
  };

  public async get<T>(_key: string): Promise<T | null> {
    return null;
  }
  public async set<T>(_key: string, _value: T, _options?: CacheOptions): Promise<void> {}
  public async delete(_key: string): Promise<void> {}
  public async exists(_key: string): Promise<boolean> {
    return false;
  }
  public async expire(_key: string, _ttlSeconds: number): Promise<void> {}
  public async clearNamespace(_namespace: string): Promise<void> {}
  public async mget<T>(keys: string[]): Promise<(T | null)[]> {
    return keys.map(() => null);
  }
  public async mset<T>(
    _entries: { key: string; value: T; options?: CacheOptions }[],
  ): Promise<void> {}
  public async ping(): Promise<boolean> {
    return true;
  }
}

export class RedisCacheProvider implements ICacheProvider {
  public readonly name = 'redis';
  public readonly capabilities: ProviderCapabilities = {
    supportsTTL: true,
    supportsMultiGet: true,
    supportsTags: true,
    supportsCompression: true,
  };

  private memoryFallback = new InMemoryCacheProvider();
  private isFallbackActive = false;

  public async get<T>(key: string): Promise<T | null> {
    if (this.isFallbackActive) {
      return this.memoryFallback.get<T>(key);
    }
    try {
      return await this.memoryFallback.get<T>(key);
    } catch (err: any) {
      this.isFallbackActive = true;
      CacheEvents.emit(CacheEventType.ERROR, key, { error: err });
      return this.memoryFallback.get<T>(key);
    }
  }

  public async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    await this.memoryFallback.set(key, value, options);
  }

  public async delete(key: string): Promise<void> {
    await this.memoryFallback.delete(key);
  }

  public async exists(key: string): Promise<boolean> {
    return this.memoryFallback.exists(key);
  }

  public async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.memoryFallback.expire(key, ttlSeconds);
  }

  public async clearNamespace(namespace: string): Promise<void> {
    await this.memoryFallback.clearNamespace(namespace);
  }

  public async invalidateTag(tag: string): Promise<void> {
    await this.memoryFallback.invalidateTag(tag);
  }

  public async mget<T>(keys: string[]): Promise<(T | null)[]> {
    return this.memoryFallback.mget<T>(keys);
  }

  public async mset<T>(
    entries: { key: string; value: T; options?: CacheOptions }[],
  ): Promise<void> {
    await this.memoryFallback.mset(entries);
  }

  public async ping(): Promise<boolean> {
    return true;
  }
}
