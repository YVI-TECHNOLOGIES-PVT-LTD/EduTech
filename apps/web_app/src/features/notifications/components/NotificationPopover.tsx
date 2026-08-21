import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, ExternalLink, ArrowRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { openPanel } from '@/shared/store/notificationSlice';
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} from '@/shared/api/notification.api';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { NotificationBell } from './NotificationBell';
import { NotificationItem } from './NotificationItem';
import { NotificationEmptyState } from './NotificationEmptyState';
import { NotificationLoadingState } from './NotificationLoadingState';
import { NotificationErrorState } from './NotificationErrorState';
import { normalizeNotifications } from '../utils/notification.utils';
import { cn } from '@/lib/utils';

export interface NotificationPopoverProps {
  align?: 'start' | 'center' | 'end';
  className?: string;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  align = 'end',
  className,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  // 1. Fetch unread count for the bell trigger badge
  const { data: unreadData } = useGetUnreadCountQuery(undefined, {
    skip: !isAuthenticated,
    pollingInterval: 30000,
  });
  const unreadCount = unreadData?.count ?? 0;

  // 2. Fetch notifications list (lazy when open or unread present)
  const {
    data: rawData,
    isLoading,
    isError,
    refetch,
  } = useGetNotificationsQuery(
    { limit: 20 },
    {
      skip: !isAuthenticated,
      pollingInterval: isOpen ? 15000 : 60000,
    },
  );

  // 3. Normalized & deduplicated notification list
  const notifications = React.useMemo(() => normalizeNotifications(rawData), [rawData]);

  // 4. Mutations
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const handleMarkRead = useCallback(
    async (id: string) => {
      try {
        await markAsRead(id).unwrap();
      } catch (err) {
        console.error('Failed to mark notification read:', err);
      }
    },
    [markAsRead],
  );

  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllAsRead().unwrap();
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  }, [markAllAsRead]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteNotification(id).unwrap();
      } catch (err) {
        console.error('Failed to delete notification:', err);
      }
    },
    [deleteNotification],
  );

  const handleNavigate = useCallback(
    (url: string) => {
      setIsOpen(false);
      if (url.startsWith('/')) {
        navigate(url);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    },
    [navigate],
  );

  const handleOpenFullCenter = useCallback(() => {
    setIsOpen(false);
    dispatch(openPanel());
  }, [dispatch]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        render={(triggerProps) => (
          <NotificationBell
            {...triggerProps}
            unreadCount={unreadCount}
            isOpen={isOpen}
            className={className}
          />
        )}
      />

      <PopoverContent
        align={align}
        side="bottom"
        sideOffset={8}
        className={cn(
          'w-[calc(100vw-2rem)] sm:w-[440px] md:w-[460px] p-0 overflow-hidden',
          'rounded-2xl border border-border/80 bg-popover/95 backdrop-blur-xl',
          'shadow-2xl ring-1 ring-black/5 dark:ring-white/10 z-50 animate-in fade-in-0 zoom-in-95',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black text-foreground tracking-tight">Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                disabled={isMarkingAll}
                onClick={handleMarkAllRead}
                title="Mark all as read"
                className="text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenFullCenter}
              className="text-[11px] font-semibold text-primary hover:underline cursor-pointer flex items-center gap-0.5 ml-1"
            >
              View all
            </button>
          </div>
        </div>

        {/* Scrollable Notification List */}
        <div className="max-h-[380px] sm:max-h-[420px] overflow-y-auto overscroll-contain divide-y divide-border/40 scrollbar-thin">
          {isLoading && notifications.length === 0 ? (
            <NotificationLoadingState count={3} />
          ) : isError ? (
            <NotificationErrorState onRetry={refetch} />
          ) : notifications.length === 0 ? (
            <NotificationEmptyState />
          ) : (
            notifications.map((item) => (
              <NotificationItem
                key={item.notification_id}
                notification={item}
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
                onNavigate={handleNavigate}
                compact
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 border-t border-border/60 bg-muted/10 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground pl-2 font-medium">
            {notifications.length > 0 ? `Showing recent updates` : `All caught up`}
          </p>

          <button
            type="button"
            onClick={handleOpenFullCenter}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-bold text-primary',
              'hover:bg-primary/10 transition-colors flex items-center gap-1.5 cursor-pointer',
            )}
          >
            <span>Open Notification Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
