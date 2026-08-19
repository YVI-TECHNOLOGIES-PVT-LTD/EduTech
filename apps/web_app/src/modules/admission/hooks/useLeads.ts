import { useMemo } from 'react';
import { useGetLeadsQuery, useGetCampusVisitsQuery } from '@/shared/api/crm.api';
import { useAuth } from '../../../context/AuthContext';

export function useLeadsQuery(params?: Record<string, unknown>, options?: { enabled?: boolean }) {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('admission.leads.manage');
  const isEnabled = options?.enabled ?? canManage;
  return useGetLeadsQuery(undefined, { skip: !isEnabled });
}

export function useInquiriesQuery(
  params?: Record<string, unknown>,
  options?: { enabled?: boolean },
) {
  const { hasPermission } = useAuth();
  const canView = hasPermission('admission.enquiry.view');
  const isEnabled = options?.enabled ?? canView;
  return useGetLeadsQuery(undefined, { skip: !isEnabled });
}

export function useLeads(params?: Record<string, unknown>, options?: { enabled?: boolean }) {
  const query = useLeadsQuery(params, options);
  const leads = Array.isArray(query.data) ? query.data : query.data?.data || [];

  return {
    leads,
    raw: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useLeadDashboard(params?: Record<string, unknown>) {
  const leadsQuery = useGetLeadsQuery(undefined);
  const visitsQuery = useGetCampusVisitsQuery(undefined);

  const leads = useMemo(() => {
    if (Array.isArray(leadsQuery.data)) return leadsQuery.data;
    return leadsQuery.data?.data || [];
  }, [leadsQuery.data]);

  const visitors = useMemo(() => {
    if (Array.isArray(visitsQuery.data)) return visitsQuery.data;
    return visitsQuery.data?.items || visitsQuery.data?.data || [];
  }, [visitsQuery.data]);

  return {
    leads,
    inquiries: [],
    followups: [],
    visitors,
    metrics: {
      totalLeads: leads.length,
      totalInquiries: 0,
      totalFollowups: 0,
      totalVisitors: visitors.length,
    },
    allRecords: leads,
    isLoading: leadsQuery.isLoading || visitsQuery.isLoading,
    refetch: () => Promise.all([leadsQuery.refetch(), visitsQuery.refetch()]),
  };
}
