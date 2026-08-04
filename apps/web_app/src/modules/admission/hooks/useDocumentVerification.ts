import { useMemo, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useApplication } from './useApplication';
import { useWorkflow } from './useWorkflow';
import { AdmissionPermissions, type PermissionContext } from '../core/AdmissionPermissions';
import { admissionEventBus, ADMISSION_EVENTS } from '../core/AdmissionEvents';
import {
    mapApplicationDocuments,
    mapVerificationHistory,
    summarizeVerification,
    filterVerificationDocuments,
    type VerificationDocument,
    type VerificationHistoryEntry,
} from '../utils/documentVerification.mapper';
import {
    planVerificationWorkflow,
    type VerificationAction,
} from '../utils/verification.workflow';

export function useDocumentVerification(applicationId?: string, permissionCtx?: PermissionContext) {
    const { application, isLoading, error, refetch } = useApplication(applicationId, {
        enabled: !!applicationId,
    });
    const { executeAction, isSubmitting } = useWorkflow(applicationId);

    useEffect(() => {
        if (!applicationId) return;
        const unsubs = [
            ADMISSION_EVENTS.DOCUMENT_VERIFIED,
            ADMISSION_EVENTS.APPLICATION_UPDATED,
            ADMISSION_EVENTS.TIMELINE_REFRESH,
            ADMISSION_EVENTS.QUEUE_REFRESH,
            ADMISSION_EVENTS.DASHBOARD_REFRESH,
        ].map(event =>
            admissionEventBus.subscribe(event, payload => {
                if (!payload?.applicationId || payload.applicationId === applicationId) {
                    refetch();
                }
            }),
        );
        return () => unsubs.forEach(u => u());
    }, [applicationId, refetch]);

    const documents = useMemo(
        () => (application ? mapApplicationDocuments(application) : []),
        [application],
    );

    const summary = useMemo(
        () => (application ? summarizeVerification(application, documents) : null),
        [application, documents],
    );

    const history: VerificationHistoryEntry[] = useMemo(
        () => (application ? mapVerificationHistory(application) : []),
        [application],
    );

    const permissions = useMemo(() => {
        const ctx = permissionCtx ?? { roles: [], hasPermission: () => false, hasRole: () => false };
        return {
            canView: AdmissionPermissions.canReviewApplications(ctx) || AdmissionPermissions.canVerifyDocuments(ctx),
            canVerify: AdmissionPermissions.canVerifyDocuments(ctx),
            canReject: AdmissionPermissions.canReviewApplications(ctx),
            canRequestUpload: AdmissionPermissions.canVerifyDocuments(ctx),
        };
    }, [permissionCtx]);

    const runVerification = useCallback(
        async (action: VerificationAction, options?: { document?: VerificationDocument; remark?: string }) => {
            if (!applicationId || !application) {
                toast.error('No application selected');
                return;
            }

            const plan = planVerificationWorkflow({
                action,
                applicationId,
                document: options?.document,
                remark: options?.remark,
                documents,
            });

            if (!plan.canExecute) {
                toast.error(plan.blockReason ?? 'Action not allowed');
                return;
            }

            if (plan.workflowAction === 'verify' && !permissions.canVerify) {
                toast.error('You do not have permission to verify documents');
                return;
            }
            if (plan.workflowAction === 'reject' && !permissions.canReject) {
                toast.error('You do not have permission to reject applications');
                return;
            }
            if (plan.workflowAction === 'review' && !permissions.canRequestUpload) {
                toast.error('You do not have permission to request re-upload');
                return;
            }

            try {
                await executeAction(plan.workflowAction, { remark: plan.remark });
                toast.success(`${action.replace(/_/g, ' ')} completed`);
                await refetch();
            } catch (err: unknown) {
                const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
                    ?? (err as Error)?.message
                    ?? 'Verification action failed';
                toast.error(message);
                throw err;
            }
        },
        [applicationId, application, documents, permissions, executeAction, refetch],
    );

    return {
        application,
        documents,
        summary,
        history,
        isLoading,
        error,
        isSubmitting,
        refetch,
        permissions,
        runVerification,
        filterDocuments: (query: string, status: string) =>
            filterVerificationDocuments(documents, query, status),
    };
}

export type { VerificationDocument, VerificationHistoryEntry, VerificationAction };
