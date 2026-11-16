import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer, PageHeader } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  NotificationCategory,
  useDeleteNotificationMutation,
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAllAsReadMutation,
  useMarkAsReadMutation,
} from '@/shared/api/notification.api';
import {
  formatRelativeTime,
  getCategoryConfig,
  getNotificationActionUrl,
  getPriorityBadge,
  normalizeNotifications,
} from '@/features/notifications/utils/notification.utils';
import { ParentErrorState, ParentLoadingSkeleton } from '../components/ParentStates';

const CATEGORY_TABS: Array<{ value: 'ALL' | NotificationCategory; label: string }> = [
  { value: 'ALL', label: 'All Updates' },
  { value: 'ADMISSION', label: 'Admissions' },
  { value: 'FEE', label: 'Fees' },
  { value: 'ATTENDANCE', label: 'Attendance' },
  { value: 'EXAM', label: 'Academics & Exams' },
  { value: 'SYSTEM', label: 'School & System' },
];

export const ParentNotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState<'ALL' | NotificationCategory>('ALL');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);

  const { data: unreadData } = useGetUnreadCountQuery();
  const { data, isLoading, isError, refetch } = useGetNotificationsQuery({
    category: category === 'ALL' ? undefined : category,
    is_read: unreadOnly ? false : undefined,
    page,
    limit: 20,
  });

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const items = normalizeNotifications(data);
  const unreadCount = unreadData?.count ?? data?.unreadCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const handleMarkOneRead = async (id: string) => {
    try {
      await markAsRead(id).unwrap();
    } catch {
      toast.error('Failed to mark notification as read.');
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllAsRead().unwrap();
      toast.success('All notifications marked as read.');
    } catch {
      toast.error('Unable to mark all notifications as read.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id).unwrap();
      toast.success('Notification removed.');
    } catch {
      toast.error('Unable to remove notification.');
    }
  };

  const handleOpenAction = async (id: string, isRead: boolean, url: string | null) => {
    if (!isRead) {
      markAsRead(id).catch(() => {});
    }
    if (url && url.startsWith('/')) {
      navigate(url);
    }
  };

  return (
    <PageContainer data-testid="parent-notifications-page">
      <PageHeader
        title="Notifications"
        description="School announcements, admission updates, fee reminders, and real-time account alerts."
        badge={
          <Badge variant={unreadCount > 0 ? 'info' : 'secondary'} className="text-[10px] font-bold">
            {unreadCount} Unread
          </Badge>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAll}
            disabled={unreadCount === 0 || isMarkingAll}
            className="gap-1.5 rounded-xl"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All Read</span>
          </Button>
        }
      />

      <div className="space-y-5">
        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORY_TABS.map((tab) => (
              <Button
                key={tab.value}
                size="sm"
                variant={category === tab.value ? 'default' : 'outline'}
                onClick={() => {
                  setCategory(tab.value);
                  setPage(1);
                }}
                className="rounded-xl text-xs"
              >
                {tab.label}
              </Button>
            ))}
          </div>

          <Button
            size="sm"
            variant={unreadOnly ? 'default' : 'outline'}
            onClick={() => {
              setUnreadOnly((v) => !v);
              setPage(1);
            }}
            className="rounded-xl text-xs self-start sm:self-auto"
          >
            {unreadOnly ? 'Showing Unread Only' : 'Unread Only'}
          </Button>
        </div>

        {isLoading ? (
          <ParentLoadingSkeleton cards={2} />
        ) : isError ? (
          <ParentErrorState onRetry={refetch} />
        ) : items.length === 0 ? (
          <Card className="p-10 rounded-2xl border-border bg-card text-center space-y-2">
            <Bell className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-bold text-foreground">No Notifications Found</p>
            <p className="text-xs text-muted-foreground">
              {unreadOnly
                ? 'You have caught up on all unread notifications.'
                : 'No notifications match the selected category.'}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const cat = getCategoryConfig(item.category);
              const priority = getPriorityBadge(item.priority);
              const CatIcon = cat.icon;
              const actionUrl = getNotificationActionUrl(item);

              return (
                <Card
                  key={item.notification_id}
                  className={cn(
                    'p-4 sm:p-5 rounded-2xl border transition-all',
                    !item.is_read ? 'border-primary/40 bg-primary/[0.03]' : 'border-border bg-card',
                  )}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5',
                        cat.bgClass,
                      )}
                    >
                      <CatIcon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          {!item.is_read && (
                            <span
                              className={cn(
                                'w-2 h-2 rounded-full ring-2 shrink-0',
                                priority.dotClass,
                              )}
                            />
                          )}
                          <h3 className="text-sm font-extrabold text-foreground truncate">
                            {item.title}
                          </h3>
                          <Badge variant="outline" className="text-[10px] font-semibold">
                            {cat.label}
                          </Badge>
                          {(item.priority === 'URGENT' || item.priority === 'HIGH') && (
                            <Badge
                              variant="outline"
                              className={cn('text-[10px] font-bold', priority.badgeClass)}
                            >
                              {priority.label}
                            </Badge>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground font-medium shrink-0">
                          {formatRelativeTime(item.created_at)}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.message}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {actionUrl && actionUrl.startsWith('/') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleOpenAction(item.notification_id, item.is_read, actionUrl)
                            }
                            className="h-7 px-2.5 text-[11px] rounded-lg gap-1"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        )}
                        {!item.is_read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkOneRead(item.notification_id)}
                            className="h-7 px-2.5 text-[11px] rounded-lg gap-1 text-primary"
                          >
                            <Check className="w-3 h-3" />
                            <span>Mark Read</span>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(item.notification_id)}
                          className="h-7 px-2 text-[11px] rounded-lg text-muted-foreground hover:text-destructive ml-auto"
                          aria-label="Delete notification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="gap-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default ParentNotificationsPage;
