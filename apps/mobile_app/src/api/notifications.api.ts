import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import {
  NotificationItem,
  NotificationListResponse,
  UnreadCountResponse,
} from '../types/notification.types';

export const notificationsApi = {
  /**
   * List Notifications: GET /v1/notifications
   */
  async list(params?: { page?: number; limit?: number }): Promise<NotificationItem[]> {
    const res = params
      ? await apiClient.get<any>(ENDPOINTS.NOTIFICATIONS.LIST, { params })
      : await apiClient.get<any>(ENDPOINTS.NOTIFICATIONS.LIST);
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.notifications)) return res.notifications;
    return [];
  },

  /**
   * Get Unread Count: GET /v1/notifications/unread-count
   */
  async getUnreadCount(): Promise<number> {
    const res = await apiClient.get<UnreadCountResponse | any>(
      ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT,
    );
    return res?.unread_count ?? res?.count ?? 0;
  },

  /**
   * Mark Single Notification as Read: PATCH /v1/notifications/:id/read
   */
  async markRead(id: string): Promise<any> {
    return apiClient.patch<any>(ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
  },

  /**
   * Mark All Notifications as Read: POST /v1/notifications/mark-all-read
   */
  async markAllRead(): Promise<any> {
    return apiClient.post<any>(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
  },
};
