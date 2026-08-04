import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { admissionApi } from '../admission.api';
import { AdmissionEngine, ADMISSION_EVENTS, ADMISSION_STALE_TIME } from '../core/AdmissionEngine';

export function useOffers(applicationId?: string) {
    const queryClient = useQueryClient();

    const meritQuery = useQuery({
        queryKey: AdmissionEngine.cacheKeys.merit(applicationId ?? ''),
        queryFn: () => admissionApi.getMeritList(applicationId!).then(res => res.data),
        enabled: !!applicationId,
        staleTime: ADMISSION_STALE_TIME,
    });

    const sendMutation = useMutation({
        mutationFn: admissionApi.sendOffer,
        onSuccess: (_, variables: { applicationId?: string; application_id?: string }) => {
            const appId = variables?.applicationId ?? variables?.application_id;
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.OFFER_SENT, { applicationId: appId });
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.APPLICATION_UPDATED, { applicationId: appId });
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.QUEUE_REFRESH);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.DASHBOARD_REFRESH);
            if (appId) {
                AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.TIMELINE_REFRESH, { applicationId: appId });
            }
        },
    });

    const generateMutation = useMutation({
        mutationFn: admissionApi.generateOffer,
        onSuccess: (_, variables: { applicationId?: string; application_id?: string }) => {
            const appId = variables?.applicationId ?? variables?.application_id ?? applicationId;
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.OFFER_SENT, { applicationId: appId });
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.APPLICATION_UPDATED, { applicationId: appId });
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.APPLICATION_LIST_CHANGED);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.QUEUE_REFRESH);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.DASHBOARD_REFRESH);
            if (appId) {
                AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.TIMELINE_REFRESH, { applicationId: appId });
            }
        },
    });

    return {
        merit: meritQuery.data,
        isLoading: meritQuery.isLoading,
        sendOffer: sendMutation.mutateAsync,
        generateOffer: generateMutation.mutateAsync,
        isSending: sendMutation.isPending,
    };
}

export function useMeritList(applicationId: string) {
    return useQuery({
        queryKey: AdmissionEngine.cacheKeys.merit(applicationId),
        queryFn: () => admissionApi.getMeritList(applicationId).then(res => res.data),
        enabled: !!applicationId,
        staleTime: ADMISSION_STALE_TIME,
    });
}

export function useGenerateMeritList() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: admissionApi.generateMeritList,
        onSuccess: () => {
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.APPLICATION_LIST_CHANGED);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.QUEUE_REFRESH);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.DASHBOARD_REFRESH);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.APPLICATION_UPDATED);
        },
    });
}

export function useExamResults(applicationId: string) {
    return useQuery({
        queryKey: AdmissionEngine.cacheKeys.examResults(applicationId),
        queryFn: () => admissionApi.getExamResults(applicationId).then(res => res.data),
        enabled: !!applicationId,
        staleTime: ADMISSION_STALE_TIME,
    });
}

export function useRecordExamMarks() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: admissionApi.recordExamMarks,
        onSuccess: (_, variables: { applicationId?: string; candidate_id?: string }) => {
            const appId = variables?.applicationId;
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.APPLICATION_UPDATED, {
                applicationId: appId,
            });
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.QUEUE_REFRESH);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.DASHBOARD_REFRESH);
            if (appId) {
                AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.TIMELINE_REFRESH, { applicationId: appId });
            }
        },
    });
}

export function useInterviewSchedule() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: admissionApi.scheduleInterview,
        onSuccess: (_, variables: { application_id?: string }) => {
            const appId = variables?.application_id;
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.APPLICATION_UPDATED, { applicationId: appId });
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.APPLICATION_LIST_CHANGED);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.QUEUE_REFRESH);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.DASHBOARD_REFRESH);
            if (appId) {
                AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.TIMELINE_REFRESH, { applicationId: appId });
            }
        },
    });
}

export function useRecordInterviewScore() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: admissionApi.recordInterviewScore,
        onSuccess: (_, variables: { applicationId?: string }) => {
            const appId = variables?.applicationId;
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.APPLICATION_UPDATED, { applicationId: appId });
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.QUEUE_REFRESH);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.DASHBOARD_REFRESH);
            if (appId) {
                AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.TIMELINE_REFRESH, { applicationId: appId });
            }
        },
    });
}

export function useAcceptOffer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: admissionApi.acceptOffer,
        onSuccess: (_, variables: { applicationId?: string; application_id?: string }) => {
            const appId = variables?.applicationId ?? variables?.application_id;
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.OFFER_SENT, { applicationId: appId });
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.APPLICATION_UPDATED, { applicationId: appId });
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.APPLICATION_LIST_CHANGED);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.QUEUE_REFRESH);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.DASHBOARD_REFRESH);
            if (appId) {
                AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.TIMELINE_REFRESH, { applicationId: appId });
            }
        },
    });
}

export function useRejectOffer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: admissionApi.rejectOffer,
        onSuccess: (_, variables: { applicationId?: string; application_id?: string }) => {
            const appId = variables?.applicationId ?? variables?.application_id;
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.APPLICATION_UPDATED, { applicationId: appId });
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.APPLICATION_LIST_CHANGED);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.QUEUE_REFRESH);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.DASHBOARD_REFRESH);
            if (appId) {
                AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.TIMELINE_REFRESH, { applicationId: appId });
            }
        },
    });
}
