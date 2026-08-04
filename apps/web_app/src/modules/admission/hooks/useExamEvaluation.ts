import { useMemo, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useApplication } from './useApplication';
import { useExamResults } from './useOffers';
import { useWorkflow } from './useWorkflow';
import { AdmissionEngine } from '../core/AdmissionEngine';
import { AdmissionPermissions, type PermissionContext } from '../core/AdmissionPermissions';
import { admissionEventBus, ADMISSION_EVENTS } from '../core/AdmissionEvents';
import {
    mapExamResultsResponse,
    mapExamHistory,
    summarizeExamRecords,
    filterExamRecords,
    type ExamRecord,
    type ExamEvaluationSummary,
    type ExamHistoryEntry,
} from '../utils/exam.mapper';
import {
    planEvaluationAction,
    executeEvaluationExamApi,
    type EvaluationAction,
    type EvaluationActionPayload,
} from '../utils/evaluation.workflow';

function dispatchExamEvents(queryClient: ReturnType<typeof useQueryClient>, applicationId: string) {
    AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.EXAM_COMPLETED, { applicationId });
    AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.QUEUE_REFRESH);
    AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.DASHBOARD_REFRESH);
    AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.TIMELINE_REFRESH, { applicationId });
}

export function useExamEvaluation(applicationId?: string, permissionCtx?: PermissionContext) {
    const queryClient = useQueryClient();
    const { application, isLoading: appLoading, error, refetch: refetchApp } = useApplication(applicationId, {
        enabled: !!applicationId,
    });
    const examQuery = useExamResults(applicationId ?? '');
    const { executeAction, isSubmitting: workflowSubmitting } = useWorkflow(applicationId);

    useEffect(() => {
        if (!applicationId) return;
        const refresh = () => {
            void refetchApp();
            void examQuery.refetch();
        };
        const unsubs = [
            ADMISSION_EVENTS.EXAM_COMPLETED,
            ADMISSION_EVENTS.APPLICATION_LIST_CHANGED,
            ADMISSION_EVENTS.TIMELINE_REFRESH,
            ADMISSION_EVENTS.QUEUE_REFRESH,
        ].map(event =>
            admissionEventBus.subscribe(event, payload => {
                if (!payload?.applicationId || payload.applicationId === applicationId) refresh();
            }),
        );
        return () => unsubs.forEach(u => u());
    }, [applicationId, refetchApp, examQuery.refetch]);

    const records = useMemo(
        () => (application ? mapExamResultsResponse(examQuery.data, application) : []),
        [application, examQuery.data],
    );

    const summary: ExamEvaluationSummary | null = useMemo(
        () => (records.length ? summarizeExamRecords(records) : null),
        [records],
    );

    const history: ExamHistoryEntry[] = useMemo(
        () => (application ? mapExamHistory(application.admission_audit_logs) : []),
        [application],
    );

    const permissions = useMemo(() => {
        const ctx = permissionCtx ?? { roles: [], hasPermission: () => false, hasRole: () => false };
        return {
            canView: AdmissionPermissions.canManageExams(ctx) || AdmissionPermissions.canReviewApplications(ctx),
            canEvaluate: AdmissionPermissions.canManageExams(ctx),
            canApprove: AdmissionPermissions.canReviewApplications(ctx) || AdmissionPermissions.isPrincipal(ctx),
            canReject: AdmissionPermissions.canReviewApplications(ctx),
            readOnly: !AdmissionPermissions.canManageExams(ctx),
        };
    }, [permissionCtx]);

    const examMutation = useMutation({
        mutationFn: async ({
            api,
            payload,
        }: {
            api: 'recordExamMarks' | 'recordExamAttendance';
            payload: Record<string, unknown>;
        }) => executeEvaluationExamApi(api, payload),
        onSuccess: () => {
            if (applicationId) dispatchExamEvents(queryClient, applicationId);
        },
    });

    const runEvaluation = useCallback(
        async (action: EvaluationAction, input: Partial<EvaluationActionPayload> & { marksObtained?: number }) => {
            if (!applicationId) {
                toast.error('No application selected');
                return;
            }

            const plan = planEvaluationAction(action, {
                applicationId,
                ...input,
            });

            if (!plan.canExecute) {
                toast.error(plan.blockReason ?? 'Action not allowed');
                return;
            }

            if (plan.type === 'exam_api' && !permissions.canEvaluate) {
                toast.error('You do not have permission to evaluate exams');
                return;
            }
            if (plan.type === 'workflow' && plan.workflowAction === 'reject' && !permissions.canReject) {
                toast.error('You do not have permission to reject results');
                return;
            }
            if (plan.type === 'workflow' && plan.workflowAction === 'recommend' && !permissions.canApprove) {
                toast.error('You do not have permission to approve results');
                return;
            }

            try {
                if (plan.type === 'exam_api' && plan.examApi) {
                    await examMutation.mutateAsync({ api: plan.examApi, payload: plan.payload });
                } else if (plan.workflowAction) {
                    await executeAction(plan.workflowAction, { remark: plan.remark });
                    dispatchExamEvents(queryClient, applicationId);
                }
                toast.success(`${action.replace(/_/g, ' ')} completed`);
                await Promise.all([refetchApp(), examQuery.refetch()]);
            } catch (err: unknown) {
                const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
                    ?? (err as Error)?.message
                    ?? 'Evaluation action failed';
                toast.error(message);
            }
        },
        [applicationId, permissions, examMutation, executeAction, queryClient, refetchApp, examQuery],
    );

    return {
        application,
        records,
        summary,
        history,
        isLoading: appLoading || examQuery.isLoading,
        error: error ?? examQuery.error,
        isSubmitting: workflowSubmitting || examMutation.isPending,
        refetch: () => Promise.all([refetchApp(), examQuery.refetch()]),
        permissions,
        runEvaluation,
        filterRecords: (query: string, status?: string) => filterExamRecords(records, query, status),
    };
}

export type { ExamRecord, ExamEvaluationSummary, ExamHistoryEntry, EvaluationAction };
