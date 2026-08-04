import { apiClient } from '../lib/api-client';

export interface ImportJob {
    id: string;
    entity_type: string;
    total_rows: number;
    success_count: number;
    failed_count: number;
    status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
    created_at: string;
    failed_rows?: any;
}

export const importHistoryApi = {
    getImportHistory: async () => {
        const response = await apiClient.get<ImportJob[]>('/import/history');
        return response.data;
    },

    downloadFailedRows: async (jobId: string) => {
        const response = await apiClient.get(`/import/history/${jobId}/failed-rows`, {
            responseType: 'blob', // Important for file download
        });

        // Trigger browser download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `failed_rows_${jobId}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    },

    getFailedRowsFile: async (jobId: string): Promise<File> => {
        const response = await apiClient.get(`/import/history/${jobId}/failed-rows`, {
            responseType: 'blob'
        });
        return new File([response.data], `failed_rows_${jobId}.csv`, { type: 'text/csv' });
    }
};
