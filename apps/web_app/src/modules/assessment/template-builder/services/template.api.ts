import { apiClient } from '../../../../lib/api-client';

export interface TemplateRule {
    id?: string;
    section_id?: string;
    filter_field: 'difficulty' | 'bloom_level' | 'tags' | 'course_outcome' | 'program_outcome';
    filter_value: string;
    match_operator: 'eq' | 'in' | 'like';
}

export interface TemplateSection {
    id?: string;
    template_id?: string;
    section_name: string;
    description?: string | null;
    points_per_question: number;
    negative_marks: number;
    total_questions: number;
    sort_order: number;
    rules: TemplateRule[];
}

export interface TemplateHeaderConfig {
    institution_logo: boolean;
    school_name: boolean;
    exam_name: boolean;
    subject: boolean;
    class: boolean;
    academic_year: boolean;
    exam_date: boolean;
    duration: boolean;
    max_marks: boolean;
    student_name: boolean;
    hall_ticket: boolean;
    signature_block: boolean;
    qr_code: boolean;
    barcode: boolean;
}

export interface TemplateFooterConfig {
    invigilator_signature: boolean;
    chief_superintendent: boolean;
    generated_timestamp: boolean;
    page_number: boolean;
    confidential_watermark: boolean;
    qr_verification: boolean;
    instructions_footer: boolean;
}

export interface TemplateLayoutRule {
    property: string;
    value: string;
}

export interface TemplateItem {
    id: string;
    school_id: string;
    subject_id: string;
    blueprint_id?: string | null;
    name: string;
    description?: string | null;
    instructions?: string;
    version: number;
    status: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
    sections?: TemplateSection[];
    layoutRules?: TemplateLayoutRule[];
    header?: TemplateHeaderConfig | null;
    footer?: TemplateFooterConfig | null;
}

export interface TemplateMetrics {
    totalTemplates: number;
    statusDistribution: Record<string, number>;
}

export const templateApi = {
    listTemplates: async (params: { subjectId?: string; blueprintId?: string; page: number; limit: number }) => {
        const { data } = await apiClient.get<{ data: TemplateItem[]; totalCount: number }>('/v1/assessment/templates', { params });
        return data;
    },

    getTemplateById: async (id: string) => {
        const { data } = await apiClient.get<TemplateItem>(`/v1/assessment/templates/${id}`);
        return data;
    },

    createTemplate: async (payload: Partial<TemplateItem>) => {
        const { data } = await apiClient.post<TemplateItem>('/v1/assessment/templates', payload);
        return data;
    },

    updateTemplate: async (id: string, payload: Partial<TemplateItem>) => {
        const { data } = await apiClient.put<TemplateItem>(`/v1/assessment/templates/${id}`, payload);
        return data;
    },

    deleteTemplate: async (id: string) => {
        await apiClient.delete(`/v1/assessment/templates/${id}`);
    },

    updateTemplateSections: async (id: string, sections: TemplateSection[]) => {
        const { data } = await apiClient.post<TemplateItem>(`/v1/assessment/templates/${id}/sections`, { sections });
        return data;
    },

    publishTemplate: async (id: string) => {
        const { data } = await apiClient.post<TemplateItem & { warnings?: string[] }>(`/v1/assessment/templates/${id}/publish`);
        return data;
    },

    cloneTemplate: async (id: string) => {
        const { data } = await apiClient.post<TemplateItem>(`/v1/assessment/templates/${id}/clone`);
        return data;
    },

    // Layout configuration save
    saveLayout: async (id: string, payload: { layoutRules: TemplateLayoutRule[]; header: Partial<TemplateHeaderConfig>; footer: Partial<TemplateFooterConfig>; instructions?: string }) => {
        const { data } = await apiClient.post<{ message: string }>(`/v1/assessment/templates/${id}/layout`, payload);
        return data;
    },

    // Preview Generator
    getPreview: async (id: string, format: string) => {
        const { data } = await apiClient.get<{ html: string }>(`/v1/assessment/templates/${id}/preview`, { params: { format } });
        return data;
    },

    // Validate rules
    validateRules: async (id: string) => {
        const { data } = await apiClient.get<{ success: boolean; errors: string[]; warnings: string[] }>(`/v1/assessment/templates/${id}/validate`);
        return data;
    },

    // History Timeline
    getVersionsHistory: async (id: string) => {
        const { data } = await apiClient.get<any[]>(`/v1/assessment/templates/${id}/versions`);
        return data;
    },

    restoreVersion: async (id: string, versionNumber: number) => {
        const { data } = await apiClient.post<TemplateItem>(`/v1/assessment/templates/${id}/versions/restore`, { versionNumber });
        return data;
    },

    transitionStatus: async (id: string, payload: { target_status: string; transition_reason?: string }) => {
        const { data } = await apiClient.post<TemplateItem>(`/v1/assessment/templates/${id}/workflow/transition`, payload);
        return data;
    },

    getMetrics: async () => {
        const { data } = await apiClient.get<TemplateMetrics>('/v1/assessment/templates/analytics');
        return data;
    }
};

export default templateApi;
