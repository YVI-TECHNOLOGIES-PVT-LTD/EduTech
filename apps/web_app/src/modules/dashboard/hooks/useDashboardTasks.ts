import { useGetDashboardSummaryQuery } from '@/shared/api/dashboard.api';
import { DashboardTask } from '../types/dashboard.types';

export function useDashboardTasks(role: string, refreshSignal?: number) {
  const { data, isLoading, error, refetch } = useGetDashboardSummaryQuery();

  const tasks: DashboardTask[] = (data?.pendingTasks || []).map((item) => ({
    id: item.id,
    title: item.title,
    status: 'pending',
    dueDate: item.dueDate,
    priority: (item.priority?.toLowerCase() as 'high' | 'medium' | 'low') || 'medium',
    description: '',
  }));

  return {
    data: tasks,
    isLoading,
    error,
    refetch,
  };
}

export default useDashboardTasks;
