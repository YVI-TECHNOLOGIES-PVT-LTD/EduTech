import { useMemo, useEffect, useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useApplication } from './useApplication';
import { useMeritList, useExamResults } from './useOffers';
import { useWorkflow } from './useWorkflow';
import { AdmissionEngine } from '../core/AdmissionEngine';
import { AdmissionPermissions, type PermissionContext } from '../core/AdmissionPermissions';
import { admissionEventBus, ADMISSION_EVENTS } from '../core/AdmissionEvents';
import {
    mapMeritRecordForApplication,
    mapGeneratedMeritList,
    mapMeritHistory,
    summarizeMeritRecords,
    type MeritRecord,
    type MeritEvaluationSummary,
    type MeritHistoryEntry,
} from '../utils/merit.mapper';
import {
    planMeritAction,
    executeMeritApi,
    type MeritAction,
    type MeritActionPayload,
} from '../utils/merit.workflow';

function dispatchMeritEvents(queryClient: ReturnType<typeof useQueryClient>, applicationId?: string) {
    AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.APPLICATION_LIST_CHANGED);
    AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.QUEUE_REFRESH);
    AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.DASHBOARD_REFRESH);
    if (applicationId) {
        AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.APPLICATION_UPDATED, { applicationId });
        AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.TIMELINE_REFRESH, { applicationId });
    } else {
        AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.APPLICATION_UPDATED);
    }
}

