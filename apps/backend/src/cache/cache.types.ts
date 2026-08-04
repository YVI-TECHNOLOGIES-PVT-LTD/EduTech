export interface CacheItem<T = any> {
  value: T;
  expiresAt: number | null;
}

export interface CacheOptions {
  ttlMs?: number;
}

export interface CacheMetrics {
  provider: string;
  hitCount: number;
  missCount: number;
  hitRate: number;
  entryCount: number;
  status: string;
}

export const CacheTTL = {
  SESSION: 15 * 60 * 1000,      // 15 minutes
  PERMISSIONS: 30 * 60 * 1000,  // 30 minutes
  ENQUIRIES: 10 * 60 * 1000,    // 10 minutes
  MASTER_DATA: 24 * 60 * 60 * 1000, // 24 hours
};

export interface ICacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  invalidatePattern(pattern: string): Promise<void>;
}
