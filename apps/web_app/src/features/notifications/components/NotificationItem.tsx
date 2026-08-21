import React from 'react';
import { ExternalLink, Check, Trash2 } from 'lucide-react';
import type { NotificationItem as NotificationItemType } from '@/shared/api/notification.api';
import {
  formatRelativeTime,
  getCategoryConfig,
  getPriorityBadge,
} from '../utils/notification.utils';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: NotificationItemType;
  onMarkRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onNavigate?: (url: string) => void;
  compact?: boolean;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkRead,
  onDelete,
  onNavigate,
  compact = false,
}) => {
  const categoryConfig = getCategoryConfig(notification.category);
  const priorityConfig = getPriorityBadge(notification.priority);
  const CategoryIcon = categoryConfig.icon;
  const isUnread = !notification.is_read;

  const handleClick = () => {
    if (isUnread && onMarkRead) {
      onMarkRead(notification.notification_id);
    }
    if (notification.action_url && onNavigate) {
      onNavigate(notification.action_url);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'group relative flex items-start gap-3 p-3.5 transition-all text-left cursor-pointer select-none',
        'hover:bg-muted/60 focus-visible:outline-hidden focus-visible:bg-muted/80',
        isUnread
          ? 'bg-card'
          : 'bg-transparent text-muted-foreground/90 opacity-85 hover:opacity-100',
      )}
    >
      {/* Category Avatar / Icon */}
      <div
        className={cn(
          'w-9 h-9 rounded-full shrink-0 flex items-center justify-center border shadow-2xs mt-0.5 transition-transform group-hover:scale-105',
          categoryConfig.bgClass,
        )}
      >
        <CategoryIcon className="w-4 h-4 stroke-[2]" />
      </div>

      {/* Content Body */}
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-baseline justify-between gap-1.5 mb-0.5">
          <p
            className={cn(
              'text-xs font-semibold truncate',
              isUnread ? 'text-foreground font-bold' : 'text-foreground/80',
            )}
          >
            {notification.title}
          </p>
        </div>

        <p
          className={cn(
            'text-[11px] leading-relaxed line-clamp-2',
            isUnread ? 'text-muted-foreground' : 'text-muted-foreground/75',
          )}
        >
          {notification.message}
        </p>

        {/* Footer Meta & Action Links */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] font-medium text-muted-foreground/70">
            {formatRelativeTime(notification.created_at)}
          </span>

          {notification.priority && notification.priority !== 'NORMAL' && (
            <span
              className={cn(
                'text-[9px] font-bold px-1.5 py-0.2 rounded-full border',
                priorityConfig.badgeClass,
              )}
            >
              {priorityConfig.label}
            </span>
          )}

          {notification.action_url && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (isUnread && onMarkRead) onMarkRead(notification.notification_id);
                if (onNavigate) onNavigate(notification.action_url!);
              }}
              className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-0.5 ml-auto"
            >
              View <ExternalLink className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right Column: Unread Red Dot & Quick Action Buttons */}
      <div className="flex flex-col items-end gap-1.5 shrink-0 self-center">
        {isUnread && (
          <span
            aria-label="Unread notification"
            className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-200 dark:ring-red-950 animate-pulse"
          />
        )}

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
          {isUnread && onMarkRead && (
            <button
              type="button"
              title="Mark as read"
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead(notification.notification_id);
              }}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              title="Dismiss notification"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.notification_id);
              }}
              className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
