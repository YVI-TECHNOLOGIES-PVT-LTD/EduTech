import { DashboardFilter } from '../types/dashboard.types';

export const DashboardQueryKeys = {
    all: ['dashboard'] as const,
    kpis: (role: string, filters: DashboardFilter) => 
        ['dashboard', 'kpis', role, filters] as const,
    activities: (role: string, filters: DashboardFilter) => 
        ['dashboard', 'activities', role, filters] as const,
    notifications: (role: string) => 
        ['dashboard', 'notifications', role] as const,
    tasks: (role: string) => 
        ['dashboard', 'tasks', role] as const,
    charts: (role: string, filters: DashboardFilter) => 
        ['dashboard', 'charts', role, filters] as const,
};

export default DashboardQueryKeys;
