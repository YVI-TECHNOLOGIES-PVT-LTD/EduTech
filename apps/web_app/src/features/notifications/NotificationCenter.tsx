import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { closePanel, setFilter } from '../../shared/store/notificationSlice';
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  NotificationCategory,
  NotificationItem as NotificationItemType,
} from '@/shared/api/notification.api';
import { Bell, X, CheckCheck } from 'lucide-react';
import { NotificationItem } from './components/NotificationItem';
import { NotificationEmptyState } from './components/NotificationEmptyState';
import { NotificationLoadingState } from './components/NotificationLoadingState';
import { NotificationErrorState } from './components/NotificationErrorState';
import { normalizeNotifications } from './utils/notification.utils';

const CATEGORY_TABS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'ADMISSION', label: 'Admission' },
  { id: 'ATTENDANCE', label: 'Attendance' },
  { id: 'FEE', label: 'Fee' },
  { id: 'EXAM', label: 'Exam' },
  { id: 'SYSTEM', label: 'System' },
];

export function NotificationCenter() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const isOpen = useAppSelector((state) => state.notification.isOpen);
  const activeFilter = useAppSelector((state) => state.notification.activeFilter);

  const queryParams = {
    category: activeFilter === 'all' ? undefined : (activeFilter as NotificationCategory),
    limit: 50,
  };

  const {
    data: rawData,
    isLoading,
    isError,
    refetch,
  } = useGetNotificationsQuery(queryParams, {
    skip: !isOpen || !isAuthenticated,
    pollingInterval: 30000,
  });

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const handleClose = useCallback(() => dispatch(closePanel()), [dispatch]);
  const handleSetFilter = useCallback((filter: string) => dispatch(setFilter(filter)), [dispatch]);

  const notifications = React.useMemo(() => normalizeNotifications(rawData), [rawData]);
  const unreadCount = rawData?.unreadCount ?? notifications.filter((n) => !n.is_read).length;

  const handleMarkRead = async (id: string) => {
    try {
      await markAsRead(id).unwrap();
    } catch (e) {
      console.error('Failed to mark notification as read', e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead().unwrap();
    } catch (e) {
      console.error('Failed to mark all notifications as read', e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id).unwrap();
    } catch (e) {
      console.error('Failed to delete notification', e);
    }
  };

  const handleNavigate = (url: string) => {
    handleClose();
    if (url.startsWith('/')) {
      navigate(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
          />

          {/* Slide-over panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm sm:max-w-md bg-background border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary/10 text-primary rounded-xl flex items-center justify-center border border-primary/20 shadow-2xs">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-foreground">Notification Center</h2>
                  {unreadCount > 0 && (
                    <p className="text-[10px] text-muted-foreground font-medium">
                      {unreadCount} unread alert{unreadCount > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    disabled={isMarkingAll}
                    onClick={handleMarkAllRead}
                    title="Mark all as read"
                    className="px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Mark all read</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Close panel"
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-1.5 p-2 border-b border-border/80 overflow-x-auto bg-card scrollbar-none">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSetFilter(tab.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeFilter === tab.id
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {isLoading ? (
                <NotificationLoadingState count={4} />
              ) : isError ? (
                <NotificationErrorState onRetry={refetch} />
              ) : notifications.length === 0 ? (
                <NotificationEmptyState
                  title="No notifications found"
                  description={
                    activeFilter !== 'all'
                      ? `No notifications in ${activeFilter.toLowerCase()} category.`
                      : "You're all caught up! No recent alerts."
                  }
                />
              ) : (
                <div className="divide-y divide-border/40">
                  {(() => {
                    const now = new Date();
                    const startOfToday = new Date(
                      now.getFullYear(),
                      now.getMonth(),
                      now.getDate(),
                    ).getTime();
                    const startOfYesterday = startOfToday - 86400000;

                    const todayList = notifications.filter(
                      (n) => new Date(n.created_at).getTime() >= startOfToday,
                    );
                    const yesterdayList = notifications.filter((n) => {
                      const t = new Date(n.created_at).getTime();
                      return t >= startOfYesterday && t < startOfToday;
                    });
                    const earlierList = notifications.filter(
                      (n) => new Date(n.created_at).getTime() < startOfYesterday,
                    );

                    const renderSection = (title: string, list: NotificationItemType[]) => {
                      if (list.length === 0) return null;
                      return (
                        <div key={title} className="space-y-0">
                          <div className="px-4 py-1.5 bg-muted/40 text-[10px] font-black text-muted-foreground uppercase tracking-wider border-y border-border/40">
                            {title}
                          </div>
                          <div className="divide-y divide-border/40">
                            {list.map((notification) => (
                              <NotificationItem
                                key={notification.notification_id}
                                notification={notification}
                                onMarkRead={handleMarkRead}
                                onDelete={handleDelete}
                                onNavigate={handleNavigate}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    };

                    return [
                      renderSection('Today', todayList),
                      renderSection('Yesterday', yesterdayList),
                      renderSection('Earlier', earlierList),
                    ];
                  })()}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border bg-muted/10 text-center">
              <span className="text-xs text-muted-foreground font-medium">
                EduTrack ERP Notification Center
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