export function useMeritWorkspace(applicationId?: string, permissionCtx?: PermissionContext) {
    const queryClient = useQueryClient();
    const [generatedRecords, setGeneratedRecords] = useState<MeritRecord[]>([]);

    const { application, isLoading: appLoading, error, refetch: refetchApp } = useApplication(applicationId, {
        enabled: !!applicationId,
    });
    const meritQuery = useMeritList(applicationId ?? '');
    const examQuery = useExamResults(applicationId ?? '');
    const { executeAction, isSubmitting: workflowSubmitting } = useWorkflow(applicationId);

    useEffect(() => {
        if (!applicationId) return;
        const refresh = () => {
            void refetchApp();
            void meritQuery.refetch();
            void examQuery.refetch();
        };
        const unsubs = [
            ADMISSION_EVENTS.APPLICATION_UPDATED,
            ADMISSION_EVENTS.APPLICATION_LIST_CHANGED,
            ADMISSION_EVENTS.TIMELINE_REFRESH,
            ADMISSION_EVENTS.QUEUE_REFRESH,
        ].map(event =>
            admissionEventBus.subscribe(event, payload => {
                if (!payload?.applicationId || payload.applicationId === applicationId) refresh();
            }),
        );
        return () => unsubs.forEach(u => u());
    }, [applicationId, refetchApp, meritQuery.refetch, examQuery.refetch]);

    const record: MeritRecord | null = useMemo(
        () =>
            application
                ? mapMeritRecordForApplication(application, meritQuery.data, examQuery.data)
                : null,
        [application, meritQuery.data, examQuery.data],
    );

    const records = useMemo(() => {
        if (generatedRecords.length) return generatedRecords;
        return record ? [record] : [];
    }, [generatedRecords, record]);

    const summary: MeritEvaluationSummary | null = useMemo(
        () => (records.length ? summarizeMeritRecords(records) : null),
        [records],
    );

    const history: MeritHistoryEntry[] = useMemo(
        () => (application ? mapMeritHistory(application.admission_audit_logs) : []),
        [application],
    );

    const permissions = useMemo(() => {
        const ctx = permissionCtx ?? { roles: [], hasPermission: () => false, hasRole: () => false };
        return {
            canView:
                AdmissionPermissions.canManageMeritSelection(ctx) ||
                AdmissionPermissions.canReviewApplications(ctx),
            canGenerate: AdmissionPermissions.canGenerateMerit(ctx),
            canApprove: AdmissionPermissions.isPrincipal(ctx) || AdmissionPermissions.canReviewApplications(ctx),
            canPublish: AdmissionPermissions.canManageMeritSelection(ctx),
            canAllocate: AdmissionPermissions.isPrincipal(ctx) || AdmissionPermissions.isAdmissionOfficer(ctx),
            canReject: AdmissionPermissions.canReviewApplications(ctx),
            readOnly: !AdmissionPermissions.canManageMeritSelection(ctx),
        };
    }, [permissionCtx]);

    const meritMutation = useMutation({
        mutationFn: executeMeritApi,
        onSuccess: (response, variables) => {
            const data = (response as { data?: unknown })?.data ?? response;
            if (Array.isArray(data) && application) {
                setGeneratedRecords(mapGeneratedMeritList(data, [application]));
            } else if (Array.isArray(data)) {
                setGeneratedRecords(mapGeneratedMeritList(data, []));
            }
            dispatchMeritEvents(queryClient, applicationId);
        },
    });

    const runMeritAction = useCallback(
        async (action: MeritAction, input: Partial<MeritActionPayload> = {}) => {
            const targetAppId = input.applicationId ?? applicationId;

            const plan = planMeritAction(action, {
                applicationId: targetAppId,
                ...input,
            });

            if (!plan.canExecute) {
                toast.error(plan.blockReason ?? 'Action not allowed');
                return;
            }

            if (plan.type === 'merit_api' && !permissions.canGenerate) {
                toast.error('You do not have permission to generate merit lists');
                return;
            }
            if (plan.type === 'workflow' && plan.workflowAction === 'reject' && !permissions.canReject) {
                toast.error('You do not have permission to reject candidates');
                return;
            }
            if (plan.type === 'workflow' && plan.workflowAction === 'approve' && !permissions.canApprove && action !== 'allocate_seat') {
                toast.error('You do not have permission to approve merit');
                return;
            }
            if (plan.type === 'workflow' && action === 'allocate_seat' && !permissions.canAllocate) {
                toast.error('You do not have permission to allocate seats');
                return;
            }
            if (plan.type === 'workflow' && ['publish_merit', 'move_waitlist', 'freeze_rank'].includes(action) && !permissions.canPublish) {
                toast.error('You do not have permission for this merit action');
                return;
            }

            try {
                if (plan.type === 'merit_api') {
                    const res = await meritMutation.mutateAsync(plan.payload);
                    const data = (res as { data?: unknown })?.data ?? res;
                    const apps = input.applications ?? (application ? [application] : []);
                    if (Array.isArray(data)) {
                        setGeneratedRecords(mapGeneratedMeritList(data, apps));
                    }
                    toast.success('Merit list generated');
                } else if (plan.workflowAction && targetAppId) {
                    await executeAction(plan.workflowAction, { remark: plan.remark });
                    dispatchMeritEvents(queryClient, targetAppId);
                    toast.success(`${action.replace(/_/g, ' ')} completed`);
                }
                await Promise.all([refetchApp(), meritQuery.refetch(), examQuery.refetch()]);
            } catch (err: unknown) {
                const message =
                    (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
                    (err as Error)?.message ??
                    'Merit action failed';
                toast.error(message);
            }
        },
        [
            applicationId,
            application,
            permissions,
            meritMutation,
            executeAction,
            queryClient,
            refetchApp,
            meritQuery,
            examQuery,
        ],
    );

    const generateMeritList = useCallback(
        (payload: {
            schoolId?: string;
            academicYearId?: string;
            intakeLimit?: number;
            applications?: import('../types/admission.types').Admission[];
        }) => runMeritAction('generate_merit', payload),
        [runMeritAction],
    );

    return {
        application,
        record,
        records,
        generatedRecords,
        summary,
        history,
        isLoading: appLoading || meritQuery.isLoading || examQuery.isLoading,
        error: error ?? meritQuery.error ?? examQuery.error,
        isSubmitting: workflowSubmitting || meritMutation.isPending,
        refetch: () => Promise.all([refetchApp(), meritQuery.refetch(), examQuery.refetch()]),
        permissions,
        runMeritAction,
        generateMeritList,
        setGeneratedRecords,
    };
}

export type { MeritRecord, MeritEvaluationSummary, MeritHistoryEntry, MeritAction };
