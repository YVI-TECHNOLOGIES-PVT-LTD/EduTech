import { apiClient } from '../lib/api-client';

export interface Department {
    id: string;
    school_id: string;
    name: string;
    created_at: string;
}

export const departmentsApi = {
    getAll: async (): Promise<Department[]> => {
        const response = await apiClient.get<Department[]>('/admin/departments');
        return response.data;
    },

    create: async (name: string): Promise<Department> => {
        const response = await apiClient.post<Department>('/admin/departments', { name });
        return response.data;
    },

    update: async (id: string, name: string): Promise<Department> => {
        const response = await apiClient.put<Department>(`/admin/departments/${id}`, { name });
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/admin/departments/${id}`);
    }
};
