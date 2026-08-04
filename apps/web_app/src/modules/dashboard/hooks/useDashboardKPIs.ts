import { useQuery } from '@tanstack/react-query';
import { DashboardQueryKeys } from '../core/DashboardQueryKeys';
import { DashboardService } from '../services/DashboardService';
import { DashboardFilter, DashboardCard } from '../types/dashboard.types';
import { DASHBOARD_CONSTANTS } from '../constants/DashboardConstants';

export function useDashboardKPIs(role: string, filters: DashboardFilter, refreshSignal: number) {
    return useQuery<DashboardCard[], Error>({
        queryKey: [...DashboardQueryKeys.kpis(role, filters), refreshSignal],
        queryFn: () => DashboardService.getKPIsForRole(role, filters),
        staleTime: DASHBOARD_CONSTANTS.REFRESH_INTERVALS.KPI,
        refetchOnWindowFocus: true
    });
}

export default useDashboardKPIs;
