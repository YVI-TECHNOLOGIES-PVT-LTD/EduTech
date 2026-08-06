export interface CacheOptions {
  ttlSeconds?: number;
  tags?: string[];
  preventStampede?: boolean;
  negativeCacheTtlSeconds?: number;
}

export interface ProviderCapabilities {
  readonly supportsTTL: boolean;
  readonly supportsMultiGet: boolean;
  readonly supportsTags: boolean;
  readonly supportsCompression: boolean;
}

export interface ICacheProvider {
  readonly name: string;
  readonly capabilities: ProviderCapabilities;
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  expire(key: string, ttlSeconds: number): Promise<void>;
  clearNamespace(namespace: string): Promise<void>;
  invalidateTag?(tag: string): Promise<void>;
  mget<T>(keys: string[]): Promise<(T | null)[]>;
  mset<T>(entries: { key: string; value: T; options?: CacheOptions }[]): Promise<void>;
  ping(): Promise<boolean>;
}

export interface ICacheSerializer {
  serialize<T>(data: T): string | Buffer;
  deserialize<T>(payload: string | Buffer): T;
}

export interface ICacheFactory {
  createProvider(name?: string): ICacheProvider;
}

export interface CacheKeyParams {
  environment?: string;
  application?: string;
  tenantId?: string;
  module: string;
  resource: string;
  identifier: string;
  version?: string;
}

export interface ICacheManager {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  delete(key: string): Promise<void>;
  remember<T>(
    key: string,
    ttlSeconds: number,
    fn: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<T>;
  invalidateTag(tag: string): Promise<void>;
  clearNamespace(namespace: string): Promise<void>;
}
