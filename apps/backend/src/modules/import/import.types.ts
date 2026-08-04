export interface ImportError {
    row: number; // 1-indexed (header is 0 or ignored)
    column?: string;
    message: string;
    value?: any;
}

export interface FailedRow {
    row: number;
    errors: ImportError[];
    data: any;
}

export interface ValidationSummary {
    isValid: boolean;
    totalRows: number;
    validRows: any[];  // Rows that passed validation
    failedRows: FailedRow[]; // Rows that failed validation and won't be imported
}

export interface ExecutionSummary {
    totalRows: number;
    successCount: number;
    failedCount: number;
    failedRows: FailedRow[]; // Rows that failed during DB insertion
}

export type ImportUserMode = 'STRICT' | 'AUTO_CREATE';

export interface ImportOptions {
    userMode?: ImportUserMode;
}

export interface ImportStrategy {
    /**
     * Parse and Validate rows from the raw file data.
     * Returns a summary separating valid and invalid rows.
     */
    validate(rows: any[], schoolId: string, options?: ImportOptions): Promise<ValidationSummary>;

    /**
     * Execute the import for VALID rows.
     * Handles DB insertion and bridging logic.
     */
    execute(validRows: any[], context: { schoolId: string; userId: string; jobId: string; userMode?: ImportUserMode }): Promise<ExecutionSummary>;
}
