import { useQuery } from '@tanstack/react-query';
import { DashboardQueryKeys } from '../core/DashboardQueryKeys';
import { apiClient } from '../../../lib/api-client';
import { DashboardTask } from '../types/dashboard.types';
import { DASHBOARD_CONSTANTS } from '../constants/DashboardConstants';

export function useDashboardTasks(role: string, refreshSignal: number) {
    return useQuery<DashboardTask[], Error>({
        queryKey: [...DashboardQueryKeys.tasks(role), refreshSignal],
        queryFn: async () => {
            try {
                // Reuses workflows tasks API if applicable
                const res = await apiClient.get('/v1/tasks');
                const list = res.data || [];
                return list.map((item: any) => ({
                    id: item.id,
                    title: item.title || 'Task Assigned',
                    status: item.status || 'pending',
                    dueDate: item.due_date,
                    assignedTo: item.assigned_to,
                    priority: item.priority || 'medium',
                    description: item.description || ''
                }));
            } catch (e) {
                console.error("Tasks fetch fallback to empty list", e);
                return [];
            }
        },
        staleTime: DASHBOARD_CONSTANTS.REFRESH_INTERVALS.TASKS
    });
}

export default useDashboardTasks;
