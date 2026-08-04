import { DashboardCard } from '../types/dashboard.types';
import { DashboardMapper } from '../utils/dashboard.mapper';

export class TransportAdapter {
    public static mapRouteStatsToKPIs(data: any): DashboardCard[] {
        const routes = DashboardMapper.safeNumber(data?.routesCount ?? 0);
        const vehicles = DashboardMapper.safeNumber(data?.vehiclesCount ?? 0);
        const exceptions = DashboardMapper.safeNumber(data?.activeExceptions ?? 0);

        return [
            {
                id: 'transport.kpi.routes',
                label: 'Active Routes',
                value: routes,
                format: 'number',
                subtext: 'Assigned paths'
            },
            {
                id: 'transport.kpi.vehicles',
                label: 'Fleet Size',
                value: vehicles,
                format: 'number',
                subtext: 'Operational units'
            },
            {
                id: 'transport.kpi.exceptions',
                label: 'Active Warnings',
                value: exceptions,
                format: 'number',
                subtext: 'Safety exceptions logged'
            }
        ];
    }
}

export default TransportAdapter;
