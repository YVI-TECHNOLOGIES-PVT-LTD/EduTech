import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AdmissionEngine, ADMISSION_EVENTS, type AdmissionEventType } from '../core/AdmissionEngine';
import type { AdmissionWorkflowActionPayload } from '../types';
import { executeWorkflowAction, workflowActionToEvent } from '../utils/workflow.executor';

export type WorkflowActionType =
    | 'review'
    | 'verify'
    | 'billing'
    | 'initiate_payment'
    | 'verify_fee'
    | 'recommend'
    | 'approve'
    | 'enrol'
    | 'reject'
    | 'decide_login'
    | 'submit_payment';

export function useWorkflow(applicationId?: string) {
    const queryClient = useQueryClient();

    const invalidate = (event: AdmissionEventType = ADMISSION_EVENTS.APPLICATION_UPDATED) => {
        AdmissionEngine.dispatch(queryClient, event, { applicationId });
    };

    const mutation = useMutation({
        mutationFn: async ({
            action,
            payload = {},
        }: {
            action: WorkflowActionType;
            payload?: AdmissionWorkflowActionPayload;
        }) => {
            if (!applicationId) throw new Error('Application ID required');
            return executeWorkflowAction(applicationId, action, payload);
        },
        onSuccess: (_, variables) => {
            const eventKey = workflowActionToEvent(variables.action);
            const eventMap: Record<string, AdmissionEventType> = {
                DOCUMENT_VERIFIED: ADMISSION_EVENTS.DOCUMENT_VERIFIED,
                PAYMENT_VERIFIED: ADMISSION_EVENTS.PAYMENT_VERIFIED,
                FEE_PAID: ADMISSION_EVENTS.FEE_PAID,
                ENROLLMENT_COMPLETED: ADMISSION_EVENTS.ENROLLMENT_COMPLETED,
                ERP_STUDENT_CREATED: ADMISSION_EVENTS.ERP_STUDENT_CREATED,
                APPLICATION_REVIEWED: ADMISSION_EVENTS.APPLICATION_REVIEWED,
                APPLICATION_APPROVED: ADMISSION_EVENTS.APPLICATION_APPROVED,
                APPLICATION_UPDATED: ADMISSION_EVENTS.APPLICATION_UPDATED,
            };
            invalidate(eventMap[eventKey] ?? ADMISSION_EVENTS.APPLICATION_UPDATED);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.QUEUE_REFRESH);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.DASHBOARD_REFRESH);
            if (applicationId) {
                AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.TIMELINE_REFRESH, { applicationId });
            }
        },
    });

    const executeAction = async (
        action: WorkflowActionType,
        payload?: AdmissionWorkflowActionPayload,
    ) => mutation.mutateAsync({ action, payload });

    return {
        executeAction,
        isSubmitting: mutation.isPending,
        error: mutation.error,
        refetchApplication: () =>
            applicationId
                ? AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.APPLICATION_UPDATED, {
                      applicationId,
                  })
                : undefined,
    };
}
