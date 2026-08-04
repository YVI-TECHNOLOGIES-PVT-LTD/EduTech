import React from 'react';
import { ProductivityHub } from '../productivity/ProductivityHub';
import { GlobalSearch } from '../search/GlobalSearch';
import { useWorkspace } from './WorkspaceContext';

interface WorkspaceShellProps {
    children: React.ReactNode;
}

export function WorkspaceShell({ children }: WorkspaceShellProps) {
    const {
        productivityOpen,
        setProductivityOpen,
        searchOpen,
        setSearchOpen,
    } = useWorkspace();

    return (
        <>
            {children}
            <ProductivityHub isOpen={productivityOpen} onClose={() => setProductivityOpen(false)} />
            <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
        </>
    );
}

export default WorkspaceShell;
