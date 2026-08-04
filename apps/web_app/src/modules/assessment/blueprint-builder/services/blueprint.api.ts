import { apiClient } from '../../../../lib/api-client';

export interface BlueprintSectionRule {
    id?: string;
    filter_field: string;
    filter_value: string;
    match_operator: string;
}

export interface BlueprintSection {
    id?: string;
    section_name: string;
    description?: string | null;
    points_per_question: number;
    negative_marks: number;
    total_questions: number;
    sort_order: number;
    rules: BlueprintSectionRule[];
}

export interface BlueprintItem {
    id: string;
    school_id: string;
    subject_id: string;
    name: string;
    description?: string | null;
    total_marks: number;
    difficulty_distribution: Record<string, number>;
    bloom_distribution: Record<string, number>;
    outcome_mapping: Record<string, string>;
    status: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';
    version: number;
    parent_id?: string | null;
    created_by?: string | null;
    created_at: string;
    updated_at: string;
    sections: BlueprintSection[];
}

export interface ValidationReport {
    success: boolean;
    errors: string[];
    warnings: string[];
}

export interface BlueprintMetrics {
    totalBlueprints: number;
    statusDistribution: Record<string, number>;
    subjectDistribution: Record<string, number>;
}

export const blueprintApi = {
    listBlueprints: async (filters: any) => {
        const { data } = await apiClient.get<{ data: BlueprintItem[]; totalCount: number }>('/v1/assessment/blueprints', {
            params: filters
        });
        return data;
    },
    getBlueprintById: async (id: string) => {
        const { data } = await apiClient.get<BlueprintItem>(`/v1/assessment/blueprints/${id}`);
        return data;
    },
    createBlueprint: async (payload: Partial<BlueprintItem>) => {
        const { data } = await apiClient.post<BlueprintItem>('/v1/assessment/blueprints', payload);
        return data;
    },
    updateBlueprint: async (id: string, payload: Partial<BlueprintItem>) => {
        const { data } = await apiClient.put<BlueprintItem>(`/v1/assessment/blueprints/${id}`, payload);
        return data;
    },
    deleteBlueprint: async (id: string) => {
        const { data } = await apiClient.delete<{ message: string }>(`/v1/assessment/blueprints/${id}`);
        return data;
    },
    cloneBlueprint: async (id: string, name: string) => {
        const { data } = await apiClient.post<BlueprintItem>(`/v1/assessment/blueprints/${id}/clone`, { name });
        return data;
    },
    validateBlueprint: async (payload: Partial<BlueprintItem>) => {
        const { data } = await apiClient.post<ValidationReport>('/v1/assessment/blueprints/validate', payload);
        return data;
    },
    getHistory: async (id: string) => {
        const { data } = await apiClient.get<BlueprintItem[]>(`/v1/assessment/blueprints/${id}/versions`);
        return data;
    },
    restoreVersion: async (id: string, versionNumber: number) => {
        const { data } = await apiClient.post<BlueprintItem>(`/v1/assessment/blueprints/${id}/versions/restore`, { versionNumber });
        return data;
    },
    transitionStatus: async (id: string, payload: { target_status: string; transition_reason?: string }) => {
        const { data } = await apiClient.post<BlueprintItem>(`/v1/assessment/blueprints/${id}/workflow/transition`, payload);
        return data;
    },
    getMetrics: async () => {
        const { data } = await apiClient.get<BlueprintMetrics>('/v1/assessment/blueprints/analytics');
        return data;
    }
};
export default blueprintApi;
