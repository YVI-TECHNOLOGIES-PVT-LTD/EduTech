import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/shell/AppSidebar';
import { AppNavbar } from '@/components/shell/AppNavbar';

export const AppShell: React.FC = () => {
  return (
    <SidebarProvider
      defaultOpen={true}
      className="min-h-screen bg-background font-sans text-foreground w-full flex"
    >
      {/* Canonical Role-Aware Global Sidebar */}
      <AppSidebar />

      {/* Inset Main View Area (Header + Main Page Outlet) */}
      <SidebarInset className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Canonical Global Top Navbar with Inline Search */}
        <AppNavbar />

        {/* Main Application Page Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden animate-page-entrance">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AppShell;
