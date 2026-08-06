import { loggerService } from '../../observability/logger.service';

export interface FlagAuditRecord {
  flagKey: string;
  who: string;
  when: Date;
  oldValue: boolean;
  newValue: boolean;
  reason?: string;
}

export class FeatureFlagAuditLogger {
  public static logChange(record: FlagAuditRecord): void {
    loggerService.info(
      `🚩 [Feature Flag Changed] ${record.flagKey}: ${record.oldValue} -> ${record.newValue} by ${record.who}`,
      {
        flagKey: record.flagKey,
        who: record.who,
        when: record.when.toISOString(),
        oldValue: record.oldValue,
        newValue: record.newValue,
        reason: record.reason || 'Manual update',
      },
    );
  }
}
