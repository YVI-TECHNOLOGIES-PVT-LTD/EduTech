import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { questionApi, QuestionItem, QuestionAsset, FolderNode } from '../services/question.api';
import { supabase } from '../../../../lib/supabase';
import { useState } from 'react';

const FOLDER_QUERY_KEY = ['assessment', 'questions', 'folders'];
const QUESTION_QUERY_KEY = ['assessment', 'questions', 'list'];
const ASSET_QUERY_KEY = ['assessment', 'questions', 'assets'];
const VERSION_QUERY_KEY = ['assessment', 'questions', 'versions'];

export function useSubjectsList() {
    return useQuery({
        queryKey: ['assessment', 'subjects', 'list'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('subjects')
                .select('id, name, code')
                .order('name');
            if (error) throw error;
            return data || [];
        },
        staleTime: 10 * 60 * 1000
    });
}

export function useActiveAcademicYear() {
    return useQuery({
        queryKey: ['assessment', 'academic-years', 'active'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('academic_years')
                .select('id, year_label')
                .eq('is_active', true)
                .limit(1)
                .maybeSingle();
            if (error) throw error;
            return data;
        },
        staleTime: 10 * 60 * 1000
    });
}

// ==========================================
// 1. useQuestions & useQuestion
// ==========================================
export function useQuestions(filters: any) {
    return useQuery({
        queryKey: [QUESTION_QUERY_KEY, filters],
        queryFn: () => questionApi.listQuestions(filters),
        staleTime: 1 * 60 * 1000
    });
}

export function useQuestion(id: string) {
    return useQuery({
        queryKey: ['assessment', 'questions', 'detail', id],
        queryFn: () => questionApi.getQuestionById(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000
    });
}

// ==========================================
// 2. useQuestionFolders
// ==========================================
export function useQuestionFolders() {
    const queryClient = useQueryClient();

    const listQuery = useQuery({
        queryKey: FOLDER_QUERY_KEY,
        queryFn: questionApi.listFolders,
        staleTime: 5 * 60 * 1000
    });

    const statsQuery = useQuery({
        queryKey: [...FOLDER_QUERY_KEY, 'stats'],
        queryFn: questionApi.getFolderStats,
        staleTime: 5 * 60 * 1000
    });

    const createMutation = useMutation({
        mutationFn: questionApi.createFolder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FOLDER_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: [...FOLDER_QUERY_KEY, 'stats'] });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, name }: { id: string; name: string }) => questionApi.updateFolder(id, { name }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FOLDER_QUERY_KEY });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: questionApi.deleteFolder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FOLDER_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: [...FOLDER_QUERY_KEY, 'stats'] });
        }
    });

    const moveMutation = useMutation({
        mutationFn: questionApi.bulkMoveQuestions,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUESTION_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: [...FOLDER_QUERY_KEY, 'stats'] });
        }
    });

    const copyMutation = useMutation({
        mutationFn: questionApi.bulkCopyQuestions,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUESTION_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: [...FOLDER_QUERY_KEY, 'stats'] });
        }
    });

    return {
        folders: listQuery.data || [],
        stats: statsQuery.data || null,
        isLoading: listQuery.isLoading || statsQuery.isLoading,
        createFolder: createMutation.mutateAsync,
        updateFolder: updateMutation.mutateAsync,
        deleteFolder: deleteMutation.mutateAsync,
        bulkMoveQuestions: moveMutation.mutateAsync,
        bulkCopyQuestions: copyMutation.mutateAsync
    };
}

// ==========================================
// 3. useQuestionAssets
// ==========================================
export function useQuestionAssets(questionId?: string) {
    const queryClient = useQueryClient();

    const assetsQuery = useQuery({
        queryKey: [ASSET_QUERY_KEY, questionId],
        queryFn: () => questionApi.getQuestionAssets(questionId!),
        enabled: !!questionId,
        staleTime: 5 * 60 * 1000
    });

    const uploadMutation = useMutation({
        mutationFn: questionApi.uploadAsset,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [ASSET_QUERY_KEY, questionId] });
        }
    });

    const linkMutation = useMutation({
        mutationFn: questionApi.linkAsset,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [ASSET_QUERY_KEY, questionId] });
        }
    });

    const unlinkMutation = useMutation({
        mutationFn: questionApi.unlinkAsset,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [ASSET_QUERY_KEY, questionId] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: questionApi.deleteAsset,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [ASSET_QUERY_KEY, questionId] });
        }
    });

    return {
        assets: assetsQuery.data || [],
        isLoading: assetsQuery.isLoading,
        uploadAsset: uploadMutation.mutateAsync,
        linkAsset: linkMutation.mutateAsync,
        unlinkAsset: unlinkMutation.mutateAsync,
        deleteAsset: deleteMutation.mutateAsync
    };
}

