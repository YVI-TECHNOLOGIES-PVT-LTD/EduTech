import { useQuery } from '@tanstack/react-query';
import { DashboardQueryKeys } from '../core/DashboardQueryKeys';
import { apiClient } from '../../../lib/api-client';
import { DashboardFilter, DashboardActivity } from '../types/dashboard.types';
import { DASHBOARD_CONSTANTS } from '../constants/DashboardConstants';

export function useDashboardActivities(role: string, filters: DashboardFilter, refreshSignal: number) {
    return useQuery<DashboardActivity[], Error>({
        queryKey: [...DashboardQueryKeys.activities(role, filters), refreshSignal],
        queryFn: async () => {
            // Reuses timeline queries if applicable
            try {
                if (role === DASHBOARD_CONSTANTS.ROLES.STUDENT || role === DASHBOARD_CONSTANTS.ROLES.PARENT) {
                    const res = await apiClient.get('/dashboard/timeline');
                    return (res.data || []).map((item: any) => ({
                        id: item.id || Math.random().toString(),
                        title: item.event_name || 'Activity Logged',
                        description: item.remarks || item.details || '',
                        timestamp: item.created_at || new Date().toISOString()
                    }));
                }
            } catch (e) {
                console.error("Activities load failed, falling back to empty feed", e);
            }
            return [];
        },
        staleTime: DASHBOARD_CONSTANTS.REFRESH_INTERVALS.ACTIVITIES,
        refetchOnWindowFocus: true
    });
}

export default useDashboardActivities;
