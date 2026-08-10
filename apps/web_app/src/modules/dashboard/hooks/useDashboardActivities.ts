import { useGetDashboardSummaryQuery } from '@/shared/api/dashboard.api';
import { DashboardFilter, DashboardActivity } from '../types/dashboard.types';

export function useDashboardActivities(role: string, filters?: DashboardFilter, refreshSignal?: number) {
  const { data, isLoading, error, refetch } = useGetDashboardSummaryQuery();

  const activities: DashboardActivity[] = (data?.recentActivities || []).map((item) => ({
    id: item.id,
    title: item.action,
    description: item.description,
    timestamp: item.timestamp,
  }));

  return {
    data: activities,
    isLoading,
    error,
    refetch,
  };
}

export default useDashboardActivities;
