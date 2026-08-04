import { useQuery } from '@tanstack/react-query';
import { DashboardQueryKeys } from '../core/DashboardQueryKeys';
import { apiClient } from '../../../lib/api-client';
import { DashboardNotification } from '../types/dashboard.types';
import { DASHBOARD_CONSTANTS } from '../constants/DashboardConstants';

export function useDashboardNotifications(role: string, refreshSignal: number) {
    return useQuery<DashboardNotification[], Error>({
        queryKey: [...DashboardQueryKeys.notifications(role), refreshSignal],
        queryFn: async () => {
            try {
                const res = await apiClient.get('/notifications');
                const list = res.data?.data || res.data || [];
                return list.map((item: any) => ({
                    id: item.id,
                    title: item.title || 'Notification',
                    message: item.message || '',
                    read: !!item.read_at,
                    timestamp: item.created_at || new Date().toISOString(),
                    type: item.type || 'info'
                }));
            } catch (e) {
                console.error("Notifications fetch fallback to empty", e);
                return [];
            }
        },
        staleTime: DASHBOARD_CONSTANTS.REFRESH_INTERVALS.NOTIFICATIONS,
        refetchInterval: DASHBOARD_CONSTANTS.REFRESH_INTERVALS.NOTIFICATIONS
    });
}

export default useDashboardNotifications;
