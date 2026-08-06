import { ICacheManager, ICacheProvider, CacheOptions } from '../contracts/cache.contracts';
import { CacheFactory } from '../factory/cache.factory';
import { CacheAsideStrategy } from '../strategies/cache.strategies';

export class CacheManager implements ICacheManager {
  private static instance: CacheManager;
  private provider: ICacheProvider;
  private inFlightLocks = new Map<string, Promise<any>>();

  private constructor() {
    const factory = new CacheFactory();
    this.provider = factory.createProvider();
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  public async get<T>(key: string): Promise<T | null> {
    return this.provider.get<T>(key);
  }

  public async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    await this.provider.set(key, value, options);
  }

  public async delete(key: string): Promise<void> {
    await this.provider.delete(key);
  }

  public async exists(key: string): Promise<boolean> {
    return this.provider.exists(key);
  }

  public async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.provider.expire(key, ttlSeconds);
  }

  public async clearNamespace(namespace: string): Promise<void> {
    await this.provider.clearNamespace(namespace);
  }

  public async invalidateTag(tag: string): Promise<void> {
    if (this.provider.invalidateTag) {
      await this.provider.invalidateTag(tag);
    }
  }

  public async mget<T>(keys: string[]): Promise<(T | null)[]> {
    return this.provider.mget<T>(keys);
  }

  public async mset<T>(
    entries: { key: string; value: T; options?: CacheOptions }[],
  ): Promise<void> {
    await this.provider.mset(entries);
  }

  public async remember<T>(
    key: string,
    ttlSeconds: number,
    fn: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<T> {
    return this.rememberAsync(key, ttlSeconds, fn, options);
  }

  public async rememberAsync<T>(
    key: string,
    ttlSeconds: number,
    fn: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<T> {
    const opts: CacheOptions = { ttlSeconds, ...options };

    // Stampede Protection Mutex
    if (opts.preventStampede ?? true) {
      const lock = this.inFlightLocks.get(key);
      if (lock) {
        return lock;
      }

      const promise = CacheAsideStrategy.execute(this, key, fn, opts).finally(() => {
        this.inFlightLocks.delete(key);
      });

      this.inFlightLocks.set(key, promise);
      return promise;
    }

    return CacheAsideStrategy.execute(this, key, fn, opts);
  }
}

export const cacheManager = CacheManager.getInstance();
