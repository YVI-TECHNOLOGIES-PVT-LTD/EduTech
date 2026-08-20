import React from 'react';
import { Bell } from 'lucide-react';
import { useAppDispatch } from '@/app/store';
import { toggleNotificationDrawer } from '@/shared/store/uiSlice';

export const NotificationMenu: React.FC = () => {
  const dispatch = useAppDispatch();

  return (
    <button
      onClick={() => dispatch(toggleNotificationDrawer())}
      className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-900"
      title="Notifications"
    >
      <Bell className="h-4 w-4" />
      <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-card" />
    </button>
  );
};
