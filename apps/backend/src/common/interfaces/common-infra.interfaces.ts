export interface ICache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface IClock {
  now(): Date;
  isoString(): string;
  timestamp(): number;
}

export interface IIdGenerator {
  generateUuid(): string;
}
