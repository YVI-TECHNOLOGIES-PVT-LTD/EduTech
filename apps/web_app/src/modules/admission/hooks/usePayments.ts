import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { admissionApi } from '../admission.api';
import { AdmissionEngine, ADMISSION_EVENTS, ADMISSION_STALE_TIME } from '../core/AdmissionEngine';
import { admissionEventBus } from '../core/AdmissionEvents';
import { useApplication } from './useApplication';
import { mapPaymentFromApplication, mapFeesSummary } from '../utils/finance.mapper';

export function usePayments(applicationId?: string) {
    const queryClient = useQueryClient();
    const { application, isLoading, refetch } = useApplication(applicationId, {
        enabled: !!applicationId,
    });

    const feesQuery = useQuery({
        queryKey: AdmissionEngine.cacheKeys.feesSummary(applicationId ?? ''),
        queryFn: () => admissionApi.getFeesSummary(applicationId!).then(res => mapFeesSummary(res.data)),
        enabled: !!applicationId,
        staleTime: ADMISSION_STALE_TIME,
    });

    const collectMutation = useMutation({
        mutationFn: admissionApi.collectPayment,
        onSuccess: (_, variables: { applicationId?: string; application_id?: string }) => {
            const appId = variables?.applicationId ?? variables?.application_id;
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.PAYMENT_VERIFIED, { applicationId: appId });
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.APPLICATION_UPDATED, { applicationId: appId });
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.APPLICATION_LIST_CHANGED);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.QUEUE_REFRESH);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.DASHBOARD_REFRESH);
            if (appId) {
                AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.TIMELINE_REFRESH, { applicationId: appId });
            }
        },
    });

    const verifyMutation = useMutation({
        mutationFn: admissionApi.verifyPayment,
        onSuccess: (_, variables: { applicationId?: string; application_id?: string }) => {
            const appId = variables?.applicationId ?? variables?.application_id;
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.PAYMENT_VERIFIED, { applicationId: appId });
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.APPLICATION_UPDATED, { applicationId: appId });
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.QUEUE_REFRESH);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.DASHBOARD_REFRESH);
            if (appId) {
                AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.TIMELINE_REFRESH, { applicationId: appId });
            }
        },
    });

    return {
        payment: application ? mapPaymentFromApplication(application) : null,
        feesSummary: feesQuery.data,
        isLoading: isLoading || feesQuery.isLoading,
        refetch,
        collectPayment: collectMutation.mutateAsync,
        verifyPayment: verifyMutation.mutateAsync,
        isCollecting: collectMutation.isPending,
    };
}

export function useFeesSummary(applicationId: string) {
    const query = useQuery({
        queryKey: AdmissionEngine.cacheKeys.feesSummary(applicationId),
        queryFn: () => admissionApi.getFeesSummary(applicationId).then(res => res.data),
        enabled: !!applicationId,
        staleTime: ADMISSION_STALE_TIME,
    });

    useEffect(() => {
        if (!applicationId) return;
        const refresh = () => void query.refetch();
        const unsubs = [
            ADMISSION_EVENTS.PAYMENT_VERIFIED,
            ADMISSION_EVENTS.APPLICATION_UPDATED,
            ADMISSION_EVENTS.ENROLLMENT_COMPLETED,
        ].map(event =>
            admissionEventBus.subscribe(event, payload => {
                if (!payload?.applicationId || payload.applicationId === applicationId) refresh();
            }),
        );
        return () => unsubs.forEach(u => u());
    }, [applicationId, query.refetch]);

    return query;
}

export function useCollectPayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: admissionApi.collectPayment,
        onSuccess: (_, variables: { applicationId?: string }) => {
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.PAYMENT_VERIFIED, {
                applicationId: variables?.applicationId,
            });
        },
    });
}
