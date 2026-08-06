import { IReportingEngine, ReportingCapabilities, ReportQueryPayload, ReportResult, ExportFormat } from '../contracts/reporting.contracts';
import { ReportRegistry } from '../registry/report.registry';
import { CsvExporter, JsonExporter, PdfExporter, ExcelExporter } from '../exporter/reporting.exporters';

export class MemoryReportEngine implements IReportingEngine {
  constructor(public readonly name: string = 'memory') {}

  public readonly capabilities: ReportingCapabilities = {
    supportsTabular: true,
    supportsAggregations: true,
    supportsCsvExport: true,
    supportsPdfExport: true,
    supportsExcelExport: true,
    supportsStreaming: true,
  };

  public async generateReport(payload: ReportQueryPayload): Promise<ReportResult> {
    const start = process.hrtime.bigint();
    const def = ReportRegistry.get(payload.reportKey);
    const title = def ? def.title : payload.reportKey;

    const mockRows = [
      { academicYear: '2025-2026', program: 'Computer Science', totalEnrolled: 150, date: '2026-08-01', amount: 50000, paymentMethod: 'ONLINE' },
      { academicYear: '2025-2026', program: 'Electronics', totalEnrolled: 120, date: '2026-08-02', amount: 35000, paymentMethod: 'CASH' },
    ];

    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1000000;

    return {
      reportKey: payload.reportKey,
      title,
      rows: mockRows,
      totalRows: mockRows.length,
      generatedAt: new Date(),
      durationMs,
    };
  }

  public async exportReport(payload: ReportQueryPayload, format: ExportFormat): Promise<ReportResult> {
    const result = await this.generateReport(payload);
    let exporter;
    switch (format) {
      case 'json': exporter = new JsonExporter(); break;
      case 'pdf': exporter = new PdfExporter(); break;
      case 'excel': exporter = new ExcelExporter(); break;
      case 'csv':
      default: exporter = new CsvExporter(); break;
    }

    result.fileBuffer = await exporter.export(result);
    result.format = format;
    return result;
  }

  public async ping(): Promise<boolean> { return true; }
}

export class NoopReportEngine implements IReportingEngine {
  constructor(public readonly name: string = 'noop') {}

  public readonly capabilities: ReportingCapabilities = {
    supportsTabular: false,
    supportsAggregations: false,
    supportsCsvExport: false,
    supportsPdfExport: false,
    supportsExcelExport: false,
    supportsStreaming: false,
  };

  public async generateReport(payload: ReportQueryPayload): Promise<ReportResult> {
    return { reportKey: payload.reportKey, title: 'Noop', rows: [], totalRows: 0, generatedAt: new Date(), durationMs: 0 };
  }
  public async exportReport(payload: ReportQueryPayload, format: ExportFormat): Promise<ReportResult> {
    return this.generateReport(payload);
  }
  public async ping(): Promise<boolean> { return true; }
}

export class TabularReportEngine extends MemoryReportEngine {
  constructor() { super('tabular'); }
}

export class AggregatedMetricEngine extends MemoryReportEngine {
  constructor() { super('aggregated'); }
}
