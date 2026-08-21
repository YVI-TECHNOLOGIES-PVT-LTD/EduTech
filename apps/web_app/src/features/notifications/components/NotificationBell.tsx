import React, { forwardRef } from 'react';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NotificationBellProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  unreadCount?: number;
  isOpen?: boolean;
}

export const NotificationBell = forwardRef<HTMLButtonElement, NotificationBellProps>(
  ({ unreadCount = 0, isOpen = false, className, ...props }, ref) => {
    const hasUnread = unreadCount > 0;
    const badgeText = unreadCount > 99 ? '99+' : String(unreadCount);
    const ariaLabel = hasUnread ? `Notifications, ${unreadCount} unread` : 'Notifications';

    return (
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title={ariaLabel}
        className={cn(
          'relative p-2 rounded-xl transition-all duration-200 cursor-pointer select-none outline-hidden',
          'text-muted-foreground hover:text-foreground hover:bg-muted/80',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isOpen && 'bg-muted text-foreground ring-1 ring-border/80 shadow-2xs',
          className,
        )}
        {...props}
      >
        <Bell className="w-5 h-5 transition-transform duration-200 group-hover:scale-105" />

        {hasUnread && (
          <span
            className={cn(
              'absolute -top-0.5 -right-0.5 flex items-center justify-center',
              'min-w-[18px] h-[18px] px-1 rounded-full',
              'bg-red-600 text-white text-[10px] font-black leading-none',
              'shadow-xs ring-2 ring-background animate-in fade-in zoom-in-75 duration-200',
            )}
          >
            {badgeText}
          </span>
        )}
      </button>
    );
  },
);

NotificationBell.displayName = 'NotificationBell';
