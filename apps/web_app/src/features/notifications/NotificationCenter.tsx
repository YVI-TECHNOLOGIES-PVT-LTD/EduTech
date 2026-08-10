import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  NotificationService,
  ErpNotification,
  NotificationCategory,
} from '../../services/dashboard/NotificationService';
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  AlertCircle,
  Info,
  CheckCircle2,
  DollarSign,
  GraduationCap,
  Bus,
  CalendarCheck,
  Filter,
} from 'lucide-react';

const CATEGORY_TABS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'ADMISSION', label: 'Admission' },
  { id: 'ATTENDANCE', label: 'Attendance' },
  { id: 'FEE', label: 'Fee' },
  { id: 'EXAM', label: 'Exam' },
  { id: 'SYSTEM', label: 'System' },
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  ADMISSION: CheckCircle2,
  ATTENDANCE: CalendarCheck,
  FEE: DollarSign,
  EXAM: GraduationCap,
  TRANSPORT: Bus,
  SYSTEM: Info,
  ANNOUNCEMENT: Bell,
  LEAVE: CalendarCheck,
};

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: 'border-l-red-400 bg-red-50/30',
  MEDIUM: 'border-l-amber-400 bg-amber-50/20',
  LOW: 'border-l-blue-200 bg-blue-50/10',
};

function NotificationItem({
  notification,
  onMarkRead,
  onRemove,
}: {
  notification: ErpNotification;
  onMarkRead: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const Icon = CATEGORY_ICONS[notification.category] || Bell;
  const priorityStyle = PRIORITY_STYLES[notification.priority] || PRIORITY_STYLES['LOW'];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`flex items-start gap-3 p-3.5 border-l-2 ${priorityStyle} ${!notification.isRead ? 'bg-white' : 'bg-gray-50/50'} hover:bg-gray-50 transition-colors group`}
    >
      <div
        className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center mt-0.5 ${!notification.isRead ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-xs font-bold ${!notification.isRead ? 'text-gray-900' : 'text-gray-500'} truncate`}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1" />
          )}
        </div>
        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{notification.body}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[10px] text-gray-400 font-medium">
            {new Date(notification.createdAt).toLocaleString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              day: 'numeric',
              month: 'short',
            })}
          </span>
          <span
            className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${notification.priority === 'HIGH' ? 'bg-red-100 text-red-600' : notification.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}
          >
            {notification.priority}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!notification.isRead && (
          <button
            onClick={() => onMarkRead(notification.id)}
            title="Mark as read"
            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => onRemove(notification.id)}
          title="Remove"
          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

import { useAppDispatch, useAppSelector } from '../../app/store';
import {
  closePanel as closePanelAction,
  setFilter as setFilterAction,
  setUnreadCount as setUnreadCountAction,
} from '../../shared/store/notificationSlice';

export function NotificationCenter() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.notification.isOpen);
  const activeFilter = useAppSelector((state) => state.notification.activeFilter);

  const closePanel = useCallback(() => dispatch(closePanelAction()), [dispatch]);
  const setFilter = useCallback((filter: string) => dispatch(setFilterAction(filter)), [dispatch]);
  const setUnreadCount = useCallback((count: number) => dispatch(setUnreadCountAction(count)), [dispatch]);

  const [notifications, setNotifications] = useState<ErpNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);
    try {
      const res = await NotificationService.getNotifications(
        activeFilter === 'all' ? 'all' : (activeFilter as NotificationCategory),
      );
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (e) {
      console.error('Failed to load notifications', e);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, activeFilter, setUnreadCount]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await NotificationService.markRead(id);
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await NotificationService.markAllRead();
      setUnreadCount(0);
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await NotificationService.deleteNotification(id);
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePanel}
            className="fixed inset-0 z-40 bg-black/20"
          />

          {/* Slide-over panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-gray-900">Notifications</h2>
                  {unreadCount > 0 && (
                    <p className="text-[10px] text-gray-400 font-medium">{unreadCount} unread</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    title="Mark all as read"
                    className="p-2 text-gray-400 hover:text-primary transition-colors rounded-lg hover:bg-primary/5"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={closePanel}
                  className="p-2 text-gray-400 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-1 p-2 border-b border-gray-100 overflow-x-auto">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black whitespace-nowrap transition-colors ${activeFilter === tab.id ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center p-8 text-gray-400 text-xs font-medium">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-3">
                    <Bell className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-gray-700">No notifications</p>
                  <p className="text-[11px] text-gray-400 mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {(() => {
                    const now = new Date();
                    const startOfToday = new Date(
                      now.getFullYear(),
                      now.getMonth(),
                      now.getDate(),
                    ).getTime();
                    const startOfYesterday = startOfToday - 86400000;

                    const todayList = notifications.filter(
                      (n: any) => new Date(n.createdAt).getTime() >= startOfToday,
                    );
                    const yesterdayList = notifications.filter((n: any) => {
                      const t = new Date(n.createdAt).getTime();
                      return t >= startOfYesterday && t < startOfToday;
                    });
                    const earlierList = notifications.filter(
                      (n: any) => new Date(n.createdAt).getTime() < startOfYesterday,
                    );

                    const renderSection = (title: string, list: any[]) => {
                      if (list.length === 0) return null;
                      return (
                        <div key={title} className="space-y-1">
                          <div className="px-4 py-2 bg-gray-50/50 dark:bg-card/5 text-[9px] font-black text-muted-foreground uppercase tracking-widest border-y border-gray-100/50">
                            {title}
                          </div>
                          <AnimatePresence>
                            {list.map((notification) => (
                              <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onMarkRead={handleMarkRead}
                                onRemove={handleRemove}
                              />
                            ))}
                          </AnimatePresence>
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
            <div className="p-3 border-t border-gray-100 text-center">
              <a
                href="/app/notifications"
                className="text-xs font-bold text-primary hover:underline"
              >
                View all notifications →
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
