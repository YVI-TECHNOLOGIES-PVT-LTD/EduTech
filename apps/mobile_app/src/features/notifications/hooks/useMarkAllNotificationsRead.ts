import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../../api/notifications.api';
import { QUERY_KEYS } from '../../../api/query-keys';
import { NotificationItem } from '../../../types/notification.types';

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, void>({
    mutationFn: () => notificationsApi.markAllRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.notifications.all });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.notifications.unreadCount });

      const previousNotifications = queryClient.getQueryData<NotificationItem[]>(
        QUERY_KEYS.notifications.all,
      );
      const previousUnreadCount = queryClient.getQueryData<number>(
        QUERY_KEYS.notifications.unreadCount,
      );

      // Optimistically mark all as read
      if (previousNotifications) {
        queryClient.setQueryData<NotificationItem[]>(
          QUERY_KEYS.notifications.all,
          previousNotifications.map((item) => ({
            ...item,
            is_read: true,
            read_at: new Date().toISOString(),
          })),
        );
      }

      queryClient.setQueryData<number>(QUERY_KEYS.notifications.unreadCount, 0);

      return { previousNotifications, previousUnreadCount };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(QUERY_KEYS.notifications.all, context.previousNotifications);
      }
      if (context?.previousUnreadCount !== undefined) {
        queryClient.setQueryData(QUERY_KEYS.notifications.unreadCount, context.previousUnreadCount);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.unreadCount });
    },
  });
}
