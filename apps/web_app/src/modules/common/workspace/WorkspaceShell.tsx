import React from 'react';
import { ProductivityHub } from '../productivity/ProductivityHub';
import { GlobalSearch } from '../search/GlobalSearch';
import { useWorkspaceOptional } from './WorkspaceContext';

interface WorkspaceShellProps {
  children: React.ReactNode;
}

export function WorkspaceShell({ children }: WorkspaceShellProps) {
  const ctx = useWorkspaceOptional();
  const productivityOpen = ctx?.productivityOpen ?? false;
  const setProductivityOpen = ctx?.setProductivityOpen ?? (() => {});
  const searchOpen = ctx?.searchOpen ?? false;
  const setSearchOpen = ctx?.setSearchOpen ?? (() => {});

  return (
    <>
      {children}
      <ProductivityHub isOpen={productivityOpen} onClose={() => setProductivityOpen(false)} />
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

export default WorkspaceShell;
