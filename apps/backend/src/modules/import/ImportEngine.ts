import {
  ImportStrategy,
  ValidationSummary,
  ExecutionSummary,
  ImportOptions,
  ImportUserMode,
} from './import.types';

export interface ImportContext {
  schoolId: string;
  userId?: string;
  jobId?: string;
  userMode?: ImportUserMode;
}

export interface ImportResult {
  successCount: number;
  failedCount: number;
  failedRows: any[];
}

export abstract class BaseImportStrategy<T = any> implements ImportStrategy {
  abstract validateRow(row: T, context: ImportContext): Promise<string[]>;
  abstract process(rows: T[], context: ImportContext): Promise<ImportResult>;

  async validate(
    rows: any[],
    schoolId: string,
    options?: ImportOptions,
  ): Promise<ValidationSummary> {
    const context: ImportContext = { schoolId, userMode: options?.userMode };
    const validRows: any[] = [];
    const failedRows: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = row._rowNum || i + 1;
      const errors = await this.validateRow(row, context);
      if (errors.length > 0) {
        failedRows.push({
          row: rowNum,
          errors: errors.map((e) => ({ row: rowNum, message: e, value: 'INVALID' })),
          data: row,
        });
      } else {
        validRows.push(row);
      }
    }

    return {
      isValid: failedRows.length === 0,
      totalRows: rows.length,
      validRows,
      failedRows,
    };
  }

  async execute(
    validRows: any[],
    context: { schoolId: string; userId: string; jobId: string; userMode?: ImportUserMode },
  ): Promise<ExecutionSummary> {
    const res = await this.process(validRows, context);
    return {
      totalRows: validRows.length,
      successCount: res.successCount,
      failedCount: res.failedCount,
      failedRows: res.failedRows,
    };
  }
}