// ==========================================
// 4. useQuestionSearch
// ==========================================
export function useQuestionSearch(filters: any) {
    return useQuery({
        queryKey: ['assessment', 'questions', 'search', filters],
        queryFn: () => questionApi.searchQuestions(filters),
        enabled: !!filters,
        staleTime: 1 * 60 * 1000
    });
}

// ==========================================
// 5. useQuestionWorkflow
// ==========================================
export function useQuestionWorkflow() {
    const queryClient = useQueryClient();

    const transitionMutation = useMutation({
        mutationFn: ({ id, definitionId, status, reason }: { id: string; definitionId: string; status: string; reason?: string }) =>
            questionApi.transitionQuestion(id, { workflow_definition_id: definitionId, target_status: status, transition_reason: reason }),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: QUESTION_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ['assessment', 'questions', 'detail', variables.id] });
        }
    });

    return {
        transitionQuestion: transitionMutation.mutateAsync,
        isTransitioning: transitionMutation.isPending
    };
}

// ==========================================
// 6. useQuestionVersions
// ==========================================
export function useQuestionVersions(questionId: string) {
    const queryClient = useQueryClient();

    const historyQuery = useQuery({
        queryKey: [VERSION_QUERY_KEY, questionId],
        queryFn: () => questionApi.getVersionsHistory(questionId),
        enabled: !!questionId,
        staleTime: 5 * 60 * 1000
    });

    const restoreMutation = useMutation({
        mutationFn: (versionNumber: number) => questionApi.restoreVersion(questionId, versionNumber),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUESTION_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ['assessment', 'questions', 'detail', questionId] });
            queryClient.invalidateQueries({ queryKey: [VERSION_QUERY_KEY, questionId] });
        }
    });

    return {
        versions: historyQuery.data || [],
        isLoading: historyQuery.isLoading,
        restoreVersion: restoreMutation.mutateAsync,
        isRestoring: restoreMutation.isPending
    };
}

// ==========================================
// 7. useQuestionEditor
// ==========================================
export function useQuestionEditor() {
    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: questionApi.createQuestion,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUESTION_QUERY_KEY });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<QuestionItem> }) =>
            questionApi.updateQuestion(id, payload),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: QUESTION_QUERY_KEY });
            queryClient.setQueryData(['assessment', 'questions', 'detail', variables.id], data);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: questionApi.deleteQuestion,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUESTION_QUERY_KEY });
        }
    });

    const importMutation = useMutation({
        mutationFn: questionApi.importQuestions,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUESTION_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: FOLDER_QUERY_KEY });
        }
    });

    return {
        createQuestion: createMutation.mutateAsync,
        isCreating: createMutation.isPending,
        updateQuestion: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending,
        deleteQuestion: deleteMutation.mutateAsync,
        isDeleting: deleteMutation.isPending,
        importQuestions: importMutation.mutateAsync,
        isImporting: importMutation.isPending
    };
}

// ==========================================
// Backward Compatibility queries
// ==========================================
export function useQuestionsList(filters: any) {
    return useQuestions(filters);
}
export function useQuestionDetail(id: string) {
    return useQuestion(id);
}
export function useCreateQuestion() {
    const { createQuestion, isCreating } = useQuestionEditor();
    return { mutateAsync: createQuestion, isPending: isCreating };
}
export function useUpdateQuestion() {
    const { updateQuestion, isUpdating } = useQuestionEditor();
    return { mutateAsync: updateQuestion, isPending: isUpdating };
}
export function useDeleteQuestion() {
    const { deleteQuestion, isDeleting } = useQuestionEditor();
    return { mutateAsync: deleteQuestion, isPending: isDeleting };
}
export function useImportQuestions() {
    const { importQuestions, isImporting } = useQuestionEditor();
    return { mutateAsync: importQuestions, isPending: isImporting };
}
