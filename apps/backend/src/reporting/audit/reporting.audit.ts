import { loggerService } from '../../observability/logger.service';

export interface ReportingAuditRecord {
  user?: string;
  reportKey: string;
  format?: string;
  durationMs: number;
  rowCount: number;
}

export class ReportingAuditLogger {
  public static log(record: ReportingAuditRecord): void {
    loggerService.info(`📊 [Report Generated] Key: ${record.reportKey}, Format: ${record.format || 'dataset'}, Rows: ${record.rowCount} (${record.durationMs}ms)`, {
      user: record.user || 'system',
      reportKey: record.reportKey,
      format: record.format || 'dataset',
      durationMs: record.durationMs,
      rowCount: record.rowCount,
    });
  }
}
