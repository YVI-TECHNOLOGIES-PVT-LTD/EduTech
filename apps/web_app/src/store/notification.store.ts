import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ErpNotification } from '../services/dashboard/NotificationService';

interface NotificationStore {
    notifications: ErpNotification[];
    unreadCount: number;
    isOpen: boolean;
    activeFilter: string;

    // Actions
    setNotifications: (notifications: ErpNotification[]) => void;
    addNotification: (notification: ErpNotification) => void;
    markRead: (id: string) => void;
    markAllRead: () => void;
    removeNotification: (id: string) => void;
    clearAll: () => void;
    setUnreadCount: (count: number) => void;
    openPanel: () => void;
    closePanel: () => void;
    togglePanel: () => void;
    setFilter: (filter: string) => void;
}

export const useNotificationStore = create<NotificationStore>()(
    persist(
        (set, get) => ({
            notifications: [],
            unreadCount: 0,
            isOpen: false,
            activeFilter: 'all',

            setNotifications: (notifications) => {
                const unreadCount = notifications.filter(n => !n.isRead).length;
                set({ notifications, unreadCount });
            },

            addNotification: (notification) => {
                const notifications = [notification, ...get().notifications];
                const unreadCount = notifications.filter(n => !n.isRead).length;
                set({ notifications, unreadCount });
            },

            markRead: (id) => {
                const notifications = get().notifications.map(n =>
                    n.id === id ? { ...n, isRead: true } : n
                );
                const unreadCount = notifications.filter(n => !n.isRead).length;
                set({ notifications, unreadCount });
            },

            markAllRead: () => {
                const notifications = get().notifications.map(n => ({ ...n, isRead: true }));
                set({ notifications, unreadCount: 0 });
            },

            removeNotification: (id) => {
                const notifications = get().notifications.filter(n => n.id !== id);
                const unreadCount = notifications.filter(n => !n.isRead).length;
                set({ notifications, unreadCount });
            },

            clearAll: () => set({ notifications: [], unreadCount: 0 }),

            setUnreadCount: (count) => set({ unreadCount: count }),

            openPanel: () => set({ isOpen: true }),
            closePanel: () => set({ isOpen: false }),
            togglePanel: () => set(s => ({ isOpen: !s.isOpen })),
            setFilter: (filter) => set({ activeFilter: filter }),
        }),
        {
            name: 'erp-notifications',
            partialize: (state) => ({
                notifications: state.notifications.slice(0, 50), // Persist max 50
                unreadCount: state.unreadCount,
            }),
        }
    )
);
