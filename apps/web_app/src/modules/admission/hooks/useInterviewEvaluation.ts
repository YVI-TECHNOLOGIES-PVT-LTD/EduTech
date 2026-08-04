import { useMemo, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useApplication } from './useApplication';
import { useMeritList } from './useOffers';
import { useWorkflow } from './useWorkflow';
import { AdmissionEngine } from '../core/AdmissionEngine';
import { AdmissionPermissions, type PermissionContext } from '../core/AdmissionPermissions';
import { admissionEventBus, ADMISSION_EVENTS } from '../core/AdmissionEvents';
import {
    mapInterviewRecord,
    mapInterviewHistory,
    summarizeInterviewRecords,
    type InterviewRecord,
    type InterviewEvaluationSummary,
    type InterviewHistoryEntry,
} from '../utils/interview.mapper';
import {
    planInterviewAction,
    executeInterviewApi,
    type InterviewAction,
    type InterviewActionPayload,
} from '../utils/interview.workflow';

function dispatchInterviewEvents(
    queryClient: ReturnType<typeof useQueryClient>,
    applicationId: string,
    action?: 'schedule' | 'evaluate' | 'update',
) {
    const event =
        action === 'schedule'
            ? ADMISSION_EVENTS.INTERVIEW_CREATED
            : action === 'evaluate'
              ? ADMISSION_EVENTS.INTERVIEW_UPDATED
              : ADMISSION_EVENTS.INTERVIEW_UPDATED;
    AdmissionEngine.dispatch(queryClient, event, { applicationId });
    AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.APPLICATION_LIST_CHANGED);
    AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.QUEUE_REFRESH);
    AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.DASHBOARD_REFRESH);
    AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.TIMELINE_REFRESH, { applicationId });
}

