import { createContext, useContext } from 'react';
import type { WorkspaceModule } from '../types';

export interface WorkspaceContextValue {
    activeModule: WorkspaceModule | null;
    setActiveModule: (module: WorkspaceModule | null) => void;
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
    productivityOpen: boolean;
    setProductivityOpen: (open: boolean) => void;
    searchOpen: boolean;
    setSearchOpen: (open: boolean) => void;
    refreshSignal: number;
    triggerRefresh: () => void;
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace() {
    const ctx = useContext(WorkspaceContext);
    if (!ctx) {
        throw new Error('useWorkspace must be used within WorkspaceProvider');
    }
    return ctx;
}

export function useWorkspaceOptional() {
    return useContext(WorkspaceContext);
}
