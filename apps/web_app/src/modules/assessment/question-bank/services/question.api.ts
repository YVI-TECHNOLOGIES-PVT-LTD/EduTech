import { apiClient } from '../../../../lib/api-client';

export interface FolderNode {
    id: string;
    school_id: string;
    parent_id: string | null;
    name: string;
    created_at: string;
    updated_at: string;
}

export interface QuestionOption {
    id?: string;
    option_text: string;
    is_correct: boolean;
}

export interface QuestionAsset {
    id: string;
    school_id: string;
    file_name: string;
    file_path: string;
    mime_type: string;
    file_size: number;
    created_at: string;
}

export interface QuestionItem {
    id: string;
    school_id: string;
    academic_year_id: string;
    folder_id: string | null;
    subject_id: string;
    question_text: string;
    question_type: string; // Extensible format
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    bloom_level: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
    points: number;
    negative_marks: number;
    explanation?: string | null;
    course_outcome_code?: string | null;
    program_outcome_code?: string | null;
    lesson_id?: string | null;
    taxonomy_tags: string[];
    version: number;
    status: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';
    parent_id?: string | null;
    options: QuestionOption[];
    created_at: string;
    updated_at: string;
}

export interface ImportSummary {
    successCount: number;
    errors: { row: number; error: string }[];
}

export interface FolderStats {
    totalQuestions: number;
    statusCounts: Record<string, number>;
    difficultyDistribution: Record<string, number>;
}

export const questionApi = {
    // Folders
    listFolders: async () => {
        const { data } = await apiClient.get<FolderNode[]>('/v1/assessment/questions/folders');
        return data;
    },
    createFolder: async (payload: { name: string; parent_id?: string | null }) => {
        const { data } = await apiClient.post<FolderNode>('/v1/assessment/questions/folders', payload);
        return data;
    },
    updateFolder: async (id: string, payload: { name: string }) => {
        const { data } = await apiClient.put<FolderNode>(`/v1/assessment/questions/folders/${id}`, payload);
        return data;
    },
    deleteFolder: async (id: string) => {
        const { data } = await apiClient.delete<{ message: string }>(`/v1/assessment/questions/folders/${id}`);
        return data;
    },
    getFolderStats: async () => {
        const { data } = await apiClient.get<FolderStats>('/v1/assessment/questions/folders/stats');
        return data;
    },
    bulkMoveQuestions: async (payload: { questionIds: string[]; targetFolderId: string | null }) => {
        const { data } = await apiClient.post<{ message: string }>('/v1/assessment/questions/folders/move', payload);
        return data;
    },
    bulkCopyQuestions: async (payload: { questionIds: string[]; targetFolderId: string | null }) => {
        const { data } = await apiClient.post<{ message: string }>('/v1/assessment/questions/folders/copy', payload);
        return data;
    },

    // Questions CRUD
    listQuestions: async (filters: any) => {
        const { data } = await apiClient.get<{ data: QuestionItem[]; totalCount: number }>('/v1/assessment/questions', {
            params: filters
        });
        return data;
    },
    searchQuestions: async (filters: any) => {
        const { data } = await apiClient.get<{ data: QuestionItem[]; totalCount: number }>('/v1/assessment/questions/search', {
            params: filters
        });
        return data;
    },
    getQuestionById: async (id: string) => {
        const { data } = await apiClient.get<QuestionItem>(`/v1/assessment/questions/${id}`);
        return data;
    },
    createQuestion: async (payload: Partial<QuestionItem>) => {
        const { data } = await apiClient.post<QuestionItem>('/v1/assessment/questions', payload);
        return data;
    },
    updateQuestion: async (id: string, payload: Partial<QuestionItem>) => {
        const { data } = await apiClient.put<QuestionItem>(`/v1/assessment/questions/${id}`, payload);
        return data;
    },
    deleteQuestion: async (id: string) => {
        const { data } = await apiClient.delete<{ message: string }>(`/v1/assessment/questions/${id}`);
        return data;
    },

    // Ingestion
    importQuestions: async (payload: { academicYearId: string; subjectId: string; folderId?: string | null; csv: string }) => {
        const { data } = await apiClient.post<ImportSummary>('/v1/assessment/questions/import', payload);
        return data;
    },

    // Assets
    uploadAsset: async (payload: { file_name: string; file_path: string; mime_type: string; file_size: number }) => {
        const { data } = await apiClient.post<QuestionAsset>('/v1/assessment/questions/assets', payload);
        return data;
    },
    linkAsset: async (payload: { questionId: string; assetId: string }) => {
        const { data } = await apiClient.post<{ message: string }>('/v1/assessment/questions/assets/link', payload);
        return data;
    },
    unlinkAsset: async (payload: { questionId: string; assetId: string }) => {
        const { data } = await apiClient.post<{ message: string }>('/v1/assessment/questions/assets/unlink', payload);
        return data;
    },
    getQuestionAssets: async (questionId: string) => {
        const { data } = await apiClient.get<QuestionAsset[]>(`/v1/assessment/questions/${questionId}/assets`);
        return data;
    },
    deleteAsset: async (assetId: string) => {
        const { data } = await apiClient.delete<{ message: string }>(`/v1/assessment/questions/assets/${assetId}`);
        return data;
    },

    // Versions
    getVersionsHistory: async (id: string) => {
        const { data } = await apiClient.get<QuestionItem[]>(`/v1/assessment/questions/${id}/versions`);
        return data;
    },
    restoreVersion: async (id: string, versionNumber: number) => {
        const { data } = await apiClient.post<QuestionItem>(`/v1/assessment/questions/${id}/versions/restore`, { versionNumber });
        return data;
    },

    // Workflow
    transitionQuestion: async (id: string, payload: { workflow_definition_id: string; target_status: string; transition_reason?: string }) => {
        const { data } = await apiClient.post<QuestionItem>(`/v1/assessment/questions/${id}/workflow/transition`, payload);
        return data;
    }
};
export default questionApi;
