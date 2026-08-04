import { DashboardCard, DashboardFilter } from '../types/dashboard.types';

export class FinanceDashboardService {
    public static async getKPIs(filters: DashboardFilter): Promise<DashboardCard[]> {
        // TODO: Integrate backend collections queries from public.payments
        return [
            {
                id: 'finance.kpi.ledger',
                label: 'Payments Pending',
                value: 8,
                format: 'number',
                subtext: 'Awaiting accountant review'
            }
        ];
    }
}

export default FinanceDashboardService;
