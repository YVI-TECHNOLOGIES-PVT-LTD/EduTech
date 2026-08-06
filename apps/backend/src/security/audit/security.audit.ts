import { SecurityAuditEventType } from '../contracts/security.contracts';
import { loggerService } from '../../observability/logger.service';
import { MetricsRegistry } from '../../observability/metrics/metrics.engine';

export class SecurityAuditLogger {
  private static metrics = MetricsRegistry.getInstance();

  public static logEvent(type: SecurityAuditEventType, message: string, meta?: Record<string, any>): void {
    this.metrics.incrementCounter(`security_event_${type.toLowerCase()}_total`);
    loggerService.warn(`🔒 [Security Audit Event: ${type}] ${message}`, meta);
  }
}
