import { ICacheManager, CacheOptions } from '../contracts/cache.contracts';

export class CacheAsideStrategy {
  public static async execute<T>(
    manager: ICacheManager,
    key: string,
    fetchFn: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<T> {
    const cached = await manager.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    const fresh = await fetchFn();
    if (fresh !== null && fresh !== undefined) {
      await manager.set(key, fresh, options);
    } else if (options?.negativeCacheTtlSeconds) {
      // Negative cache
      await manager.set(key, null as any, { ttlSeconds: options.negativeCacheTtlSeconds });
    }
    return fresh;
  }
}

export class ReadThroughStrategy {
  public static async execute<T>(
    manager: ICacheManager,
    key: string,
    loaderFn: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<T> {
    return CacheAsideStrategy.execute(manager, key, loaderFn, options);
  }
}

export class WriteThroughStrategy {
  public static async execute<T>(
    manager: ICacheManager,
    key: string,
    value: T,
    persistFn: (data: T) => Promise<void>,
    options?: CacheOptions,
  ): Promise<T> {
    await persistFn(value);
    await manager.set(key, value, options);
    return value;
  }
}

export class WriteBehindStrategy {
  public static async execute<T>(
    manager: ICacheManager,
    key: string,
    value: T,
    options?: CacheOptions,
  ): Promise<void> {
    await manager.set(key, value, options);
    // Asynchronous background writer hook (deferred to Phase 2.9 queue worker)
  }
}

export class RefreshAheadStrategy {
  public static async execute<T>(
    manager: ICacheManager,
    key: string,
    loaderFn: () => Promise<T>,
    _options?: CacheOptions,
  ): Promise<T> {
    return CacheAsideStrategy.execute(manager, key, loaderFn);
  }
}
