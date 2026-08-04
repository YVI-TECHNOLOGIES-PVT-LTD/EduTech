import { DashboardCard } from '../types/dashboard.types';
import { DashboardMapper } from '../utils/dashboard.mapper';

export class FinanceAdapter {
    public static mapCollectionsToKPIs(data: any): DashboardCard[] {
        const total = DashboardMapper.safeNumber(data?.totalCollected ?? data?.collected ?? 0);
        const pending = DashboardMapper.safeNumber(data?.totalPending ?? data?.pending ?? 0);

        return [
            {
                id: 'finance.kpi.collected',
                label: 'Reconciled Revenue',
                value: total,
                format: 'currency',
                subtext: 'Verified fee transactions'
            },
            {
                id: 'finance.kpi.pending',
                label: 'Outstanding Dues',
                value: pending,
                format: 'currency',
                subtext: 'Uncollected balances'
            }
        ];
    }
}

export default FinanceAdapter;
