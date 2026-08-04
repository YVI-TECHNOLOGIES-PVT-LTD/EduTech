import { useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { admissionApi } from '../admission.api';
import { AdmissionEngine, ADMISSION_STALE_TIME } from '../core/AdmissionEngine';
import { admissionEventBus, ADMISSION_EVENTS } from '../core/AdmissionEvents';
import { buildInquiryTimeline } from '../utils/lead.mapper';
import { mapTimelineApiResponse } from '../utils/timeline.mapper';
import { mapFollowups } from '../utils/followup.mapper';
import { normalizeInquiry } from '../utils/lead.mapper';
import type { Lead, LeadTimelineEntry } from '../types/admission.types';
import { useAuth } from '../../../context/AuthContext';

export function useLeadTimeline(lead?: Lead | null) {
    const applicationId = lead?.application_id;
    const { hasPermission } = useAuth();
    const canManageLeads = hasPermission('admission.leads.manage');

    const timelineQuery = useQuery({
        queryKey: AdmissionEngine.cacheKeys.timeline(applicationId ?? ''),
        queryFn: async () => {
            try {
                const { data } = await admissionApi.getCrmApplicationTimeline(applicationId!);
                return mapTimelineApiResponse(data).map(entry => ({
                    ...entry,
                    action: entry.action === 'INITIALIZE_DRAFT' ? 'Application Created' : (entry.action ?? 'Status Updated'),
                    timestamp: entry.timestamp ?? (entry as any).created_at ?? '',
                })) as LeadTimelineEntry[];
            } catch {
                const { data } = await admissionApi.getTimeline(applicationId!);
                return mapTimelineApiResponse(data) as LeadTimelineEntry[];
            }
        },
        enabled: !!applicationId,
        staleTime: ADMISSION_STALE_TIME,
    });

    const followupsQuery = useQuery({
        queryKey: AdmissionEngine.cacheKeys.followups({ lead_id: lead?.id }),
        queryFn: () => admissionApi.getFollowups({ lead_id: lead?.id, enquiry_id: lead?.enquiry_id || lead?.id }).then(res => res.data),
        enabled: !!lead?.id && canManageLeads,
        staleTime: ADMISSION_STALE_TIME,
    });

    const enquiryQuery = useQuery({
        queryKey: AdmissionEngine.cacheKeys.inquiry.detail(lead?.enquiry_id || lead?.id || ''),
        queryFn: () => admissionApi.getEnquiryById(lead!.enquiry_id || lead!.id).then(res => res.data),
        enabled: !!lead?.id && !lead.application_id,
        staleTime: ADMISSION_STALE_TIME,
    });

    const timeline = useMemo(() => {
        if (!lead) return [];
        const inquiry = enquiryQuery.data
            ? normalizeInquiry(enquiryQuery.data as Record<string, unknown>)
            : lead;
        const followups = canManageLeads ? (mapFollowups(followupsQuery.data) as unknown as Record<string, unknown>[]) : [];
        return buildInquiryTimeline(inquiry, followups, timelineQuery.data);
    }, [lead, enquiryQuery.data, followupsQuery.data, timelineQuery.data, canManageLeads]);

    useEffect(() => {
        if (!lead) return;
        const refresh = () => {
            if (applicationId) {
                void timelineQuery.refetch();
            }
            if (canManageLeads) void followupsQuery.refetch();
            void enquiryQuery.refetch();
        };
        const unsubs = [
            ADMISSION_EVENTS.INQUIRY_CONVERTED,
            ADMISSION_EVENTS.APPLICATION_CREATED,
            ADMISSION_EVENTS.APPLICATION_UPDATED,
            ADMISSION_EVENTS.COUNSELOR_ASSIGNED,
            ADMISSION_EVENTS.FOLLOWUP_COMPLETED,
            ADMISSION_EVENTS.TIMELINE_REFRESH,
            ADMISSION_EVENTS.QUEUE_REFRESH,
            ADMISSION_EVENTS.DASHBOARD_REFRESH,
        ].map(event =>
            admissionEventBus.subscribe(event, payload => {
                if (payload?.applicationId && applicationId && payload.applicationId !== applicationId) return;
                if (payload?.leadId && lead.id && payload.leadId !== lead.id) return;
                if (payload?.inquiryId && lead.enquiry_id && payload.inquiryId !== lead.enquiry_id) return;
                refresh();
            }),
        );
        return () => unsubs.forEach(u => u());
    }, [lead, applicationId, canManageLeads, timelineQuery.refetch, followupsQuery.refetch, enquiryQuery.refetch]);

    return {
        timeline,
        isLoading: timelineQuery.isLoading || (canManageLeads && followupsQuery.isLoading) || enquiryQuery.isLoading,
        refetch: () => Promise.all([
            timelineQuery.refetch(),
            canManageLeads ? followupsQuery.refetch() : Promise.resolve(null),
            enquiryQuery.refetch()
        ]),
    };
}
