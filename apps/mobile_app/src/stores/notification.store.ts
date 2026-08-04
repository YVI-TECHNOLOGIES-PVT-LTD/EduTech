import { create } from 'zustand';

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  unreadCount: number;
  notifications: InAppNotification[];
  setNotifications: (notifications: InAppNotification[]) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  notifications: [],
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    }),
  markAsRead: (id) =>
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      );
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    }),
  clearNotifications: () => set({ unreadCount: 0, notifications: [] }),
}));
