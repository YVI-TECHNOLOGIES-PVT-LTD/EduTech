import { loggerService } from '../../observability/logger.service';
import { MetricsRegistry } from '../../observability/metrics/metrics.engine';

export enum SearchEventType {
  QUERY_EXECUTED = 'QueryExecuted',
  DOCUMENT_INDEXED = 'DocumentIndexed',
  INDEX_CLEARED = 'IndexCleared',
}

export class SearchEvents {
  private static metrics = MetricsRegistry.getInstance();

  public static emit(type: SearchEventType, index: string, meta?: Record<string, any>): void {
    this.metrics.incrementCounter(`search_${type.toLowerCase()}_total`);
    loggerService.debug(`🔍 [Search Event: ${type}] Index: ${index}`, meta);
  }
}
