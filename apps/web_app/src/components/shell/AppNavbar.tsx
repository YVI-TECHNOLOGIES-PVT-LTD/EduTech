import React from 'react';
import { Search, Bell, Sparkles } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ProfileMenu } from '@/components/shell/ProfileMenu';
import { useCommandPalette } from '@/hooks/layout/useCommandPalette';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { togglePanel } from '@/shared/store/notificationSlice';

export const AppNavbar: React.FC = () => {
  const { open: openSearch } = useCommandPalette();
  const dispatch = useAppDispatch();
  const unreadCount = useAppSelector((state) => state.notification?.unreadCount || 0);

  return (
    <header className="bg-white/80 dark:bg-card/80 backdrop-blur-md border-b border-border/40 sticky top-0 z-30 transition-all duration-300">
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Sidebar Trigger & Global Search */}
        <div className="flex items-center space-x-3 flex-1 max-w-md">
          <SidebarTrigger
            aria-label="Toggle sidebar"
            className="p-2 border border-slate-200 dark:border-border rounded-xl hover:bg-slate-100 transition-colors"
          />

          <button
            onClick={() => openSearch()}
            aria-label="Search applications, documents, and fees"
            className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-2xl text-xs text-slate-400 font-medium transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">Search applications, documents, fees...</span>
              <span className="sm:hidden">Search...</span>
            </div>
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold text-slate-400 bg-white rounded-lg border border-slate-200 shadow-xs">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right: Notifications & Profile Menu */}
        <div className="flex items-center space-x-3">
          {/* Notification Bell */}
          <button
            onClick={() => dispatch(togglePanel())}
            aria-label="Notifications"
            className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>

          <div className="h-6 w-[1px] bg-slate-200 hidden sm:block" />

          {/* Profile Dropdown */}
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
};

export default AppNavbar;
