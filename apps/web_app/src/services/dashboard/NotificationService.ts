import { apiClient } from '../../lib/api-client';

export type NotificationPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type NotificationCategory =
    | 'ADMISSION' | 'ATTENDANCE' | 'FEE' | 'EXAM'
    | 'TRANSPORT' | 'SYSTEM' | 'ANNOUNCEMENT' | 'LEAVE';

export interface ErpNotification {
    id: string;
    title: string;
    body: string;
    category: NotificationCategory;
    priority: NotificationPriority;
    isRead: boolean;
    createdAt: string;
    link?: string;
}

export interface NotificationListResponse {
    notifications: ErpNotification[];
    total: number;
    unreadCount: number;
}

export const NotificationService = {
    /**
     * Fetch paginated ERP notifications for the current user.
     */
    getNotifications: async (
        filter?: NotificationCategory | 'all',
        page = 1,
        limit = 20,
    ): Promise<NotificationListResponse> => {
        const res = await apiClient.get('/notifications', {
            params: { filter: filter || 'all', page, limit },
        });
        return res.data;
    },

    /**
     * Get unread notification count (for badge display).
     */
    getUnreadCount: async (): Promise<number> => {
        const res = await apiClient.get('/notifications/unread-count');
        return res.data.count ?? 0;
    },

    /**
     * Mark a single notification as read.
     */
    markRead: async (id: string): Promise<void> => {
        await apiClient.patch(`/notifications/${id}/read`);
    },

    /**
     * Mark all notifications as read.
     */
    markAllRead: async (): Promise<void> => {
        await apiClient.post('/notifications/mark-all-read');
    },

    /**
     * Delete a single notification.
     */
    deleteNotification: async (id: string): Promise<void> => {
        await apiClient.delete(`/notifications/${id}`);
    },
};
