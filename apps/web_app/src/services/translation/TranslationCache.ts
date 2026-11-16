import { SupportedLanguageCode, TranslationCacheEntry } from './translation.types';

/**
 * TranslationCache
 *
 * Two-level caching system:
 * - L1: High-performance in-memory Map for zero-latency synchronous reads
 * - L2: Bounded persistent localStorage cache with versioning and LRU pruning
 */
export class TranslationCache {
  private static readonly STORAGE_PREFIX = 'edutrack_tr_v1:';
  private static readonly INDEX_KEY = 'edutrack_tr_v1_index';
  private static readonly MAX_PERSISTENT_ENTRIES = 1000;

  // L1 In-memory cache
  private memoryCache: Map<string, string> = new Map();

  // Track cache key index for LRU eviction
  private accessLog: Map<string, number> = new Map();

  constructor() {
    this.hydrateFromPersistentStorage();
  }

  /**
   * Generates a normalized cache key.
   */
  public static makeKey(
    sourceLang: SupportedLanguageCode | string,
    targetLang: SupportedLanguageCode | string,
    text: string,
  ): string {
    const src = (sourceLang || 'en').toLowerCase().trim();
    const tgt = (targetLang || 'en').toLowerCase().trim();
    const normalizedText = (text || '').trim();
    return `${src}::${tgt}::${normalizedText}`;
  }

  /**
   * Synchronously retrieves a translation from L1 memory or L2 persistent cache.
   */
  public get(key: string): string | null {
    // 1. Check L1 Memory Cache
    if (this.memoryCache.has(key)) {
      this.accessLog.set(key, Date.now());
      return this.memoryCache.get(key) || null;
    }

    // 2. Check L2 Persistent Storage
    const fromStorage = this.readFromStorage(key);
    if (fromStorage) {
      this.memoryCache.set(key, fromStorage);
      this.accessLog.set(key, Date.now());
      return fromStorage;
    }

    return null;
  }

  /**
   * Sets a translation in both L1 memory and L2 persistent storage.
   */
  public set(key: string, translatedText: string): void {
    if (!key || translatedText === undefined || translatedText === null) return;

    // Set L1
    this.memoryCache.set(key, translatedText);
    this.accessLog.set(key, Date.now());

    // Set L2
    this.writeToStorage(key, translatedText);
  }

  /**
   * Checks if a key exists in cache.
   */
  public has(key: string): boolean {
    return this.memoryCache.has(key) || this.readFromStorage(key) !== null;
  }

  /**
   * Clears in-memory and persistent cache.
   */
  public clear(): void {
    this.memoryCache.clear();
    this.accessLog.clear();

    if (typeof window === 'undefined') return;

    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(TranslationCache.STORAGE_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      localStorage.removeItem(TranslationCache.INDEX_KEY);
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Hydrates memory cache with most recently accessed keys on initialization.
   */
  private hydrateFromPersistentStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const rawIndex = localStorage.getItem(TranslationCache.INDEX_KEY);
      if (!rawIndex) return;

      const keys: string[] = JSON.parse(rawIndex);
      if (!Array.isArray(keys)) return;

      for (const storageKey of keys.slice(-200)) {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const entry: TranslationCacheEntry = JSON.parse(raw);
          const cacheKey = storageKey.replace(TranslationCache.STORAGE_PREFIX, '');
          this.memoryCache.set(cacheKey, entry.translatedText);
          this.accessLog.set(cacheKey, entry.timestamp || Date.now());
        }
      }
    } catch {
      // Ignore hydration parse errors
    }
  }

  private readFromStorage(key: string): string | null {
    if (typeof window === 'undefined') return null;

    try {
      const storageKey = TranslationCache.STORAGE_PREFIX + key;
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;

      const entry: TranslationCacheEntry = JSON.parse(raw);
      return entry.translatedText || null;
    } catch {
      return null;
    }
  }

  private writeToStorage(key: string, translatedText: string): void {
    if (typeof window === 'undefined') return;

    try {
      const storageKey = TranslationCache.STORAGE_PREFIX + key;
      const entry: TranslationCacheEntry = {
        text: key,
        targetLang: key.split('::')[1] || '',
        translatedText,
        timestamp: Date.now(),
      };

      localStorage.setItem(storageKey, JSON.stringify(entry));

      // Update index & maintain bounded size
      this.updateStorageIndex(storageKey);
    } catch {
      // If quota exceeded, prune older half of cache
      this.pruneOldestEntries(200);
    }
  }

  private updateStorageIndex(newStorageKey: string): void {
    try {
      const rawIndex = localStorage.getItem(TranslationCache.INDEX_KEY);
      let keys: string[] = rawIndex ? JSON.parse(rawIndex) : [];
      if (!Array.isArray(keys)) keys = [];

      // Add to list if not already present
      keys = keys.filter((k) => k !== newStorageKey);
      keys.push(newStorageKey);

      // Enforce max entry limit (LRU eviction)
      if (keys.length > TranslationCache.MAX_PERSISTENT_ENTRIES) {
        const excess = keys.length - TranslationCache.MAX_PERSISTENT_ENTRIES;
        const keysToRemove = keys.splice(0, excess);
        keysToRemove.forEach((k) => {
          try {
            localStorage.removeItem(k);
          } catch {
            // ignore
          }
        });
      }

      localStorage.setItem(TranslationCache.INDEX_KEY, JSON.stringify(keys));
    } catch {
      // Storage errors handled gracefully
    }
  }

  private pruneOldestEntries(countToPrune: number): void {
    try {
      const rawIndex = localStorage.getItem(TranslationCache.INDEX_KEY);
      if (!rawIndex) return;

      const keys: string[] = JSON.parse(rawIndex);
      if (!Array.isArray(keys) || keys.length === 0) return;

      const toRemove = keys.splice(0, countToPrune);
      toRemove.forEach((k) => {
        try {
          localStorage.removeItem(k);
        } catch {
          // ignore
        }
      });
      localStorage.setItem(TranslationCache.INDEX_KEY, JSON.stringify(keys));
    } catch {
      // ignore
    }
  }
}
