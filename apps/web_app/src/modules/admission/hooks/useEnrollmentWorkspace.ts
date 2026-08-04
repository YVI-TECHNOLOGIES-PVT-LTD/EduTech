import { useMemo, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useApplication } from './useApplication';
import { useEnrollmentStatus } from './useEnrollment';
import { useFeesSummary } from './usePayments';
import { useTimeline } from './useTimeline';
import { useWorkflow } from './useWorkflow';
import { useStudentProvisioning } from './useStudentProvisioning';
import { AdmissionPermissions, type PermissionContext } from '../core/AdmissionPermissions';
import { admissionEventBus, ADMISSION_EVENTS } from '../core/AdmissionEvents';
import {
    mapEnrollmentRecord,
    mapEnrollmentHistory,
    mapEnrollmentAudit,
    summarizeEnrollmentRecords,
    type EnrollmentRecord,
    type EnrollmentSummaryStats,
    type EnrollmentHistoryEntry,
    type EnrollmentAuditEntry,
} from '../utils/enrollment.mapper';
import {
    planEnrollmentAction,
    executeEnrollmentApi,
    dispatchEnrollmentEvents,
    type EnrollmentAction,
    type EnrollmentActionPayload,
} from '../utils/enrollment.workflow';

export function useEnrollmentWorkspace(applicationId?: string, permissionCtx?: PermissionContext) {
    const queryClient = useQueryClient();

    const { application, isLoading: appLoading, error, refetch: refetchApp } = useApplication(applicationId, {
        enabled: !!applicationId,
    });
    const statusQuery = useEnrollmentStatus(applicationId);
    const feesQuery = useFeesSummary(applicationId ?? '');
    const { timeline, refetch: refetchTimeline } = useTimeline(applicationId);
    const { executeAction, isSubmitting: workflowSubmitting } = useWorkflow(applicationId);
    const provisioning = useStudentProvisioning(applicationId);

    useEffect(() => {
        if (!applicationId) return;
        const refresh = () => {
            void refetchApp();
            void statusQuery.refetch();
            void feesQuery.refetch();
            void refetchTimeline();
        };
        const unsubs = [
            ADMISSION_EVENTS.APPLICATION_UPDATED,
            ADMISSION_EVENTS.APPLICATION_LIST_CHANGED,
            ADMISSION_EVENTS.ENROLLMENT_COMPLETED,
            ADMISSION_EVENTS.PAYMENT_VERIFIED,
            ADMISSION_EVENTS.OFFER_SENT,
            ADMISSION_EVENTS.TIMELINE_REFRESH,
            ADMISSION_EVENTS.QUEUE_REFRESH,
        ].map(event =>
            admissionEventBus.subscribe(event, payload => {
                if (!payload?.applicationId || payload.applicationId === applicationId) refresh();
            }),
        );
        return () => unsubs.forEach(u => u());
    }, [applicationId, refetchApp, statusQuery.refetch, feesQuery.refetch, refetchTimeline]);

    const record: EnrollmentRecord | null = useMemo(() => {
        if (!application) return null;
        return mapEnrollmentRecord(application, statusQuery.data, feesQuery.data);
    }, [application, statusQuery.data, feesQuery.data]);

    const records = useMemo(() => (record ? [record] : []), [record]);

    const summary: EnrollmentSummaryStats | null = useMemo(
        () => (records.length ? summarizeEnrollmentRecords(records) : null),
        [records],
    );

    const history: EnrollmentHistoryEntry[] = useMemo(
        () => (application ? mapEnrollmentHistory(application.admission_audit_logs) : []),
        [application],
    );

    const audit: EnrollmentAuditEntry[] = useMemo(
        () => (application ? mapEnrollmentAudit(application.admission_audit_logs) : []),
        [application],
    );

    const permissions = useMemo(() => {
        const ctx = permissionCtx ?? { roles: [], hasPermission: () => false, hasRole: () => false };
        return {
            canView: AdmissionPermissions.canViewEnrollment(ctx),
            canConfirm: AdmissionPermissions.canEnroll(ctx),
            canEnroll: AdmissionPermissions.canEnroll(ctx),
            canReject: AdmissionPermissions.canEnroll(ctx) || AdmissionPermissions.isPrincipal(ctx),
            canRollback: AdmissionPermissions.isPrincipal(ctx),
            canProvision: AdmissionPermissions.canEnroll(ctx),
            readOnly: !AdmissionPermissions.canEnroll(ctx),
        };
    }, [permissionCtx]);

    const enrollmentMutation = useMutation({
        mutationFn: async ({
            api,
            payload,
            kind,
        }: {
            api: NonNullable<ReturnType<typeof planEnrollmentAction>['enrollmentApi']>;
            payload: Record<string, unknown>;
            kind: 'confirm' | 'enroll';
        }) => executeEnrollmentApi(api, payload),
        onSuccess: (_, variables) => {
            const appId = String(variables.payload.applicationId ?? variables.payload.application_id);
            dispatchEnrollmentEvents(queryClient, appId, variables.kind);
        },
    });

    const runEnrollmentAction = useCallback(
        async (action: EnrollmentAction, input: Partial<EnrollmentActionPayload> = {}) => {
            if (!applicationId) {
                toast.error('No application selected');
                return;
            }

            const plan = planEnrollmentAction(action, { applicationId, ...input });

            if (!plan.canExecute) {
                toast.error(plan.blockReason ?? 'Action not allowed');
                return;
            }

            if (plan.enrollmentApi === 'confirmAdmission' && !permissions.canConfirm) {
                toast.error('You do not have permission to confirm admission');
                return;
            }
            if (plan.enrollmentApi === 'enrollStudent' && !permissions.canEnroll) {
                toast.error('You do not have permission to enroll students');
                return;
            }
            if (plan.workflowAction === 'reject' && !permissions.canReject) {
                toast.error('You do not have permission to reject enrollment');
                return;
            }

            try {
                if (plan.type === 'enrollment_api' && plan.enrollmentApi) {
                    const kind = plan.enrollmentApi === 'confirmAdmission' ? 'confirm' : 'enroll';
                    await enrollmentMutation.mutateAsync({ api: plan.enrollmentApi, payload: plan.payload, kind });
                } else if (plan.workflowAction) {
                    await executeAction(plan.workflowAction, { remark: plan.remark });
                    dispatchEnrollmentEvents(queryClient, applicationId, 'reject');
                }
                toast.success(`${action.replace(/_/g, ' ')} completed`);
                await Promise.all([refetchApp(), statusQuery.refetch(), feesQuery.refetch(), refetchTimeline()]);
            } catch (err: unknown) {
                const message =
                    (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
                    (err as Error)?.message ??
                    'Enrollment action failed';
                toast.error(message);
            }
        },
        [
            applicationId,
            permissions,
            enrollmentMutation,
            executeAction,
            queryClient,
            refetchApp,
            statusQuery,
            feesQuery,
            refetchTimeline,
        ],
    );

    return {
        application,
        record,
        records,
        summary,
        history,
        audit,
        timeline,
        provisioning,
        isLoading: appLoading || statusQuery.isLoading || feesQuery.isLoading,
        error: error ?? statusQuery.error ?? feesQuery.error,
        isSubmitting: workflowSubmitting || enrollmentMutation.isPending,
        refetch: () => Promise.all([refetchApp(), statusQuery.refetch(), feesQuery.refetch(), refetchTimeline()]),
        permissions,
        runEnrollmentAction,
    };
}

export type {
    EnrollmentRecord,
    EnrollmentSummaryStats,
    EnrollmentHistoryEntry,
    EnrollmentAuditEntry,
    EnrollmentAction,
};
