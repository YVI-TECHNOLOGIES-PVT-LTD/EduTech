import React, { createContext, useContext } from 'react';
import { DashboardFilter } from '../types/dashboard.types';

export interface DashboardContextProps {
    filters: DashboardFilter;
    setFilters: React.Dispatch<React.SetStateAction<DashboardFilter>>;
    activeRole: string;
    setActiveRole: (role: string) => void;
    refreshSignal: number;
    triggerGlobalRefresh: () => void;
}

export const DashboardContext = createContext<DashboardContextProps | undefined>(undefined);

export const useDashboardContext = () => {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboardContext must be used within a DashboardProvider');
    }
    return context;
};
