import { apiSlice } from '@/app/store/apiSlice';
import { ENDPOINTS } from './endpoints';

export type NotificationCategory = 'ADMISSION' | 'ATTENDANCE' | 'FEE' | 'EXAM' | 'SYSTEM';
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface NotificationItem {
  notification_id: string;
  org_id: string;
  recipient_user_id: string;
  category: NotificationCategory;
  type: string;
  priority: NotificationPriority;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  metadata: any | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetNotificationsParams {
  category?: NotificationCategory;
  is_read?: boolean;
  page?: number;
  limit?: number;
}

export const notificationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationListResponse, GetNotificationsParams | void>({
      query: (params) => ({
        url: ENDPOINTS.NOTIFICATIONS.BASE,
        params: params || {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.notifications.map(({ notification_id }) => ({
                type: 'Notification' as const,
                id: notification_id,
              })),
              { type: 'Notification', id: 'LIST' },
            ]
          : [{ type: 'Notification', id: 'LIST' }],
    }),

    getUnreadCount: builder.query<{ count: number }, void>({
      query: () => ({
        url: ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT,
      }),
      providesTags: [{ type: 'NotificationCount', id: 'COUNT' }],
    }),

    markAsRead: builder.mutation<NotificationItem, string>({
      query: (id) => ({
        url: ENDPOINTS.NOTIFICATIONS.MARK_READ(id),
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Notification', id },
        { type: 'Notification', id: 'LIST' },
        { type: 'NotificationCount', id: 'COUNT' },
      ],
    }),

    markAllAsRead: builder.mutation<{ count: number }, void>({
      query: () => ({
        url: ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ,
        method: 'POST',
      }),
      invalidatesTags: [
        { type: 'Notification', id: 'LIST' },
        { type: 'NotificationCount', id: 'COUNT' },
      ],
    }),

    deleteNotification: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: ENDPOINTS.NOTIFICATIONS.BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Notification', id },
        { type: 'Notification', id: 'LIST' },
        { type: 'NotificationCount', id: 'COUNT' },
      ],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useLazyGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} = notificationApi;
