import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templateApi, TemplateItem } from '../services/template.api';

const TEMPLATE_LIST_KEY = ['assessment', 'templates', 'list'];
const TEMPLATE_DETAIL_KEY = ['assessment', 'templates', 'detail'];
const METRICS_QUERY_KEY = ['assessment', 'templates', 'metrics'];
const HISTORY_QUERY_KEY = ['assessment', 'templates', 'history'];

export function useTemplatesList(filters: any) {
    return useQuery({
        queryKey: [...TEMPLATE_LIST_KEY, filters],
        queryFn: () => templateApi.listTemplates(filters),
        placeholderData: (prev) => prev
    });
}

export function useTemplateDetail(id: string | undefined) {
    return useQuery({
        queryKey: [...TEMPLATE_DETAIL_KEY, id],
        queryFn: () => templateApi.getTemplateById(id!),
        enabled: !!id
    });
}

export function useTemplateEditor() {
    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: templateApi.createTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TEMPLATE_LIST_KEY });
            queryClient.invalidateQueries({ queryKey: METRICS_QUERY_KEY });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<TemplateItem> }) =>
            templateApi.updateTemplate(id, payload),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: TEMPLATE_LIST_KEY });
            queryClient.setQueryData([...TEMPLATE_DETAIL_KEY, variables.id], data);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: templateApi.deleteTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TEMPLATE_LIST_KEY });
            queryClient.invalidateQueries({ queryKey: METRICS_QUERY_KEY });
        }
    });

    const cloneMutation = useMutation({
        mutationFn: templateApi.cloneTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TEMPLATE_LIST_KEY });
        }
    });

    const saveLayoutMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: any }) => templateApi.saveLayout(id, payload),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: [...TEMPLATE_DETAIL_KEY, variables.id] });
        }
    });

    return {
        createTemplate: createMutation.mutateAsync,
        isCreating: createMutation.isPending,
        updateTemplate: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending,
        deleteTemplate: deleteMutation.mutateAsync,
        isDeleting: deleteMutation.isPending,
        cloneTemplate: cloneMutation.mutateAsync,
        isCloning: cloneMutation.isPending,
        saveLayout: saveLayoutMutation.mutateAsync,
        isSavingLayout: saveLayoutMutation.isPending
    };
}

export function useTemplateValidation(id: string) {
    return useQuery({
        queryKey: ['assessment', 'templates', 'validate', id],
        queryFn: () => templateApi.validateRules(id),
        enabled: !!id,
        staleTime: 5 * 1000
    });
}

export function useTemplateWorkflow() {
    const queryClient = useQueryClient();

    const transitionMutation = useMutation({
        mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
            templateApi.transitionStatus(id, { target_status: status, transition_reason: reason }),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: TEMPLATE_LIST_KEY });
            queryClient.invalidateQueries({ queryKey: [...TEMPLATE_DETAIL_KEY, variables.id] });
        }
    });

    return {
        transitionTemplate: transitionMutation.mutateAsync,
        isTransitioning: transitionMutation.isPending
    };
}

export function useTemplateAnalytics() {
    return useQuery({
        queryKey: METRICS_QUERY_KEY,
        queryFn: templateApi.getMetrics,
        staleTime: 10 * 60 * 1000
    });
}

export function useTemplateVersions(templateId: string) {
    const queryClient = useQueryClient();

    const historyQuery = useQuery({
        queryKey: [HISTORY_QUERY_KEY, templateId],
        queryFn: () => templateApi.getVersionsHistory(templateId),
        enabled: !!templateId,
        staleTime: 5 * 60 * 1000
    });

    const restoreMutation = useMutation({
        mutationFn: (versionNumber: number) => templateApi.restoreVersion(templateId, versionNumber),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TEMPLATE_LIST_KEY });
            queryClient.invalidateQueries({ queryKey: [...TEMPLATE_DETAIL_KEY, templateId] });
        }
    });

    return {
        versions: historyQuery.data || [],
        isLoading: historyQuery.isLoading,
        restoreVersion: restoreMutation.mutateAsync,
        isRestoring: restoreMutation.isPending
    };
}

// Backward Compatibility
export function useCreateTemplate() {
    const { createTemplate, isCreating } = useTemplateEditor();
    return { mutateAsync: createTemplate, isPending: isCreating };
}
export function useUpdateTemplate(id: string) {
    const { updateTemplate, isUpdating } = useTemplateEditor();
    return { mutateAsync: (payload: any) => updateTemplate({ id, payload }), isPending: isUpdating };
}
export function useDeleteTemplate() {
    const { deleteTemplate, isDeleting } = useTemplateEditor();
    return { mutateAsync: deleteTemplate, isPending: isDeleting };
}
export function useCloneTemplate() {
    const { cloneTemplate, isCloning } = useTemplateEditor();
    return { mutateAsync: cloneTemplate, isPending: isCloning };
}
export function usePublishTemplate(id: string) {
    const { transitionTemplate, isTransitioning } = useTemplateWorkflow();
    return { mutateAsync: () => transitionTemplate({ id, status: 'PUBLISHED' }), isPending: isTransitioning };
}
export function useUpdateTemplateSections(id: string) {
    const { updateTemplate, isUpdating } = useTemplateEditor();
    return { mutateAsync: (sections: any[]) => updateTemplate({ id, payload: { sections } }), isPending: isUpdating };
}
export function useTemplatePreview(id: string, format: string) {
    return useQuery({
        queryKey: ['assessment', 'templates', 'preview', id, format],
        queryFn: () => templateApi.getPreview(id, format),
        enabled: !!id && !!format,
        staleTime: 30 * 1000
    });
}
