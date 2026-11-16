import { useGetDashboardSummaryQuery } from '@/shared/api/dashboard.api';
import { DashboardNotification } from '../types/dashboard.types';

export function useDashboardNotifications(role?: string, refreshSignal?: number) {
  const { data, isLoading, error, refetch } = useGetDashboardSummaryQuery();

  const notifications: DashboardNotification[] = (data?.recentActivities || []).map((item) => ({
    id: item.id,
    title: item.action,
    message: item.description,
    read: false,
    timestamp: item.timestamp,
    type: 'info',
  }));

  return {
    data: notifications,
    isLoading,
    error,
    refetch,
  };
}

export default useDashboardNotifications;
