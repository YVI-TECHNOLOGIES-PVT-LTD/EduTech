import { loggerService } from '../../observability/logger.service';
import { MetricsRegistry } from '../../observability/metrics/metrics.engine';

export enum AuditComplianceEventType {
  RECORDED = 'AuditRecorded',
  VERIFIED = 'IntegrityVerified',
  GDPR_PROCESSED = 'GdprProcessed',
}

export class AuditComplianceEvents {
  private static metrics = MetricsRegistry.getInstance();

  public static emit(
    type: AuditComplianceEventType,
    action: string,
    meta?: Record<string, any>,
  ): void {
    this.metrics.incrementCounter(`audit_${type.toLowerCase()}_total`);
    loggerService.debug(`🛡️ [Audit Event: ${type}] Action: ${action}`, meta);
  }
}
