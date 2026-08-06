import { ExportFormat, ReportResult } from '../contracts/reporting.contracts';

export interface IReportExporter {
  readonly format: ExportFormat;
  export(result: ReportResult): Promise<Buffer>;
}

export class CsvExporter implements IReportExporter {
  public readonly format = 'csv';

  public async export(result: ReportResult): Promise<Buffer> {
    if (result.rows.length === 0) return Buffer.from('');
    const keys = Object.keys(result.rows[0]);
    const header = keys.join(',') + '\n';
    const lines = result.rows.map((row) => keys.map((k) => JSON.stringify(row[k] ?? '')).join(',')).join('\n');
    return Buffer.from(header + lines);
  }
}

export class JsonExporter implements IReportExporter {
  public readonly format = 'json';

  public async export(result: ReportResult): Promise<Buffer> {
    return Buffer.from(JSON.stringify(result.rows, null, 2));
  }
}

export class PdfExporter implements IReportExporter {
  public readonly format = 'pdf';

  public async export(result: ReportResult): Promise<Buffer> {
    const text = `PDF REPORT: ${result.title}\nTotal Rows: ${result.totalRows}\nGenerated: ${result.generatedAt.toISOString()}`;
    return Buffer.from(text);
  }
}

export class ExcelExporter implements IReportExporter {
  public readonly format = 'excel';

  public async export(result: ReportResult): Promise<Buffer> {
    const text = `EXCEL SPREADSHEET: ${result.title}\nTotal Rows: ${result.totalRows}`;
    return Buffer.from(text);
  }
}
