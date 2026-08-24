import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../../api/notifications.api';
import { QUERY_KEYS } from '../../../api/query-keys';
import { NotificationItem } from '../../../types/notification.types';

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, string>({
    mutationFn: (notificationId: string) => notificationsApi.markRead(notificationId),
    onMutate: async (notificationId: string) => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.notifications.all });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.notifications.unreadCount });

      // Snapshot previous values
      const previousNotifications = queryClient.getQueryData<NotificationItem[]>(
        QUERY_KEYS.notifications.all,
      );
      const previousUnreadCount = queryClient.getQueryData<number>(
        QUERY_KEYS.notifications.unreadCount,
      );

      // Optimistically update list
      if (previousNotifications) {
        queryClient.setQueryData<NotificationItem[]>(
          QUERY_KEYS.notifications.all,
          previousNotifications.map((item) =>
            item.notification_id === notificationId
              ? { ...item, is_read: true, read_at: new Date().toISOString() }
              : item,
          ),
        );
      }

      // Optimistically update unread count
      if (typeof previousUnreadCount === 'number' && previousUnreadCount > 0) {
        queryClient.setQueryData<number>(
          QUERY_KEYS.notifications.unreadCount,
          Math.max(0, previousUnreadCount - 1),
        );
      }

      return { previousNotifications, previousUnreadCount };
    },
    onError: (_err, _id, context: any) => {
      // Rollback to previous state on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(QUERY_KEYS.notifications.all, context.previousNotifications);
      }
      if (context?.previousUnreadCount !== undefined) {
        queryClient.setQueryData(QUERY_KEYS.notifications.unreadCount, context.previousUnreadCount);
      }
    },
    onSettled: () => {
      // Invalidate to guarantee synchronization with backend
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.unreadCount });
    },
  });
}
