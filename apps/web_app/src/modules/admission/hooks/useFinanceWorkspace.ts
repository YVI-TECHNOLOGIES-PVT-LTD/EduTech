import { useMemo, useEffect, useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useApplication } from './useApplication';
import { useFeesSummary } from './usePayments';
import { useTimeline } from './useTimeline';
import { useWorkflow } from './useWorkflow';
import { AdmissionEngine } from '../core/AdmissionEngine';
import { AdmissionPermissions, type PermissionContext } from '../core/AdmissionPermissions';
import { admissionEventBus, ADMISSION_EVENTS } from '../core/AdmissionEvents';
import {
    mapPaymentRecordForApplication,
    mapPaymentHistory,
    mapPaymentAudit,
    mapReceiptRecord,
    summarizePaymentRecords,
    type PaymentRecord,
    type PaymentSummaryStats,
    type PaymentHistoryEntry,
    type PaymentAuditEntry,
    type ReceiptRecord,
} from '../utils/finance.mapper';
import {
    planFinanceAction,
    executeFinanceApi,
    type FinanceAction,
    type FinanceActionPayload,
} from '../utils/finance.workflow';

function dispatchFinanceEvents(queryClient: ReturnType<typeof useQueryClient>, applicationId: string) {
    AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.FEE_PAID, { applicationId });
    AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.APPLICATION_LIST_CHANGED);
    AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.QUEUE_REFRESH);
    AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.DASHBOARD_REFRESH);
    AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.TIMELINE_REFRESH, { applicationId });
}

