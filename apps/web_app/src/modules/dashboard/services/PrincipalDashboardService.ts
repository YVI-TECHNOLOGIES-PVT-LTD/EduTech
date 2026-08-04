import { DashboardCard, DashboardFilter } from '../types/dashboard.types';

export class PrincipalDashboardService {
    public static async getKPIs(filters: DashboardFilter): Promise<DashboardCard[]> {
        // TODO: Map from academic year total enrollment and conversion tables
        return [
            {
                id: 'principal.kpi.conversions',
                label: 'Funnel Yield Ratio',
                value: 62,
                format: 'percentage',
                subtext: 'Inquiry conversion rate'
            }
        ];
    }
}

export default PrincipalDashboardService;
