import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAppSelector, RootState } from '@/app/store';
import { cn } from '@/lib/utils';

export const AdminLayout: React.FC = () => {
  const sidebarOpen = useAppSelector((state: RootState) => state.ui.sidebarOpen);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <Sidebar />
      <div
        className={cn('flex flex-col transition-all duration-300', sidebarOpen ? 'pl-64' : 'pl-0')}
      >
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
