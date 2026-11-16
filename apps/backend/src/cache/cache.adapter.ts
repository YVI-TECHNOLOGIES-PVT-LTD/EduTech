import { ICacheAdapter, CacheOptions, CacheItem } from './cache.types';

export class InMemoryCacheAdapter implements ICacheAdapter {
  static readonly MAX_ENTRIES = 5000;
  private store: Map<string, CacheItem> = new Map();

  private purgeExpired(now = Date.now()): void {
    for (const [k, item] of this.store.entries()) {
      if (item.expiresAt !== null && now > item.expiresAt) {
        this.store.delete(k);
      }
    }
  }

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
    const now = Date.now();
    if (!this.store.has(key) && this.store.size >= InMemoryCacheAdapter.MAX_ENTRIES) {
      this.purgeExpired(now);
      if (this.store.size >= InMemoryCacheAdapter.MAX_ENTRIES) {
        const oldestKey = this.store.keys().next().value;
        if (oldestKey !== undefined) {
          this.store.delete(oldestKey);
        }
      }
    }
    const ttlMs = options?.ttlMs;
    const expiresAt = ttlMs ? now + ttlMs : null;
    this.store.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
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

  size(): number {
    return this.store.size;
  }
}
