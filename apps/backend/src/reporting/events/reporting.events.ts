import { loggerService } from '../../observability/logger.service';
import { MetricsRegistry } from '../../observability/metrics/metrics.engine';

export enum ReportingEventType {
  REPORT_GENERATED = 'ReportGenerated',
  REPORT_EXPORTED = 'ReportExported',
  METRIC_CALCULATED = 'MetricCalculated',
}

export class ReportingEvents {
  private static metrics = MetricsRegistry.getInstance();

  public static emit(type: ReportingEventType, reportKey: string, meta?: Record<string, any>): void {
    this.metrics.incrementCounter(`reporting_${type.toLowerCase()}_total`);
    loggerService.debug(`📊 [Reporting Event: ${type}] Report Key: ${reportKey}`, meta);
  }
}