export function useInterviewEvaluation(applicationId?: string, permissionCtx?: PermissionContext) {
    const queryClient = useQueryClient();
    const { application, isLoading: appLoading, error, refetch: refetchApp } = useApplication(applicationId, {
        enabled: !!applicationId,
    });
    const meritQuery = useMeritList(applicationId ?? '');
    const { executeAction, isSubmitting: workflowSubmitting } = useWorkflow(applicationId);

    useEffect(() => {
        if (!applicationId) return;
        const refresh = () => {
            void refetchApp();
            void meritQuery.refetch();
        };
        const unsubs = [
            ADMISSION_EVENTS.INTERVIEW_CREATED,
            ADMISSION_EVENTS.INTERVIEW_UPDATED,
            ADMISSION_EVENTS.APPLICATION_LIST_CHANGED,
            ADMISSION_EVENTS.TIMELINE_REFRESH,
            ADMISSION_EVENTS.QUEUE_REFRESH,
        ].map(event =>
            admissionEventBus.subscribe(event, payload => {
                if (!payload?.applicationId || payload.applicationId === applicationId) refresh();
            }),
        );
        return () => unsubs.forEach(u => u());
    }, [applicationId, refetchApp, meritQuery.refetch]);

    const record: InterviewRecord | null = useMemo(
        () => (application ? mapInterviewRecord(application, meritQuery.data) : null),
        [application, meritQuery.data],
    );

    const records = useMemo(() => (record ? [record] : []), [record]);

    const summary: InterviewEvaluationSummary | null = useMemo(
        () => (records.length ? summarizeInterviewRecords(records) : null),
        [records],
    );

    const history: InterviewHistoryEntry[] = useMemo(
        () => (application ? mapInterviewHistory(application.admission_audit_logs) : []),
        [application],
    );

    const permissions = useMemo(() => {
        const ctx = permissionCtx ?? { roles: [], hasPermission: () => false, hasRole: () => false };
        return {
            canView:
                AdmissionPermissions.canEvaluateInterviews(ctx) ||
                AdmissionPermissions.canReviewApplications(ctx),
            canAssign: AdmissionPermissions.canManageInterviews(ctx),
            canEvaluate: AdmissionPermissions.canEvaluateInterviews(ctx),
            canRecommend:
                AdmissionPermissions.canReviewApplications(ctx) || AdmissionPermissions.isPrincipal(ctx),
            canReject: AdmissionPermissions.canReviewApplications(ctx),
            readOnly: !AdmissionPermissions.canEvaluateInterviews(ctx),
        };
    }, [permissionCtx]);

    const interviewMutation = useMutation({
        mutationFn: async ({
            api,
            payload,
        }: {
            api: 'scheduleInterview' | 'recordInterviewScore';
            payload: Record<string, unknown>;
        }) => executeInterviewApi(api, payload),
        onSuccess: (_, variables) => {
            const appId = (variables.payload.applicationId ?? variables.payload.application_id) as string | undefined;
            const apiAction =
                variables.api === 'scheduleInterview' ? 'schedule' : 'evaluate';
            if (appId) dispatchInterviewEvents(queryClient, appId, apiAction);
            else if (applicationId) dispatchInterviewEvents(queryClient, applicationId, apiAction);
        },
    });

    const runInterviewAction = useCallback(
        async (action: InterviewAction, input: Partial<InterviewActionPayload> & Record<string, unknown> = {}) => {
            if (!applicationId) {
                toast.error('No application selected');
                return;
            }

            const plan = planInterviewAction(action, {
                applicationId,
                interviewId: input.interviewId ?? record?.interviewId,
                ...input,
            });

            if (!plan.canExecute) {
                toast.error(plan.blockReason ?? 'Action not allowed');
                return;
            }

            if (plan.type === 'interview_api' && plan.interviewApi === 'scheduleInterview' && !permissions.canAssign) {
                toast.error('You do not have permission to assign interview panels');
                return;
            }
            if (plan.type === 'interview_api' && plan.interviewApi === 'recordInterviewScore' && !permissions.canEvaluate) {
                toast.error('You do not have permission to evaluate interviews');
                return;
            }
            if (plan.type === 'workflow' && plan.workflowAction === 'reject' && !permissions.canReject) {
                toast.error('You do not have permission to reject candidates');
                return;
            }
            if (plan.type === 'workflow' && plan.workflowAction === 'recommend' && !permissions.canRecommend) {
                toast.error('You do not have permission to recommend candidates');
                return;
            }
            if (
                plan.type === 'workflow' &&
                plan.workflowAction === 'review' &&
                !permissions.canEvaluate &&
                action !== 'save_remarks'
            ) {
                toast.error('You do not have permission to update interview status');
                return;
            }

            try {
                if (plan.type === 'interview_api' && plan.interviewApi) {
                    await interviewMutation.mutateAsync({ api: plan.interviewApi, payload: plan.payload });
                } else if (plan.workflowAction) {
                    await executeAction(plan.workflowAction, { remark: plan.remark });
                    dispatchInterviewEvents(queryClient, applicationId, 'update');
                }
                toast.success(`${action.replace(/_/g, ' ')} completed`);
                await Promise.all([refetchApp(), meritQuery.refetch()]);
            } catch (err: unknown) {
                const message =
                    (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
                    (err as Error)?.message ??
                    'Interview action failed';
                toast.error(message);
            }
        },
        [applicationId, record?.interviewId, permissions, interviewMutation, executeAction, queryClient, refetchApp, meritQuery],
    );

    return {
        application,
        record,
        records,
        summary,
        history,
        isLoading: appLoading || meritQuery.isLoading,
        error: error ?? meritQuery.error,
        isSubmitting: workflowSubmitting || interviewMutation.isPending,
        refetch: () => Promise.all([refetchApp(), meritQuery.refetch()]),
        permissions,
        runInterviewAction,
    };
}

export type { InterviewRecord, InterviewEvaluationSummary, InterviewHistoryEntry, InterviewAction };
