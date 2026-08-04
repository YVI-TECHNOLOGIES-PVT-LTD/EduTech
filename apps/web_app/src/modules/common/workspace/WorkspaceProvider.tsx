import React, { useState, useCallback, useMemo } from 'react';
import { WorkspaceContext, WorkspaceContextValue } from './WorkspaceContext';
import type { WorkspaceModule } from '../types';

interface WorkspaceProviderProps {
    children: React.ReactNode;
    defaultModule?: WorkspaceModule | null;
}

export function WorkspaceProvider({ children, defaultModule = null }: WorkspaceProviderProps) {
    const [activeModule, setActiveModule] = useState<WorkspaceModule | null>(defaultModule);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [productivityOpen, setProductivityOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [refreshSignal, setRefreshSignal] = useState(0);

    const triggerRefresh = useCallback(() => {
        setRefreshSignal(prev => prev + 1);
    }, []);

    const value = useMemo<WorkspaceContextValue>(
        () => ({
            activeModule,
            setActiveModule,
            sidebarCollapsed,
            setSidebarCollapsed,
            productivityOpen,
            setProductivityOpen,
            searchOpen,
            setSearchOpen,
            refreshSignal,
            triggerRefresh,
        }),
        [
            activeModule,
            sidebarCollapsed,
            productivityOpen,
            searchOpen,
            refreshSignal,
            triggerRefresh,
        ],
    );

    return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export default WorkspaceProvider;
