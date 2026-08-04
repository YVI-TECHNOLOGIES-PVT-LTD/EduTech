import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { admissionApi } from '../admission.api';
import { AdmissionEngine, ADMISSION_STALE_TIME } from '../core/AdmissionEngine';
import { mapTimelineApiResponse, mapAuditLogs } from '../utils/timeline.mapper';
import { admissionEventBus, ADMISSION_EVENTS } from '../core/AdmissionEvents';
import { useApplication } from './useApplication';

export function useTimeline(applicationId?: string) {
    const { application } = useApplication(applicationId, { enabled: !!applicationId });

    const apiQuery = useQuery({
        queryKey: AdmissionEngine.cacheKeys.timeline(applicationId ?? ''),
        queryFn: async () => {
            try {
                const { data } = await admissionApi.getCrmApplicationTimeline(applicationId!);
                return mapTimelineApiResponse(data).map(entry => ({
                    ...entry,
                    action: entry.action === 'INITIALIZE_DRAFT' ? 'Application Created' : (entry.action ?? 'Status Updated'),
                    timestamp: entry.timestamp ?? (entry as { created_at?: string }).created_at ?? '',
                }));
            } catch {
                const { data } = await admissionApi.getTimeline(applicationId!);
                return mapTimelineApiResponse(data);
            }
        },
        enabled: !!applicationId,
        staleTime: ADMISSION_STALE_TIME,
    });

    useEffect(() => {
        if (!applicationId) return;
        const refresh = () => void apiQuery.refetch();
        const unsubs = [
            ADMISSION_EVENTS.APPLICATION_CREATED,
            ADMISSION_EVENTS.TIMELINE_REFRESH,
            ADMISSION_EVENTS.APPLICATION_UPDATED,
            ADMISSION_EVENTS.ENROLLMENT_COMPLETED,
            ADMISSION_EVENTS.PAYMENT_VERIFIED,
            ADMISSION_EVENTS.OFFER_SENT,
        ].map(event =>
            admissionEventBus.subscribe(event, payload => {
                if (!payload?.applicationId || payload.applicationId === applicationId) refresh();
            }),
        );
        return () => unsubs.forEach(u => u());
    }, [applicationId, apiQuery.refetch]);

    const auditFallback = application?.admission_audit_logs
        ? mapAuditLogs(application.admission_audit_logs)
        : [];

    return {
        timeline: apiQuery.data?.length ? apiQuery.data : auditFallback,
        isLoading: apiQuery.isLoading,
        refetch: apiQuery.refetch,
    };
}
