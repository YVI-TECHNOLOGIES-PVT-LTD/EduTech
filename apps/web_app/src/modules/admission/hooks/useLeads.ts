import { useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { admissionApi } from '../admission.api';
import { AdmissionEngine, ADMISSION_STALE_TIME } from '../core/AdmissionEngine';
import { admissionEventBus, ADMISSION_EVENTS } from '../core/AdmissionEvents';
import { mapLeads, mapInquiries, computeLeadMetrics, normalizeApiList, mergeInquiriesAndLeads } from '../utils/lead.mapper';
import { mapFollowups } from '../utils/followup.mapper';
import type { Lead, AdmissionInquiry, LeadMetrics } from '../types/admission.types';
import { useAuth } from '../../../context/AuthContext';

export function useLeadsQuery(params?: Record<string, unknown>, options?: { enabled?: boolean }) {
    const { hasPermission } = useAuth();
    const canManage = hasPermission('admission.leads.manage');
    return useQuery({
        queryKey: AdmissionEngine.cacheKeys.lead.lists(params),
        queryFn: () => admissionApi.getLeads(params).then(res => res.data),
        enabled: options?.enabled ?? canManage,
        staleTime: ADMISSION_STALE_TIME,
    });
}

export function useInquiriesQuery(params?: Record<string, unknown>, options?: { enabled?: boolean }) {
    const { hasPermission } = useAuth();
    const canView = hasPermission('admission.enquiry.view');
    return useQuery({
        queryKey: AdmissionEngine.cacheKeys.inquiry.lists(params),
        queryFn: () => admissionApi.getEnquiries(params).then(res => res.data),
        enabled: options?.enabled ?? canView,
        staleTime: ADMISSION_STALE_TIME,
    });
}

/** Normalized leads with scoring applied */
export function useLeads(params?: Record<string, unknown>, options?: { enabled?: boolean }) {
    const { hasPermission } = useAuth();
    const canManage = hasPermission('admission.leads.manage');
    const leadsQuery = useLeadsQuery(params, { enabled: options?.enabled ?? canManage });
    const followupsQuery = useQuery({
        queryKey: AdmissionEngine.cacheKeys.followups(params),
        queryFn: () => admissionApi.getFollowups(params).then(res => res.data),
        enabled: options?.enabled ?? canManage,
        staleTime: ADMISSION_STALE_TIME,
    });

    const leads = useMemo(
        () => mapLeads(leadsQuery.data, followupsQuery.data),
        [leadsQuery.data, followupsQuery.data],
    );

    return {
        leads,
        raw: leadsQuery.data,
        isLoading: leadsQuery.isLoading || followupsQuery.isLoading,
        error: leadsQuery.error ?? followupsQuery.error,
        refetch: () => Promise.all([
            (options?.enabled ?? canManage) ? leadsQuery.refetch() : Promise.resolve(null),
            (options?.enabled ?? canManage) ? followupsQuery.refetch() : Promise.resolve(null),
        ]),
    };
}

/** Combined CRM data for workspace dashboards */
export function useLeadDashboard(params?: Record<string, unknown>) {
    const { hasPermission } = useAuth();
    const canManageLeads = hasPermission('admission.leads.manage');
    const canViewEnquiries = hasPermission('admission.enquiry.view');
    const canManageVisitors = hasPermission('admission.visitors.manage');

    const { leads, isLoading: leadsLoading, refetch: refetchLeads } = useLeads(params, { enabled: canManageLeads });
    const inquiriesQuery = useInquiriesQuery(params, { enabled: canViewEnquiries });
    const followupsQuery = useQuery({
        queryKey: AdmissionEngine.cacheKeys.followups(params),
        queryFn: () => admissionApi.getFollowups(params).then(res => res.data),
        enabled: canManageLeads,
        staleTime: ADMISSION_STALE_TIME,
    });
    const visitorsQuery = useQuery({
        queryKey: AdmissionEngine.cacheKeys.visitors(params),
        queryFn: () => admissionApi.getVisitors(params).then(res => res.data),
        enabled: canManageVisitors,
        staleTime: ADMISSION_STALE_TIME,
    });
    const statsQuery = useQuery({
        queryKey: AdmissionEngine.cacheKeys.stats(),
        queryFn: () => admissionApi.getStats().then(res => res.data).catch(() => null),
        enabled: canManageLeads || canViewEnquiries,
        staleTime: ADMISSION_STALE_TIME,
    });

    const inquiries = useMemo(() => mapInquiries(inquiriesQuery.data), [inquiriesQuery.data]);
    const followups = useMemo(() => mapFollowups(followupsQuery.data), [followupsQuery.data]);
    const visitors = useMemo(
        () => normalizeApiList<Record<string, unknown>>(visitorsQuery.data),
        [visitorsQuery.data],
    );

    const metrics: LeadMetrics = useMemo(
        () =>
            computeLeadMetrics(
                inquiries,
                leads,
                followups as unknown as Record<string, unknown>[],
                visitors,
                statsQuery.data as Record<string, unknown> | null,
            ),
        [inquiries, leads, followups, visitors, statsQuery.data],
    );

    const allRecords: AdmissionInquiry[] = useMemo(
        () => mergeInquiriesAndLeads(inquiries, leads),
        [inquiries, leads],
    );

    useEffect(() => {
        const refresh = () => {
            if (canManageLeads) void refetchLeads();
            if (canViewEnquiries) void inquiriesQuery.refetch();
            if (canManageLeads) void followupsQuery.refetch();
            if (canManageVisitors) void visitorsQuery.refetch();
            if (canManageLeads || canViewEnquiries) void statsQuery.refetch();
        };
        const unsubs = [
            ADMISSION_EVENTS.INQUIRY_CREATED,
            ADMISSION_EVENTS.INQUIRY_UPDATED,
            ADMISSION_EVENTS.INQUIRY_CONVERTED,
            ADMISSION_EVENTS.APPLICATION_CREATED,
            ADMISSION_EVENTS.APPLICATION_UPDATED,
            ADMISSION_EVENTS.LEAD_ASSIGNED,
            ADMISSION_EVENTS.COUNSELOR_ASSIGNED,
            ADMISSION_EVENTS.FOLLOWUP_COMPLETED,
            ADMISSION_EVENTS.DASHBOARD_REFRESH,
            ADMISSION_EVENTS.QUEUE_REFRESH,
            ADMISSION_EVENTS.APPLICATION_LIST_CHANGED,
        ].map(event => admissionEventBus.subscribe(event, refresh));
        return () => unsubs.forEach(u => u());
    }, [
        refetchLeads,
        inquiriesQuery.refetch,
        followupsQuery.refetch,
        visitorsQuery.refetch,
        statsQuery.refetch,
        canManageLeads,
        canViewEnquiries,
        canManageVisitors
    ]);

    return {
        leads,
        inquiries,
        followups,
        visitors: visitorsQuery.data,
        metrics,
        allRecords,
        isLoading:
            (canManageLeads && leadsLoading) ||
            (canViewEnquiries && inquiriesQuery.isLoading) ||
            (canManageLeads && followupsQuery.isLoading) ||
            (canManageVisitors && visitorsQuery.isLoading),
        refetch: () =>
            Promise.all([
                canManageLeads ? refetchLeads() : Promise.resolve(null),
                canViewEnquiries ? inquiriesQuery.refetch() : Promise.resolve(null),
                canManageLeads ? followupsQuery.refetch() : Promise.resolve(null),
                canManageVisitors ? visitorsQuery.refetch() : Promise.resolve(null),
                (canManageLeads || canViewEnquiries) ? statsQuery.refetch() : Promise.resolve(null),
            ]),
    };
}
