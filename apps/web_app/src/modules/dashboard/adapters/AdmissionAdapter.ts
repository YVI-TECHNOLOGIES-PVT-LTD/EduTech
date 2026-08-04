import { DashboardCard, DashboardChartDataPoint } from '../types/dashboard.types';
import { DashboardMapper } from '../utils/dashboard.mapper';

export class AdmissionAdapter {
    public static mapStatsToKPIs(data: any): DashboardCard[] {
        const total = DashboardMapper.safeNumber(data?.total ?? data?.length);
        const enrolled = DashboardMapper.safeNumber(
            Array.isArray(data) ? data.filter((a: any) => a.status === 'enrolled').length : 0
        );

        return [
            {
                id: 'admission.kpi.total',
                label: 'Total Applications',
                value: total,
                format: 'number',
                subtext: 'Cumulative entries'
            },
            {
                id: 'admission.kpi.enrolled',
                label: 'Enrolled Count',
                value: enrolled,
                format: 'number',
                subtext: 'Current batch conversion'
            }
        ];
    }

    public static mapFunnelToChart(data: any[]): DashboardChartDataPoint[] {
        if (!Array.isArray(data)) return [];
        return data.map(item => ({
            name: DashboardMapper.safeString(item.status || item.name),
            count: DashboardMapper.safeNumber(item.count ?? 1)
        }));
    }
}

export default AdmissionAdapter;
