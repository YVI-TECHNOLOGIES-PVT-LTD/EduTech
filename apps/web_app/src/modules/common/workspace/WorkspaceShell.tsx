import React from 'react';
import { ProductivityHub } from '../productivity/ProductivityHub';
import { GlobalSearch } from '../search/GlobalSearch';
import { NotificationCenter } from '@/features/notifications/NotificationCenter';
import { useNotificationRealtime } from '@/features/notifications/hooks/useNotificationRealtime';
import { useWorkspaceOptional } from './WorkspaceContext';

interface WorkspaceShellProps {
  children: React.ReactNode;
}

export function WorkspaceShell({ children }: WorkspaceShellProps) {
  useNotificationRealtime();
  const ctx = useWorkspaceOptional();
  const productivityOpen = ctx?.productivityOpen ?? false;
  const setProductivityOpen = ctx?.setProductivityOpen ?? (() => {});
  const searchOpen = ctx?.searchOpen ?? false;
  const setSearchOpen = ctx?.setSearchOpen ?? (() => {});

  return (
    <>
      {children}
      <NotificationCenter />
      <ProductivityHub isOpen={productivityOpen} onClose={() => setProductivityOpen(false)} />
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

export default WorkspaceShell;
