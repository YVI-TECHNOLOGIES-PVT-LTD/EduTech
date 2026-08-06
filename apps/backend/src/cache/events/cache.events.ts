import { MetricsRegistry } from '../../observability/metrics/metrics.engine';
import { loggerService } from '../../observability/logger.service';

export enum CacheEventType {
  HIT = 'CacheHit',
  MISS = 'CacheMiss',
  SET = 'CacheSet',
  DELETE = 'CacheDelete',
  EXPIRED = 'CacheExpired',
  EVICTED = 'CacheEvicted',
  ERROR = 'CacheError',
}

export class CacheEvents {
  private static metrics = MetricsRegistry.getInstance();

  public static emit(type: CacheEventType, key: string, meta?: Record<string, any>): void {
    if (type === CacheEventType.HIT) {
      this.metrics.incrementCounter('cache_hits_total');
      loggerService.debug(`[Cache HIT] Key: ${key}`, meta);
    } else if (type === CacheEventType.MISS) {
      this.metrics.incrementCounter('cache_misses_total');
      loggerService.debug(`[Cache MISS] Key: ${key}`, meta);
    } else if (type === CacheEventType.ERROR) {
      this.metrics.incrementCounter('cache_errors_total');
      loggerService.error(`[Cache ERROR] Key: ${key}`, meta?.error, meta);
    } else {
      loggerService.debug(`[${type}] Key: ${key}`, meta);
    }
  }
}
