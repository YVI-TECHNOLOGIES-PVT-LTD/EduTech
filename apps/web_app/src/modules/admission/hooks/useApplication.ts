import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { admissionApi } from '../admission.api';
import { AdmissionEngine, ADMISSION_STALE_TIME } from '../core/AdmissionEngine';
import { mapApplication, mapApplicationList, mapCrmApplicationResponse } from '../utils/application.mapper';
import { admissionEventBus, ADMISSION_EVENTS } from '../core/AdmissionEvents';
import type { Admission } from '../types';

export interface ApplicationListParams {
    status?: string;
    school_id?: string;
    page?: number;
    limit?: number;
    search?: string;
}

const LIST_REFRESH_EVENTS = [
    ADMISSION_EVENTS.APPLICATION_CREATED,
    ADMISSION_EVENTS.APPLICATION_UPDATED,
    ADMISSION_EVENTS.APPLICATION_LIST_CHANGED,
    ADMISSION_EVENTS.INQUIRY_CONVERTED,
    ADMISSION_EVENTS.COUNSELOR_ASSIGNED,
    ADMISSION_EVENTS.QUEUE_REFRESH,
    ADMISSION_EVENTS.DASHBOARD_REFRESH,
    ADMISSION_EVENTS.ENROLLMENT_COMPLETED,
    ADMISSION_EVENTS.PAYMENT_VERIFIED,
    ADMISSION_EVENTS.OFFER_SENT,
    ADMISSION_EVENTS.DOCUMENT_VERIFIED,
] as const;

export function useApplication(id?: string, options?: { enabled?: boolean; parentOnly?: boolean }) {
    const query = useQuery({
        queryKey: AdmissionEngine.cacheKeys.detail(id ?? ''),
        queryFn: async () => {
            const { data } = await admissionApi.getCrmApplication(id!);
            return mapApplication(mapCrmApplicationResponse(data));
        },
        enabled: !!id && (options?.enabled ?? true),
        staleTime: ADMISSION_STALE_TIME,
    });

    useEffect(() => {
        if (!id) return;
        const refresh = () => void query.refetch();
        const unsubs = [
            ADMISSION_EVENTS.APPLICATION_CREATED,
            ADMISSION_EVENTS.APPLICATION_UPDATED,
            ADMISSION_EVENTS.APPLICATION_REVIEWED,
            ADMISSION_EVENTS.APPLICATION_APPROVED,
            ADMISSION_EVENTS.TIMELINE_REFRESH,
            ADMISSION_EVENTS.ENROLLMENT_COMPLETED,
            ADMISSION_EVENTS.PAYMENT_VERIFIED,
            ADMISSION_EVENTS.OFFER_SENT,
            ADMISSION_EVENTS.DOCUMENT_VERIFIED,
        ].map(event =>
            admissionEventBus.subscribe(event, payload => {
                if (!payload?.applicationId || payload.applicationId === id) refresh();
            }),
        );
        return () => unsubs.forEach(u => u());
    }, [id, query.refetch]);

    return {
        application: query.data ?? null,
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}

export function useApplicationList(params?: ApplicationListParams, options?: { enabled?: boolean; mine?: boolean }) {
    const query = useQuery({
        queryKey: options?.mine
            ? AdmissionEngine.cacheKeys.myApplications()
            : AdmissionEngine.cacheKeys.lists(params as Record<string, unknown>),
        queryFn: async () => {
            if (options?.mine) {
                const { data } = await admissionApi.listMyApplications();
                return mapApplicationList(data);
            }
            const { data } = await admissionApi.list(params);
            return mapApplicationList(data);
        },
        enabled: options?.enabled ?? true,
        staleTime: ADMISSION_STALE_TIME,
    });

    useEffect(() => {
        const refresh = () => void query.refetch();
        const unsubs = LIST_REFRESH_EVENTS.map(event => admissionEventBus.subscribe(event, refresh));
        return () => unsubs.forEach(u => u());
    }, [query.refetch]);

    return {
        applications: (query.data ?? []) as Admission[],
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}

export function useReviewQueue(status = 'submitted', options?: { enabled?: boolean }) {
    const query = useQuery({
        queryKey: AdmissionEngine.cacheKeys.reviewQueue(status),
        queryFn: async () => {
            const { data } = await admissionApi.list({ status });
            return mapApplicationList(data);
        },
        enabled: options?.enabled ?? true,
        staleTime: ADMISSION_STALE_TIME,
    });

    useEffect(() => {
        const refresh = () => void query.refetch();
        const unsubs = [
            ADMISSION_EVENTS.DOCUMENT_VERIFIED,
            ADMISSION_EVENTS.APPLICATION_CREATED,
            ADMISSION_EVENTS.APPLICATION_UPDATED,
            ADMISSION_EVENTS.INQUIRY_CONVERTED,
            ADMISSION_EVENTS.QUEUE_REFRESH,
            ADMISSION_EVENTS.DASHBOARD_REFRESH,
        ].map(event => admissionEventBus.subscribe(event, refresh));
        return () => unsubs.forEach(u => u());
    }, [query.refetch]);

    return {
        applications: (query.data ?? []) as Admission[],
        isLoading: query.isLoading,
        refetch: query.refetch,
    };
}
