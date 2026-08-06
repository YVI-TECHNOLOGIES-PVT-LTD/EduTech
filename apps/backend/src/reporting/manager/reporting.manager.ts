import { IReportingEngine, ReportQueryPayload, ReportResult, ExportFormat } from '../contracts/reporting.contracts';
import { ReportingFactory } from '../factory/reporting.factory';
import { ReportingSecurity } from '../security/reporting.security';
import { cacheManager } from '../../cache/manager/cache.manager';
import { queueManager } from '../../queue/manager/queue.manager';
import { storageManager } from '../../storage/manager/storage.manager';
import { StorageKeyBuilder } from '../../storage/keys/storage.keys';
import { ReportingAuditLogger } from '../audit/reporting.audit';
import { ReportingEvents, ReportingEventType } from '../events/reporting.events';

export class ReportingManager {
  private static instance: ReportingManager;
  private engine: IReportingEngine;

  private constructor() {
    const factory = new ReportingFactory();
    this.engine = factory.createEngine();
  }

  public static getInstance(): ReportingManager {
    if (!ReportingManager.instance) {
      ReportingManager.instance = new ReportingManager();
    }
    return ReportingManager.instance;
  }

  public async generateReport(payload: ReportQueryPayload): Promise<ReportResult> {
    const securedPayload = ReportingSecurity.applyTenantIsolation(payload);
    const cacheKey = `report:${securedPayload.reportKey}:${securedPayload.tenantId || 'global'}`;

    const cached = await cacheManager.get<ReportResult>(cacheKey);
    if (cached) return cached;

    const result = await this.engine.generateReport(securedPayload);
    await cacheManager.set(cacheKey, result, { ttlSeconds: 600 });

    ReportingAuditLogger.log({ reportKey: result.reportKey, durationMs: result.durationMs, rowCount: result.totalRows });
    ReportingEvents.emit(ReportingEventType.REPORT_GENERATED, result.reportKey);

    return result;
  }

  public async exportReport(payload: ReportQueryPayload, format: ExportFormat = 'csv'): Promise<ReportResult> {
    const securedPayload = ReportingSecurity.applyTenantIsolation(payload);
    const result = await this.engine.exportReport(securedPayload, format);

    if (result.fileBuffer) {
      const filename = `${result.reportKey}.${format}`;
      const storageKey = StorageKeyBuilder.build({
        module: 'reports',
        resource: 'exports',
        identifier: result.reportKey,
        filename,
      });
      const mimetype = format === 'json' ? 'application/json' : format === 'pdf' ? 'application/pdf' : 'text/csv';
      await storageManager.upload(storageKey, {
        buffer: result.fileBuffer,
        filename,
        mimetype,
        size: result.fileBuffer.length,
      });
      result.storageKey = storageKey;
    }

    ReportingAuditLogger.log({ reportKey: result.reportKey, format, durationMs: result.durationMs, rowCount: result.totalRows });
    ReportingEvents.emit(ReportingEventType.REPORT_EXPORTED, result.reportKey, { format });

    return result;
  }

  public async generateReportAsync(payload: ReportQueryPayload, format: ExportFormat = 'csv'): Promise<void> {
    await queueManager.enqueue('reporting:dispatch', 'export_report', { payload, format });
  }
}

export const reportingManager = ReportingManager.getInstance();
