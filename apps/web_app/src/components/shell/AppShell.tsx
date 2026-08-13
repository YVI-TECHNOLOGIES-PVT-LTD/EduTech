import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/shell/AppSidebar';
import { AppNavbar } from '@/components/shell/AppNavbar';

export const AppShell: React.FC = () => {
  return (
    <SidebarProvider
      defaultOpen={true}
      className="min-h-screen bg-slate-50/60 dark:bg-background font-sans text-slate-900 w-full flex"
    >
      {/* Canonical Role-Aware Global Sidebar */}
      <AppSidebar />

      {/* Inset Main View Area (Header + Main Page Outlet) */}
      <SidebarInset className="flex-1 flex flex-col min-w-0 bg-slate-50/60 dark:bg-background">
        {/* Canonical Global Top Navbar */}
        <AppNavbar />

        {/* Main Application Page Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AppShell;
