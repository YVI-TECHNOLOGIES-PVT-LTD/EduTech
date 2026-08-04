import { useMemo, useEffect, useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useApplication } from './useApplication';
import { useMeritList } from './useOffers';
import { useTimeline } from './useTimeline';
import { useWorkflow } from './useWorkflow';
import { AdmissionEngine } from '../core/AdmissionEngine';
import { AdmissionPermissions, type PermissionContext } from '../core/AdmissionPermissions';
import { admissionEventBus, ADMISSION_EVENTS } from '../core/AdmissionEvents';
import {
    mapOfferRecordForApplication,
    mapOfferHistory,
    mapOfferAudit,
    summarizeOfferRecords,
    filterOfferRecords,
    type OfferRecord,
    type OfferSummaryStats,
    type OfferHistoryEntry,
    type OfferAuditEntry,
} from '../utils/offer.mapper';
import {
    planOfferAction,
    executeOfferApi,
    type OfferAction,
    type OfferActionPayload,
} from '../utils/offer.workflow';

function dispatchOfferEvents(queryClient: ReturnType<typeof useQueryClient>, applicationId: string) {
    AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.OFFER_SENT, { applicationId });
    AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.APPLICATION_UPDATED, { applicationId });
    AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.APPLICATION_LIST_CHANGED);
    AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.QUEUE_REFRESH);
    AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.DASHBOARD_REFRESH);
    AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.TIMELINE_REFRESH, { applicationId });
}

