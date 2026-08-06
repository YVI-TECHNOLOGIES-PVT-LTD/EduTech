export interface ReportingCapabilities {
  readonly supportsTabular: boolean;
  readonly supportsAggregations: boolean;
  readonly supportsCsvExport: boolean;
  readonly supportsPdfExport: boolean;
  readonly supportsExcelExport: boolean;
  readonly supportsStreaming: boolean;
}

export type ExportFormat = 'csv' | 'pdf' | 'excel' | 'json';

export interface ReportQueryPayload {
  reportKey: string;
  tenantId?: string;
  startDate?: Date;
  endDate?: Date;
  filters?: Record<string, any>;
  format?: ExportFormat;
}

export interface ReportColumn {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
}

export interface ReportDefinition {
  key: string;
  title: string;
  description?: string;
  columns: ReportColumn[];
}

export interface ReportResult {
  reportKey: string;
  title: string;
  rows: Record<string, any>[];
  totalRows: number;
  generatedAt: Date;
  durationMs: number;
  fileBuffer?: Buffer;
  storageKey?: string;
  format?: ExportFormat;
}

export interface IReportingEngine {
  readonly name: string;
  readonly capabilities: ReportingCapabilities;
  generateReport(payload: ReportQueryPayload): Promise<ReportResult>;
  exportReport(payload: ReportQueryPayload, format: ExportFormat): Promise<ReportResult>;
  ping(): Promise<boolean>;
}
