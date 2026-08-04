import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { DashboardContext, DashboardContextProps } from './DashboardContext';
import { DashboardFilter } from '../types/dashboard.types';
import { DashboardFiltersManager } from './DashboardFilters';
import { PermissionProfileResolver } from './PermissionProfileResolver';
import { DashboardRefreshManager } from './DashboardRefresh';

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [filters, setFilters] = useState<DashboardFilter>(() => DashboardFiltersManager.createDefault());
    
    const [activeRole, setActiveRoleState] = useState<string>(() => {
        return PermissionProfileResolver.resolve(user?.permissions || []).profile;
    });

    const [refreshSignal, setRefreshSignal] = useState<number>(0);

    const triggerGlobalRefresh = useCallback(() => {
        setRefreshSignal(prev => prev + 1);
    }, []);

    const setActiveRole = useCallback((role: string) => {
        setActiveRoleState(role);
    }, []);

    useEffect(() => {
        if (user?.permissions) {
            setActiveRoleState(PermissionProfileResolver.resolve(user.permissions).profile);
        }
    }, [user?.permissions]);

    // Visibility-focus auto refresh coordinator
    useEffect(() => {
        const unsubscribe = DashboardRefreshManager.subscribe(triggerGlobalRefresh);
        return () => unsubscribe();
    }, [triggerGlobalRefresh]);

    const value: DashboardContextProps = {
        filters,
        setFilters,
        activeRole,
        setActiveRole,
        refreshSignal,
        triggerGlobalRefresh
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
};

export default DashboardProvider;