export function useOfferWorkspace(applicationId?: string, permissionCtx?: PermissionContext) {
    const queryClient = useQueryClient();
    const [lastGeneratedOffer, setLastGeneratedOffer] = useState<Record<string, unknown> | null>(null);

    const { application, isLoading: appLoading, error, refetch: refetchApp } = useApplication(applicationId, {
        enabled: !!applicationId,
    });
    const meritQuery = useMeritList(applicationId ?? '');
    const { timeline, refetch: refetchTimeline } = useTimeline(applicationId);
    const { executeAction, isSubmitting: workflowSubmitting } = useWorkflow(applicationId);

    useEffect(() => {
        if (!applicationId) return;
        const refresh = () => {
            void refetchApp();
            void meritQuery.refetch();
            void refetchTimeline();
        };
        const unsubs = [
            ADMISSION_EVENTS.APPLICATION_UPDATED,
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
    }, [applicationId, refetchApp, meritQuery.refetch, refetchTimeline]);

    const record: OfferRecord | null = useMemo(() => {
        if (!application) return null;
        const offerData = lastGeneratedOffer ?? undefined;
        return mapOfferRecordForApplication(application, offerData, meritQuery.data);
    }, [application, lastGeneratedOffer, meritQuery.data]);

    const records = useMemo(() => (record ? [record] : []), [record]);

    const summary: OfferSummaryStats | null = useMemo(
        () => (records.length ? summarizeOfferRecords(records) : null),
        [records],
    );

    const history: OfferHistoryEntry[] = useMemo(
        () => (application ? mapOfferHistory(application.admission_audit_logs) : []),
        [application],
    );

    const audit: OfferAuditEntry[] = useMemo(
        () => (application ? mapOfferAudit(application.admission_audit_logs) : []),
        [application],
    );

    const permissions = useMemo(() => {
        const ctx = permissionCtx ?? { roles: [], hasPermission: () => false, hasRole: () => false };
        return {
            canView:
                AdmissionPermissions.canManageOffers(ctx) ||
                AdmissionPermissions.canReviewApplications(ctx) ||
                AdmissionPermissions.canAcceptOffer(ctx),
            canGenerate: AdmissionPermissions.canManageOffers(ctx),
            canApprove: AdmissionPermissions.canApproveOffers(ctx),
            canPublish: AdmissionPermissions.canManageOffers(ctx),
            canSend: AdmissionPermissions.canSendOffers(ctx),
            canAccept: AdmissionPermissions.canAcceptOffer(ctx),
            canReject: AdmissionPermissions.canManageOffers(ctx) || AdmissionPermissions.canAcceptOffer(ctx),
            canWithdraw: AdmissionPermissions.canManageOffers(ctx),
            readOnly: !AdmissionPermissions.canManageOffers(ctx),
        };
    }, [permissionCtx]);

    const offerMutation = useMutation({
        mutationFn: async ({
            api,
            payload,
        }: {
            api: 'generateOffer' | 'sendOffer' | 'acceptOffer' | 'rejectOffer';
            payload: Record<string, unknown>;
        }) => executeOfferApi(api, payload),
        onSuccess: (response, variables) => {
            const data = (response as { data?: unknown })?.data ?? response;
            if (data && typeof data === 'object') {
                setLastGeneratedOffer(data as Record<string, unknown>);
            }
            const appId = (variables.payload.applicationId ?? variables.payload.application_id) as string | undefined;
            if (appId) dispatchOfferEvents(queryClient, appId);
        },
    });

    const runOfferAction = useCallback(
        async (action: OfferAction, input: Partial<OfferActionPayload> = {}) => {
            const targetAppId = input.applicationId ?? applicationId;
            if (!targetAppId) {
                toast.error('No application selected');
                return;
            }

            const plan = planOfferAction(action, { applicationId: targetAppId, ...input });

            if (!plan.canExecute) {
                toast.error(plan.blockReason ?? 'Action not allowed');
                return;
            }

            if (plan.type === 'offer_api' && plan.offerApi === 'generateOffer' && !permissions.canGenerate) {
                toast.error('You do not have permission to generate offers');
                return;
            }
            if (plan.type === 'offer_api' && plan.offerApi === 'sendOffer' && !permissions.canSend) {
                toast.error('You do not have permission to send offers');
                return;
            }
            if (plan.type === 'offer_api' && plan.offerApi === 'acceptOffer' && !permissions.canAccept) {
                toast.error('You do not have permission to accept offers');
                return;
            }
            if (plan.type === 'offer_api' && plan.offerApi === 'rejectOffer' && !permissions.canReject) {
                toast.error('You do not have permission to reject offers');
                return;
            }
            if (plan.type === 'workflow' && plan.workflowAction === 'approve' && !permissions.canApprove) {
                toast.error('You do not have permission to approve offers');
                return;
            }
            if (
                plan.type === 'workflow' &&
                ['publish_offer', 'expire_offer', 'defer_offer'].includes(action) &&
                !permissions.canPublish &&
                action !== 'withdraw_offer'
            ) {
                toast.error('You do not have permission for this offer action');
                return;
            }
            if (plan.type === 'workflow' && action === 'withdraw_offer' && !permissions.canWithdraw) {
                toast.error('You do not have permission to withdraw offers');
                return;
            }

            try {
                if (plan.type === 'offer_api' && plan.offerApi) {
                    await offerMutation.mutateAsync({ api: plan.offerApi, payload: plan.payload });
                } else if (plan.workflowAction) {
                    await executeAction(plan.workflowAction, { remark: plan.remark });
                    dispatchOfferEvents(queryClient, targetAppId);
                }
                toast.success(`${action.replace(/_/g, ' ')} completed`);
                await Promise.all([refetchApp(), meritQuery.refetch(), refetchTimeline()]);
            } catch (err: unknown) {
                const message =
                    (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
                    (err as Error)?.message ??
                    'Offer action failed';
                toast.error(message);
            }
        },
        [
            applicationId,
            permissions,
            offerMutation,
            executeAction,
            queryClient,
            refetchApp,
            meritQuery,
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
        isLoading: appLoading || meritQuery.isLoading,
        error: error ?? meritQuery.error,
        isSubmitting: workflowSubmitting || offerMutation.isPending,
        refetch: () => Promise.all([refetchApp(), meritQuery.refetch(), refetchTimeline()]),
        permissions,
        runOfferAction,
        filterRecords: (status?: string) => filterOfferRecords(records, status),
    };
}

export type { OfferRecord, OfferSummaryStats, OfferHistoryEntry, OfferAuditEntry, OfferAction };
