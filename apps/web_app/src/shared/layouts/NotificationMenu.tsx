import React from 'react';
import { Bell } from 'lucide-react';
import { useAppDispatch } from '@/app/store';
import { toggleNotificationDrawer } from '@/shared/store/uiSlice';

export const NotificationMenu: React.FC = () => {
  const dispatch = useAppDispatch();

  return (
    <button
      onClick={() => dispatch(toggleNotificationDrawer())}
      className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
      title="Notifications"
    >
      <Bell className="h-4 w-4" />
      <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" />
    </button>
  );
};
