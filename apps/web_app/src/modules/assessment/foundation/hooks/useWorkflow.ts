import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assessmentApi, WorkflowStep, WorkflowTransition } from '../services/assessment.api';

const WORKFLOW_QUERY_KEY = ['assessment', 'workflows'];

export function useWorkflow(workflowId?: string) {
    const queryClient = useQueryClient();

    // Query steps list
    const stepsQuery = useQuery({
        queryKey: [...WORKFLOW_QUERY_KEY, workflowId, 'steps'],
        queryFn: () => assessmentApi.getWorkflowSteps(workflowId!),
        enabled: !!workflowId,
        staleTime: 5 * 60 * 1000
    });

    // Query transitions list
    const transitionsQuery = useQuery({
        queryKey: [...WORKFLOW_QUERY_KEY, workflowId, 'transitions'],
        queryFn: () => assessmentApi.getWorkflowTransitions(workflowId!),
        enabled: !!workflowId,
        staleTime: 5 * 60 * 1000
    });

    // Add Step Mutation
    const addStepMutation = useMutation({
        mutationFn: (payload: Partial<WorkflowStep>) => assessmentApi.addWorkflowStep(workflowId!, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...WORKFLOW_QUERY_KEY, workflowId, 'steps'] });
        }
    });

    // Update Step Mutation
    const updateStepMutation = useMutation({
        mutationFn: ({ stepId, payload }: { stepId: string; payload: Partial<WorkflowStep> }) =>
            assessmentApi.updateWorkflowStep(stepId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...WORKFLOW_QUERY_KEY, workflowId, 'steps'] });
        }
    });

    // Delete Step Mutation
    const deleteStepMutation = useMutation({
        mutationFn: (stepId: string) => assessmentApi.deleteWorkflowStep(stepId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...WORKFLOW_QUERY_KEY, workflowId, 'steps'] });
        }
    });

    // Add Transition Mutation
    const addTransitionMutation = useMutation({
        mutationFn: (payload: Partial<WorkflowTransition>) => assessmentApi.addWorkflowTransition(workflowId!, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...WORKFLOW_QUERY_KEY, workflowId, 'transitions'] });
        }
    });

    // Update Transition Mutation
    const updateTransitionMutation = useMutation({
        mutationFn: ({ transitionId, payload }: { transitionId: string; payload: Partial<WorkflowTransition> }) =>
            assessmentApi.updateWorkflowTransition(transitionId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...WORKFLOW_QUERY_KEY, workflowId, 'transitions'] });
        }
    });

    // Delete Transition Mutation
    const deleteTransitionMutation = useMutation({
        mutationFn: (transitionId: string) => assessmentApi.deleteWorkflowTransition(transitionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...WORKFLOW_QUERY_KEY, workflowId, 'transitions'] });
        }
    });

    return {
        steps: stepsQuery.data || [],
        transitions: transitionsQuery.data || [],
        isLoading: stepsQuery.isLoading || transitionsQuery.isLoading,

        addStep: addStepMutation.mutateAsync,
        isAddingStep: addStepMutation.isPending,

        updateStep: updateStepMutation.mutateAsync,
        isUpdatingStep: updateStepMutation.isPending,

        deleteStep: deleteStepMutation.mutateAsync,
        isDeletingStep: deleteStepMutation.isPending,

        addTransition: addTransitionMutation.mutateAsync,
        isAddingTransition: addTransitionMutation.isPending,

        updateTransition: updateTransitionMutation.mutateAsync,
        isUpdatingTransition: updateTransitionMutation.isPending,

        deleteTransition: deleteTransitionMutation.mutateAsync,
        isDeletingTransition: deleteTransitionMutation.isPending
    };
}
