import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../../../api/notifications.api';
import { QUERY_KEYS } from '../../../api/query-keys';
import { NotificationItem } from '../../../types/notification.types';

export function deduplicateNotifications(items: NotificationItem[]): NotificationItem[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const result: NotificationItem[] = [];

  for (const item of items) {
    if (!item || !item.notification_id) continue;
    if (!seen.has(item.notification_id)) {
      seen.add(item.notification_id);
      result.push(item);
    }
  }

  return result;
}

export function useNotifications() {
  const query = useQuery<NotificationItem[], Error>({
    queryKey: QUERY_KEYS.notifications.all,
    queryFn: async () => {
      const list = await notificationsApi.list();
      return deduplicateNotifications(list);
    },
    staleTime: 1000 * 60, // 1 minute
    select: (data) => deduplicateNotifications(data),
  });

  return {
    ...query,
    notifications: query.data || [],
  };
}
