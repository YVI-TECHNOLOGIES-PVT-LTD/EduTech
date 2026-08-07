import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface RedisHealth {
  enabled: boolean;
  connected: boolean;
  latencyMs: number | null;
}

/**
 * Owns the single Redis connection used by RedisCacheAdapter (see ADR-009).
 *
 * This is intentionally the only module in the codebase allowed to import
 * `ioredis` directly — everything else must go through `CacheService`.
 *
 * Redis is entirely optional: when CACHE_PROVIDER !== 'redis' (the default),
 * `connect()` is a no-op and no socket is ever opened.
 */
class RedisConnectionManager {
  private client: Redis | null = null;
  private connecting: Promise<void> | null = null;

  isEnabled(): boolean {
    return env.CACHE_PROVIDER === 'redis' && !!env.REDIS_URL;
  }

  /** Lazily creates the singleton client and wires up lifecycle logging. Does not open a socket. */
  getClient(): Redis {
    if (!this.client) {
      if (!env.REDIS_URL) {
        throw new Error('[Redis] getClient() called without REDIS_URL configured');
      }

      this.client = new Redis(env.REDIS_URL, {
        lazyConnect: true,
        connectTimeout: env.REDIS_CONNECT_TIMEOUT_MS,
        maxRetriesPerRequest: env.REDIS_MAX_RETRIES_PER_REQUEST,
        retryStrategy: (attempts: number) => Math.min(attempts * 200, 5000),
        reconnectOnError: () => true,
      });

      this.client.on('connect', () => {
        logger.info('[Redis] Connected');
      });

      this.client.on('ready', () => {
        logger.info('[Redis] Ready to accept commands');
      });

      this.client.on('reconnecting', (delayMs: number) => {
        logger.warn(`[Redis] Reconnecting in ${delayMs}ms...`);
      });

      this.client.on('close', () => {
        logger.warn('[Redis] Disconnected');
      });

      this.client.on('error', (err: Error) => {
        // ioredis emits 'error' on every failed attempt; never let this crash the process.
        logger.error('[Redis] Connection error', err);
      });
    }

    return this.client;
  }

  /** Opens the connection at startup. Never throws — Redis failures must never crash the app. */
  async connect(): Promise<void> {
    if (!this.isEnabled()) {
      logger.info('[CacheService] CACHE_PROVIDER is not "redis" — skipping Redis connection');
      return;
    }

    if (this.connecting) return this.connecting;

    this.connecting = this.getClient()
      .connect()
      .catch((err: Error) => {
        logger.error('[Redis] Initial connection failed. Continuing without Redis.', err);
      })
      .finally(() => {
        this.connecting = null;
      });

    return this.connecting;
  }

  /** Closes the connection gracefully, falling back to a hard disconnect if needed. */
  async disconnect(): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.quit();
      logger.info('[Redis] Connection closed gracefully');
    } catch (err: any) {
      logger.error('[Redis] Graceful shutdown failed, forcing disconnect', err);
      this.client.disconnect();
    }
  }

  isConnected(): boolean {
    return this.client?.status === 'ready';
  }

  /** Cheap health probe (PING) used by /health and CacheService.getMetrics(). */
  async getHealth(): Promise<RedisHealth> {
    if (!this.isEnabled()) {
      return { enabled: false, connected: false, latencyMs: null };
    }

    if (!this.isConnected()) {
      return { enabled: true, connected: false, latencyMs: null };
    }

    try {
      const start = Date.now();
      await this.getClient().ping();
      return { enabled: true, connected: true, latencyMs: Date.now() - start };
    } catch (err: any) {
      logger.error('[Redis] Health check failed', err);
      return { enabled: true, connected: false, latencyMs: null };
    }
  }
}

export const redisConnectionManager = new RedisConnectionManager();
