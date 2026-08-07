import React from 'react';
import { Menu, Search } from 'lucide-react';
import { useAppDispatch } from '@/app/store';
import { toggleSidebar, setGlobalSearchOpen } from '@/shared/store/uiSlice';
import { OrganizationSwitcher } from './OrganizationSwitcher';
import { NotificationMenu } from './NotificationMenu';
import { ProfileMenu } from './ProfileMenu';

export const TopBar: React.FC = () => {
  const dispatch = useAppDispatch();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          title="Toggle Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <OrganizationSwitcher />
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={() => dispatch(setGlobalSearchOpen(true))}
          className="hidden sm:flex items-center space-x-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Quick search ERP...</span>
          <kbd className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            ⌘K
          </kbd>
        </button>

        <NotificationMenu />
        <ProfileMenu />
      </div>
    </header>
  );
};
