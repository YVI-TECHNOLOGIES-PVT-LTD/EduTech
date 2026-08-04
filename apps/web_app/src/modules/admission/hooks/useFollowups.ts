import { useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { admissionApi } from '../admission.api';
import { AdmissionEngine, ADMISSION_EVENTS, ADMISSION_STALE_TIME } from '../core/AdmissionEngine';
import { admissionEventBus } from '../core/AdmissionEvents';
import {
    mapFollowups,
    categorizeFollowups,
    getTodayFollowupLeadIds,
    type FollowupBucket,
} from '../utils/followup.mapper';
import type { Followup } from '../types/admission.types';
import { useAuth } from '../../../context/AuthContext';

export function useFollowups(params?: Record<string, unknown>, options?: { enabled?: boolean }) {
    const { hasPermission } = useAuth();
    const canManage = hasPermission('admission.leads.manage');
    const query = useQuery({
        queryKey: AdmissionEngine.cacheKeys.followups(params),
        queryFn: () => admissionApi.getFollowups(params).then(res => res.data),
        enabled: options?.enabled ?? canManage,
        staleTime: ADMISSION_STALE_TIME,
    });

    const followups = useMemo(() => mapFollowups(query.data), [query.data]);
    const buckets = useMemo(() => categorizeFollowups(followups), [followups]);
    const todayLeadIds = useMemo(() => getTodayFollowupLeadIds(followups), [followups]);

    useEffect(() => {
        const refresh = () => void query.refetch();
        const unsubs = [
            ADMISSION_EVENTS.INQUIRY_CREATED,
            ADMISSION_EVENTS.INQUIRY_UPDATED,
            ADMISSION_EVENTS.INQUIRY_CONVERTED,
            ADMISSION_EVENTS.APPLICATION_CREATED,
            ADMISSION_EVENTS.APPLICATION_UPDATED,
            ADMISSION_EVENTS.COUNSELOR_ASSIGNED,
            ADMISSION_EVENTS.FOLLOWUP_COMPLETED,
            ADMISSION_EVENTS.QUEUE_REFRESH,
            ADMISSION_EVENTS.DASHBOARD_REFRESH,
            ADMISSION_EVENTS.TIMELINE_REFRESH,
        ].map(event => admissionEventBus.subscribe(event, refresh));
        return () => unsubs.forEach(u => u());
    }, [query.refetch]);

    return {
        followups,
        buckets,
        todayLeadIds,
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}

export function useFollowupsByBucket(bucket: FollowupBucket, params?: Record<string, unknown>) {
    const { buckets, ...rest } = useFollowups(params);
    return { items: buckets[bucket], ...rest };
}

export function useCreateFollowup() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: admissionApi.createFollowup,
        onSuccess: () => {
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.INQUIRY_UPDATED);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.QUEUE_REFRESH);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.DASHBOARD_REFRESH);
        },
    });
}

export function useUpdateFollowup() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
            admissionApi.updateFollowup(id, data),
        onSuccess: (_, variables) => {
            const isComplete = variables.data.status === 'completed';
            AdmissionEngine.dispatch(
                queryClient,
                isComplete ? ADMISSION_EVENTS.FOLLOWUP_COMPLETED : ADMISSION_EVENTS.INQUIRY_UPDATED,
            );
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.QUEUE_REFRESH);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.DASHBOARD_REFRESH);
        },
    });
}

export function useCompleteFollowup() {
    const update = useUpdateFollowup();
    return {
        ...update,
        mutate: (id: string, remarks?: string) =>
            update.mutate({ id, data: { status: 'completed', remarks, completed_at: new Date().toISOString() } }),
        mutateAsync: (id: string, remarks?: string) =>
            update.mutateAsync({ id, data: { status: 'completed', remarks, completed_at: new Date().toISOString() } }),
    };
}

export type { Followup, FollowupBucket };