export function useFinanceWorkspace(applicationId?: string, permissionCtx?: PermissionContext) {
    const queryClient = useQueryClient();
    const [lastPayment, setLastPayment] = useState<Record<string, unknown> | null>(null);
    const [receipt, setReceipt] = useState<ReceiptRecord | null>(null);

    const { application, isLoading: appLoading, error, refetch: refetchApp } = useApplication(applicationId, {
        enabled: !!applicationId,
    });
    const feesQuery = useFeesSummary(applicationId ?? '');
    const { timeline, refetch: refetchTimeline } = useTimeline(applicationId);
    const { executeAction, isSubmitting: workflowSubmitting } = useWorkflow(applicationId);

    useEffect(() => {
        if (!applicationId) return;
        const refresh = () => {
            void refetchApp();
            void feesQuery.refetch();
            void refetchTimeline();
        };
        const unsubs = [
            ADMISSION_EVENTS.FEE_PAID,
            ADMISSION_EVENTS.PAYMENT_VERIFIED,
            ADMISSION_EVENTS.APPLICATION_LIST_CHANGED,
            ADMISSION_EVENTS.OFFER_SENT,
            ADMISSION_EVENTS.TIMELINE_REFRESH,
            ADMISSION_EVENTS.QUEUE_REFRESH,
        ].map(event =>
            admissionEventBus.subscribe(event, payload => {
                if (!payload?.applicationId || payload.applicationId === applicationId) refresh();
            }),
        );
        return () => unsubs.forEach(u => u());
    }, [applicationId, refetchApp, feesQuery.refetch, refetchTimeline]);

    const record: PaymentRecord | null = useMemo(() => {
        if (!application) return null;
        return mapPaymentRecordForApplication(application, feesQuery.data, lastPayment);
    }, [application, feesQuery.data, lastPayment]);

    const records = useMemo(() => (record ? [record] : []), [record]);

    const summary: PaymentSummaryStats | null = useMemo(
        () => (records.length ? summarizePaymentRecords(records) : null),
        [records],
    );

    const history: PaymentHistoryEntry[] = useMemo(
        () => (application ? mapPaymentHistory(application.admission_audit_logs) : []),
        [application],
    );

    const audit: PaymentAuditEntry[] = useMemo(
        () => (application ? mapPaymentAudit(application.admission_audit_logs) : []),
        [application],
    );

    const permissions = useMemo(() => {
        const ctx = permissionCtx ?? { roles: [], hasPermission: () => false, hasRole: () => false };
        return {
            canView: AdmissionPermissions.canViewFinance(ctx),
            canCollect: AdmissionPermissions.canCollectPayments(ctx),
            canVerify: AdmissionPermissions.canVerifyPayments(ctx),
            canApprove: AdmissionPermissions.canVerifyPayments(ctx) || AdmissionPermissions.isPrincipal(ctx),
            canReject: AdmissionPermissions.canVerifyPayments(ctx),
            canWaiver: AdmissionPermissions.canManageWaivers(ctx),
            canReceipt: AdmissionPermissions.canCollectPayments(ctx) || AdmissionPermissions.canVerifyPayments(ctx),
            readOnly: !AdmissionPermissions.canCollectPayments(ctx) && !AdmissionPermissions.canVerifyPayments(ctx),
        };
    }, [permissionCtx]);

    const financeMutation = useMutation({
        mutationFn: async ({
            api,
            payload,
        }: {
            api: NonNullable<ReturnType<typeof planFinanceAction>['financeApi']>;
            payload: Record<string, unknown>;
        }) => executeFinanceApi(api, payload),
        onSuccess: (response, variables) => {
            const data = (response as { data?: unknown })?.data ?? response;
            if (variables.api === 'getReceipt') {
                const mapped = mapReceiptRecord(data, String(variables.payload.paymentId));
                if (mapped) setReceipt(mapped);
            } else if (data && typeof data === 'object') {
                setLastPayment(data as Record<string, unknown>);
            }
            const appId = (variables.payload.applicationId ?? variables.payload.application_id) as string | undefined;
            if (appId) dispatchFinanceEvents(queryClient, appId);
        },
    });

    const runFinanceAction = useCallback(
        async (action: FinanceAction, input: Partial<FinanceActionPayload> = {}) => {
            if (!applicationId) {
                toast.error('No application selected');
                return;
            }

            const plan = planFinanceAction(action, {
                applicationId,
                paymentId: input.paymentId ?? record?.paymentId ?? lastPayment?.id as string | undefined,
                ...input,
            });

            if (!plan.canExecute) {
                toast.error(plan.blockReason ?? 'Action not allowed');
                return;
            }

            if (plan.type === 'finance_api' && plan.financeApi === 'collectPayment' && !permissions.canCollect) {
                toast.error('You do not have permission to collect payments');
                return;
            }
            if (
                plan.type === 'finance_api' &&
                ['verifyPayment', 'getReceipt'].includes(plan.financeApi ?? '') &&
                !permissions.canVerify &&
                plan.financeApi !== 'getReceipt'
            ) {
                toast.error('You do not have permission to verify payments');
                return;
            }
            if (plan.financeApi === 'getReceipt' && !permissions.canReceipt) {
                toast.error('You do not have permission to view receipts');
                return;
            }
            if (plan.financeApi === 'applyFeeWaiver' && !permissions.canWaiver) {
                toast.error('You do not have permission to manage waivers');
                return;
            }
            if (plan.financeApi === 'assignFeeStructure' && !permissions.canCollect) {
                toast.error('You do not have permission to assign fee structures');
                return;
            }
            if (plan.type === 'workflow' && plan.workflowAction === 'verify_fee' && !permissions.canVerify) {
                toast.error('You do not have permission to verify fees');
                return;
            }

            try {
                if (plan.type === 'finance_api' && plan.financeApi) {
                    await financeMutation.mutateAsync({ api: plan.financeApi, payload: plan.payload });
                } else if (plan.workflowAction) {
                    await executeAction(plan.workflowAction, {
                        remark: plan.remark,
                        status: plan.payload.status as 'verified' | 'correction' | undefined,
                        amount: plan.payload.amount as number | undefined,
                        mode: plan.payload.mode as string | undefined,
                        reference: plan.payload.reference as string | undefined,
                    });
                    dispatchFinanceEvents(queryClient, applicationId);
                }
                toast.success(`${action.replace(/_/g, ' ')} completed`);
                await Promise.all([refetchApp(), feesQuery.refetch(), refetchTimeline()]);
            } catch (err: unknown) {
                const message =
                    (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
                    (err as Error)?.message ??
                    'Finance action failed';
                toast.error(message);
            }
        },
        [
            applicationId,
            record?.paymentId,
            lastPayment,
            permissions,
            financeMutation,
            executeAction,
            queryClient,
            refetchApp,
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
        receipt,
        timeline,
        isLoading: appLoading || feesQuery.isLoading,
        error: error ?? feesQuery.error,
        isSubmitting: workflowSubmitting || financeMutation.isPending,
        refetch: () => Promise.all([refetchApp(), feesQuery.refetch(), refetchTimeline()]),
        permissions,
        runFinanceAction,
    };
}

export type { PaymentRecord, PaymentSummaryStats, PaymentHistoryEntry, PaymentAuditEntry, ReceiptRecord, FinanceAction };
