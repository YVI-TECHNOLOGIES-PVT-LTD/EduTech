import { useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { admissionApi } from '../admission.api';
import { AdmissionEngine, ADMISSION_STALE_TIME } from '../core/AdmissionEngine';
import { admissionEventBus, ADMISSION_EVENTS } from '../core/AdmissionEvents';
import { AdmissionPermissions } from '../core/AdmissionPermissions';
import {
    mapLeads,
    mapInquiries,
    computeLeadMetrics,
    normalizeApiList,
    mergeInquiriesAndLeads,
} from '../utils/lead.mapper';
import { mapFollowups, categorizeFollowups, getTodayFollowupLeadIds } from '../utils/followup.mapper';
import { useLeadsQuery, useInquiriesQuery } from './useLeads';
import type { Lead, AdmissionInquiry, LeadMetrics } from '../types/admission.types';

/**
 * Permission-scoped data layer for the inquiry workspace.
 * Receptionists fetch enquiries only; counselors/staff also fetch leads and follow-ups.
 */
export function useInquiryWorkspace(params?: Record<string, unknown>) {
    const { user, hasPermission, hasRole } = useAuth();

    const ctx = useMemo(
        () => ({
            roles: user?.roles ?? [],
            hasPermission,
            hasRole,
        }),
        [user?.roles, hasPermission, hasRole],
    );

    const canViewInquiries =
        hasPermission('admission.enquiry.view') ||
        hasPermission('admission.enquiry.create') ||
        hasPermission('admission.review') ||
        AdmissionPermissions.isReceptionist(ctx);

    const canManageLeads =
        hasPermission('admission.leads.manage') ||
        hasPermission('admission.review') ||
        AdmissionPermissions.isCounselor(ctx) ||
        AdmissionPermissions.isAdmissionOfficer(ctx);

    const canViewVisitors =
        hasPermission('admission.visitors.manage') ||
        hasPermission('admission.review') ||
        AdmissionPermissions.isReceptionist(ctx);

    const canFetchStats = hasPermission('admission.review');

    const leadsQuery = useLeadsQuery(params, { enabled: canManageLeads });
    const inquiriesQuery = useInquiriesQuery(params, { enabled: canViewInquiries });

    const followupsQuery = useQuery({
        queryKey: AdmissionEngine.cacheKeys.followups(params),
        queryFn: () => admissionApi.getFollowups(params).then(res => res.data),
        enabled: canManageLeads,
        staleTime: ADMISSION_STALE_TIME,
    });

    const visitorsQuery = useQuery({
        queryKey: AdmissionEngine.cacheKeys.visitors(params),
        queryFn: () => admissionApi.getVisitors(params).then(res => res.data),
        enabled: canViewVisitors,
        staleTime: ADMISSION_STALE_TIME,
    });

    const statsQuery = useQuery({
        queryKey: AdmissionEngine.cacheKeys.stats(),
        queryFn: () => admissionApi.getStats().then(res => res.data).catch(() => null),
        enabled: canFetchStats,
        staleTime: ADMISSION_STALE_TIME,
        retry: false,
    });

    const leads = useMemo(
        () => (canManageLeads ? mapLeads(leadsQuery.data, followupsQuery.data) : []),
        [canManageLeads, leadsQuery.data, followupsQuery.data],
    );

    const inquiries = useMemo(
        () => (canViewInquiries ? mapInquiries(inquiriesQuery.data) : []),
        [canViewInquiries, inquiriesQuery.data],
    );

    const followups = useMemo(
        () => (canManageLeads ? mapFollowups(followupsQuery.data) : []),
        [canManageLeads, followupsQuery.data],
    );

    const buckets = useMemo(() => categorizeFollowups(followups), [followups]);
    const todayLeadIds = useMemo(() => getTodayFollowupLeadIds(followups), [followups]);

    const visitors = useMemo(
        () =>
            canViewVisitors
                ? normalizeApiList<Record<string, unknown>>(visitorsQuery.data)
                : [],
        [canViewVisitors, visitorsQuery.data],
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

    const refetch = () =>
        Promise.all([
            canManageLeads ? leadsQuery.refetch() : Promise.resolve(),
            canViewInquiries ? inquiriesQuery.refetch() : Promise.resolve(),
            canManageLeads ? followupsQuery.refetch() : Promise.resolve(),
            canViewVisitors ? visitorsQuery.refetch() : Promise.resolve(),
            canFetchStats ? statsQuery.refetch() : Promise.resolve(),
        ]);

    useEffect(() => {
        const refresh = () => {
            void refetch();
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
            ADMISSION_EVENTS.TIMELINE_REFRESH,
        ].map(event => admissionEventBus.subscribe(event, refresh));
        return () => unsubs.forEach(u => u());
    }, [canManageLeads, canViewInquiries, canViewVisitors]);

    const activeQueries = [
        canManageLeads && leadsQuery,
        canViewInquiries && inquiriesQuery,
        canManageLeads && followupsQuery,
        canViewVisitors && visitorsQuery,
    ].filter(Boolean) as Array<{ isLoading: boolean; error: unknown }>;

    const isLoading = activeQueries.some(q => q.isLoading);
    const error = activeQueries.find(q => q.error)?.error ?? null;

    return {
        leads,
        inquiries,
        followups,
        buckets,
        todayLeadIds,
        metrics,
        allRecords,
        isLoading,
        error,
        refetch,
        canManageLeads,
        canViewInquiries,
    };
}

export default useInquiryWorkspace;
