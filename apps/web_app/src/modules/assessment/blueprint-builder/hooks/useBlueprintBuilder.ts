import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blueprintApi, BlueprintItem, BlueprintMetrics, ValidationReport } from '../services/blueprint.api';

const BLUEPRINT_QUERY_KEY = ['assessment', 'blueprints', 'list'];
const METRICS_QUERY_KEY = ['assessment', 'blueprints', 'metrics'];
const HISTORY_QUERY_KEY = ['assessment', 'blueprints', 'history'];

export function useBlueprints(filters: any) {
    return useQuery({
        queryKey: [BLUEPRINT_QUERY_KEY, filters],
        queryFn: () => blueprintApi.listBlueprints(filters),
        staleTime: 5 * 60 * 1000
    });
}

export function useBlueprint(id: string) {
    return useQuery({
        queryKey: ['assessment', 'blueprints', 'detail', id],
        queryFn: () => blueprintApi.getBlueprintById(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000
    });
}

export function useBlueprintEditor() {
    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: blueprintApi.createBlueprint,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BLUEPRINT_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: METRICS_QUERY_KEY });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<BlueprintItem> }) =>
            blueprintApi.updateBlueprint(id, payload),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: BLUEPRINT_QUERY_KEY });
            queryClient.setQueryData(['assessment', 'blueprints', 'detail', variables.id], data);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: blueprintApi.deleteBlueprint,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BLUEPRINT_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: METRICS_QUERY_KEY });
        }
    });

    const cloneMutation = useMutation({
        mutationFn: ({ id, name }: { id: string; name: string }) => blueprintApi.cloneBlueprint(id, name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BLUEPRINT_QUERY_KEY });
        }
    });

    return {
        createBlueprint: createMutation.mutateAsync,
        isCreating: createMutation.isPending,
        updateBlueprint: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending,
        deleteBlueprint: deleteMutation.mutateAsync,
        isDeleting: deleteMutation.isPending,
        cloneBlueprint: cloneMutation.mutateAsync,
        isCloning: cloneMutation.isPending
    };
}

export function useBlueprintValidation() {
    const validateMutation = useMutation({
        mutationFn: blueprintApi.validateBlueprint
    });

    return {
        validateBlueprint: validateMutation.mutateAsync,
        isValidating: validateMutation.isPending
    };
}

export function useBlueprintWorkflow() {
    const queryClient = useQueryClient();

    const transitionMutation = useMutation({
        mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
            blueprintApi.transitionStatus(id, { target_status: status, transition_reason: reason }),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: BLUEPRINT_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ['assessment', 'blueprints', 'detail', variables.id] });
        }
    });

    return {
        transitionBlueprint: transitionMutation.mutateAsync,
        isTransitioning: transitionMutation.isPending
    };
}

export function useBlueprintAnalytics() {
    return useQuery({
        queryKey: METRICS_QUERY_KEY,
        queryFn: blueprintApi.getMetrics,
        staleTime: 10 * 60 * 1000
    });
}

export function useBlueprintVersions(blueprintId: string) {
    const queryClient = useQueryClient();

    const historyQuery = useQuery({
        queryKey: [HISTORY_QUERY_KEY, blueprintId],
        queryFn: () => blueprintApi.getHistory(blueprintId),
        enabled: !!blueprintId,
        staleTime: 5 * 60 * 1000
    });

    const restoreMutation = useMutation({
        mutationFn: (versionNumber: number) => blueprintApi.restoreVersion(blueprintId, versionNumber),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BLUEPRINT_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ['assessment', 'blueprints', 'detail', blueprintId] });
        }
    });

    return {
        versions: historyQuery.data || [],
        isLoading: historyQuery.isLoading,
        restoreVersion: restoreMutation.mutateAsync,
        isRestoring: restoreMutation.isPending
    };
}
