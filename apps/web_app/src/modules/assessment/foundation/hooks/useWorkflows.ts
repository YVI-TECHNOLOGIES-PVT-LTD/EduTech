import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assessmentApi, WorkflowDefinition } from '../services/assessment.api';

const WORKFLOW_QUERY_KEY = ['assessment', 'workflows'];

export function useWorkflowsList() {
    return useQuery({
        queryKey: WORKFLOW_QUERY_KEY,
        queryFn: assessmentApi.listWorkflows,
        staleTime: 2 * 60 * 1000
    });
}

export function useWorkflowDetail(id: string) {
    return useQuery({
        queryKey: [...WORKFLOW_QUERY_KEY, id],
        queryFn: () => assessmentApi.getWorkflowById(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000
    });
}

export function useCreateWorkflow() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: Omit<Partial<WorkflowDefinition>, 'id' | 'version' | 'created_at' | 'updated_at'>) =>
            assessmentApi.createWorkflow(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: WORKFLOW_QUERY_KEY });
        }
    });
}

export function useUpdateWorkflow() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<WorkflowDefinition> }) =>
            assessmentApi.updateWorkflow(id, payload),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: WORKFLOW_QUERY_KEY });
            queryClient.setQueryData([...WORKFLOW_QUERY_KEY, variables.id], data);
        }
    });
}

export function useDeleteWorkflow() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => assessmentApi.deleteWorkflow(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: WORKFLOW_QUERY_KEY });
        }
    });
}
