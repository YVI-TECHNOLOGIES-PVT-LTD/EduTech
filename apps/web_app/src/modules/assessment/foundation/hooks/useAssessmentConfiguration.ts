import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assessmentApi, AssessmentConfig } from '../services/assessment.api';

const CONFIGS_QUERY_KEY = ['assessment', 'configurations'];

export function useAssessmentConfiguration(id?: string) {
    const queryClient = useQueryClient();

    // Query for listing all configurations
    const listQuery = useQuery({
        queryKey: CONFIGS_QUERY_KEY,
        queryFn: assessmentApi.listConfigurations,
        staleTime: 5 * 60 * 1000,
    });

    // Query for single configuration details
    const detailQuery = useQuery({
        queryKey: [...CONFIGS_QUERY_KEY, id],
        queryFn: () => assessmentApi.getConfigurationById(id!),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });

    // Mutation to create a configuration
    const createMutation = useMutation({
        mutationFn: (payload: Partial<AssessmentConfig>) => assessmentApi.createConfiguration(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CONFIGS_QUERY_KEY });
        }
    });

    // Mutation to update a configuration
    const updateMutation = useMutation({
        mutationFn: ({ configId, payload }: { configId: string; payload: Partial<AssessmentConfig> }) =>
            assessmentApi.updateConfiguration(configId, payload),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: CONFIGS_QUERY_KEY });
            queryClient.setQueryData([...CONFIGS_QUERY_KEY, variables.configId], data);
        }
    });

    // Mutation to delete a configuration
    const deleteMutation = useMutation({
        mutationFn: (configId: string) => assessmentApi.deleteConfiguration(configId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CONFIGS_QUERY_KEY });
        }
    });

    // Mutation to clone a configuration
    const cloneMutation = useMutation({
        mutationFn: (configId: string) => assessmentApi.cloneConfiguration(configId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CONFIGS_QUERY_KEY });
        }
    });

    // Mutation to reset a configuration
    const resetMutation = useMutation({
        mutationFn: (configId: string) => assessmentApi.resetConfiguration(configId),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: CONFIGS_QUERY_KEY });
            queryClient.setQueryData([...CONFIGS_QUERY_KEY, variables], data);
        }
    });

    return {
        configurations: listQuery.data || [],
        configuration: detailQuery.data || null,
        isLoading: listQuery.isLoading || detailQuery.isLoading,
        isError: listQuery.isError || detailQuery.isError,
        
        createConfig: createMutation.mutateAsync,
        isCreating: createMutation.isPending,
        
        updateConfig: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending,
        
        deleteConfig: deleteMutation.mutateAsync,
        isDeleting: deleteMutation.isPending,

        cloneConfig: cloneMutation.mutateAsync,
        isCloning: cloneMutation.isPending,

        resetConfig: resetMutation.mutateAsync,
        isResetting: resetMutation.isPending,
    };
}
