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
    <header className="bg-card/80 backdrop-blur-md border-b border-border/80 sticky top-0 z-30 transition-all duration-300">
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Sidebar Trigger & Global Search */}
        <div className="flex items-center space-x-3 flex-1 max-w-md">
          <SidebarTrigger
            aria-label="Toggle sidebar"
            className="p-2 border border-border/80 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          />

          <button
            onClick={() => openSearch()}
            aria-label="Search applications, documents, and fees"
            className="w-full flex items-center justify-between px-3.5 py-2 bg-muted/40 hover:bg-muted/80 border border-border/80 rounded-xl text-xs text-muted-foreground font-medium transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <span className="hidden sm:inline">Search applications, documents, fees...</span>
              <span className="sm:hidden">Search...</span>
            </div>
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold text-muted-foreground bg-card rounded-lg border border-border/80 shadow-xs">
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
            className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive ring-2 ring-background" />
            )}
          </button>

          <div className="h-6 w-[1px] bg-border/80 hidden sm:block" />

          {/* Profile Dropdown */}
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
};

export default AppNavbar;
