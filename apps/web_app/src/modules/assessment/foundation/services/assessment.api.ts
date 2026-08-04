import { apiClient } from '../../../../lib/api-client';

export interface AssessmentConfig {
    id?: string;
    school_id?: string;
    max_upload_size_mb: number;
    autosave_interval_secs: number;
    default_heartbeat_secs: number;
    timezone: string;
    grading_scale: any[];
    retention_telemetry_days: number;
    retention_attempts_years: number;
    settings: {
        assessmentTypes: string[];
        durationMinutes: number;
        passingMarks: number;
        negativeMarking: boolean;
        negativeMarkingValue: number;
        autoSave: boolean;
        shuffleQuestions: boolean;
        shuffleOptions: boolean;
        browserLock: boolean;
        fullscreenEnforcement: boolean;
        resumePolicy: string;
        attemptLimit: number;
        proctoring: {
            enabled: boolean;
            webcam: boolean;
            microphone: boolean;
            screenShare: boolean;
            aiVerification: boolean;
        };
        publishingRules: {
            autoPublish: boolean;
            releaseGradesImmediately: boolean;
        };
        notifications: {
            emailOnScheduled: boolean;
            emailOnGraded: boolean;
        };
        lateSubmission: {
            allowed: boolean;
            gracePeriodMinutes: number;
            penaltyPercentagePerMinute: number;
        };
        evaluationType: string;
        resultVisibility: string;
        version: number;
        status: string;
    };
}

export interface WorkflowStep {
    id?: string;
    step_name: string;
    role_required: string;
    sort_order: number;
}

export interface WorkflowTransition {
    id?: string;
    from_status: string;
    to_status: string;
    rule_condition?: string | null;
}

export interface WorkflowDefinition {
    id: string;
    school_id: string;
    name: string;
    description?: string | null;
    is_active: boolean;
    version: number;
    steps: WorkflowStep[];
    transitions: WorkflowTransition[];
    created_at: string;
    updated_at: string;
}

export const assessmentApi = {
    // Configurations API
    listConfigurations: async () => {
        const { data } = await apiClient.get<AssessmentConfig[]>('/v1/assessment/configurations');
        return data;
    },

    getConfigurationById: async (id: string) => {
        const { data } = await apiClient.get<AssessmentConfig>(`/v1/assessment/configurations/${id}`);
        return data;
    },

    createConfiguration: async (payload: Partial<AssessmentConfig>) => {
        const { data } = await apiClient.post<AssessmentConfig>('/v1/assessment/configurations', payload);
        return data;
    },

    updateConfiguration: async (id: string, payload: Partial<AssessmentConfig>) => {
        const { data } = await apiClient.put<AssessmentConfig>(`/v1/assessment/configurations/${id}`, payload);
        return data;
    },

    deleteConfiguration: async (id: string) => {
        const { data } = await apiClient.delete<{ message: string }>(`/v1/assessment/configurations/${id}`);
        return data;
    },

    cloneConfiguration: async (id: string) => {
        const { data } = await apiClient.post<AssessmentConfig>('/v1/assessment/configurations/clone', { id });
        return data;
    },

    resetConfiguration: async (id: string) => {
        const { data } = await apiClient.post<AssessmentConfig>('/v1/assessment/configurations/reset', { id });
        return data;
    },

    validateConfiguration: async (payload: any) => {
        const { data } = await apiClient.post<{ valid: boolean; error?: string }>('/v1/assessment/configurations/validate', payload);
        return data;
    },

    // Workflows API
    listWorkflows: async () => {
        const { data } = await apiClient.get<WorkflowDefinition[]>('/v1/assessment/workflows');
        return data;
    },

    getWorkflowById: async (id: string) => {
        const { data } = await apiClient.get<WorkflowDefinition>(`/v1/assessment/workflows/${id}`);
        return data;
    },

    createWorkflow: async (payload: Omit<Partial<WorkflowDefinition>, 'id' | 'version' | 'created_at' | 'updated_at'>) => {
        const { data } = await apiClient.post<WorkflowDefinition>('/v1/assessment/workflows', payload);
        return data;
    },

    updateWorkflow: async (id: string, payload: Partial<WorkflowDefinition>) => {
        const { data } = await apiClient.put<WorkflowDefinition>(`/v1/assessment/workflows/${id}`, payload);
        return data;
    },

    deleteWorkflow: async (id: string) => {
        const { data } = await apiClient.delete<{ message: string }>(`/v1/assessment/workflows/${id}`);
        return data;
    },

    // Workflow Steps API
    getWorkflowSteps: async (workflowId: string) => {
        const { data } = await apiClient.get<WorkflowStep[]>(`/v1/assessment/workflows/${workflowId}/steps`);
        return data;
    },

    addWorkflowStep: async (workflowId: string, payload: Partial<WorkflowStep>) => {
        const { data } = await apiClient.post<WorkflowStep>(`/v1/assessment/workflows/${workflowId}/steps`, payload);
        return data;
    },

    updateWorkflowStep: async (stepId: string, payload: Partial<WorkflowStep>) => {
        const { data } = await apiClient.put<WorkflowStep>(`/v1/assessment/workflow-steps/${stepId}`, payload);
        return data;
    },

    deleteWorkflowStep: async (stepId: string) => {
        const { data } = await apiClient.delete<{ message: string }>(`/v1/assessment/workflow-steps/${stepId}`);
        return data;
    },

    // Workflow Transitions API
    getWorkflowTransitions: async (workflowId: string) => {
        const { data } = await apiClient.get<WorkflowTransition[]>(`/v1/assessment/workflows/${workflowId}/transitions`);
        return data;
    },

    addWorkflowTransition: async (workflowId: string, payload: Partial<WorkflowTransition>) => {
        const { data } = await apiClient.post<WorkflowTransition>(`/v1/assessment/workflows/${workflowId}/transitions`, payload);
        return data;
    },

    updateWorkflowTransition: async (transitionId: string, payload: Partial<WorkflowTransition>) => {
        const { data } = await apiClient.put<WorkflowTransition>(`/v1/assessment/workflow-transitions/${transitionId}`, payload);
        return data;
    },

    deleteWorkflowTransition: async (transitionId: string) => {
        const { data } = await apiClient.delete<{ message: string }>(`/v1/assessment/workflow-transitions/${transitionId}`);
        return data;
    }
};
