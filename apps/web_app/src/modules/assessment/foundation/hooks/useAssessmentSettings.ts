import { useState } from 'react';
import { useAssessmentConfiguration } from './useAssessmentConfiguration';
import { useWorkflowsList, useCreateWorkflow, useUpdateWorkflow, useDeleteWorkflow } from './useWorkflows';
import { useToast } from '../../../../components/ui/use-toast';

export function useAssessmentSettings() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<'general' | 'marking' | 'security' | 'workflows'>('general');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState<any | null>(null);

    const {
        configurations,
        configuration,
        isLoading: isConfigLoading,
        updateConfig,
        isUpdating: isConfigUpdating,
        resetConfig,
        isResetting: isConfigResetting
    } = useAssessmentConfiguration();

    const workflowsQuery = useWorkflowsList();
    const createWorkflowMutation = useCreateWorkflow();
    const updateWorkflowMutation = useUpdateWorkflow();
    const deleteWorkflowMutation = useDeleteWorkflow();

    const activeConfig = configurations[0] || null;

    const handleSaveConfig = async (payload: any) => {
        if (!activeConfig?.id) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No active configuration context found.'
            });
            return;
        }

        try {
            await updateConfig({
                configId: activeConfig.id,
                payload
            });
            toast({
                title: 'Success',
                description: 'Assessment configuration settings saved successfully.'
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.response?.data?.error || error.message || 'Failed to update settings.'
            });
        }
    };

    const handleResetConfig = async () => {
        if (!activeConfig?.id) return;
        try {
            await resetConfig(activeConfig.id);
            toast({
                title: 'Success',
                description: 'Configuration settings reset to default values.'
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message
            });
        }
    };

    return {
        activeTab,
        setActiveTab,
        dialogOpen,
        setDialogOpen,
        editingWorkflow,
        setEditingWorkflow,
        config: activeConfig,
        isLoading: isConfigLoading || workflowsQuery.isLoading,
        isSaving: isConfigUpdating || isConfigResetting,
        workflows: workflowsQuery.data || [],
        
        saveConfig: handleSaveConfig,
        resetConfig: handleResetConfig,
        createWorkflow: createWorkflowMutation.mutateAsync,
        updateWorkflow: updateWorkflowMutation.mutateAsync,
        deleteWorkflow: deleteWorkflowMutation.mutateAsync
    };
}
