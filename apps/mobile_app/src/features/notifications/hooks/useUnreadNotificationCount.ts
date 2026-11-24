import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../../../api/notifications.api';
import { QUERY_KEYS } from '../../../api/query-keys';
import { useAuthStore } from '../../../stores/auth.store';

export function useUnreadNotificationCount() {
  const { isAuthenticated } = useAuthStore();
  return useQuery<number, Error>({
    queryKey: QUERY_KEYS.notifications.unreadCount,
    queryFn: () => notificationsApi.getUnreadCount(),
    staleTime: 1000 * 30, // 30 seconds
    enabled: Boolean(isAuthenticated),
  });
}
