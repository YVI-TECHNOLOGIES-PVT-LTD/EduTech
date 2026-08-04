import { DashboardCard, DashboardFilter } from '../types/dashboard.types';

export class ReceptionDashboardService {
    public static async getKPIs(filters: DashboardFilter): Promise<DashboardCard[]> {
        // TODO: Integrate with backend endpoint GET /v1/admission/crm/visitors
        // Currently returns mock data safely formatted
        return [
            {
                id: 'reception.kpi.walkins',
                label: 'Walk-ins Today',
                value: 12,
                format: 'number',
                subtext: 'Logged visitors today'
            }
        ];
    }
}

export default ReceptionDashboardService;
