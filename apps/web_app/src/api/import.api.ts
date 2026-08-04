import { apiClient } from '../lib/api-client';

export interface ValidationSummary {
    isValid: boolean;
    totalRows: number;
    validRows: any[];
    failedRows: { row: number, errors: any[], data: any }[];
}

export interface ExecutionSummary {
    totalRows: number;
    successCount: number;
    failedCount: number;
    failedRows: any[];
}

export const importApi = {
    uploadImportFile: async (file: File, entityType: string, schoolId: string, options?: { userMode?: string }): Promise<ValidationSummary> => {
        const formData = new FormData();
        formData.append('entityType', entityType);
        formData.append('schoolId', schoolId);
        formData.append('file', file);
        if (options?.userMode) {
            formData.append('userMode', options.userMode);
        }

        const response = await apiClient.post<ValidationSummary>('/import/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    executeImport: async (rows: any[], entityType: string, schoolId: string, options?: { userMode?: string }): Promise<{ jobId: string, summary: ExecutionSummary }> => {
        const response = await apiClient.post<{ jobId: string, summary: ExecutionSummary }>('/import/execute', {
            entityType,
            rows,
            schoolId,
            userMode: options?.userMode
        }, {
            timeout: 300000 // 5 minutes timeout for bulk operations
        });
        return response.data;
    }
};
