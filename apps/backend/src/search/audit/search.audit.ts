import { loggerService } from '../../observability/logger.service';

export interface SearchAuditRecord {
  user?: string;
  query: string;
  index: string;
  filters?: Record<string, any>;
  durationMs: number;
  resultCount: number;
}

export class SearchAuditLogger {
  public static log(record: SearchAuditRecord): void {
    loggerService.info(`🔍 [Search Executed] Index: ${record.index}, Query: "${record.query}", Results: ${record.resultCount} (${record.durationMs}ms)`, {
      user: record.user || 'anonymous',
      query: record.query,
      index: record.index,
      filters: record.filters,
      durationMs: record.durationMs,
      resultCount: record.resultCount,
    });
  }
}
