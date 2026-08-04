import { DashboardCard, DashboardChartDataPoint } from '../types/dashboard.types';
import { DashboardMapper } from '../utils/dashboard.mapper';

export class ExamAdapter {
    public static mapOverviewToKPIs(overview: any): DashboardCard[] {
        const total = DashboardMapper.safeNumber(overview?.totalStudents);
        const pass = DashboardMapper.safeNumber(overview?.passPercentage);
        const avg = DashboardMapper.safeNumber(overview?.avgPercentage);

        return [
            {
                id: 'exam.kpi.total',
                label: 'Total Students',
                value: total,
                format: 'number',
                subtext: 'Scheduled & graded'
            },
            {
                id: 'exam.kpi.pass',
                label: 'Net Pass Rate',
                value: pass,
                format: 'percentage',
                subtext: `${overview?.passCount ?? 0} Passed / ${overview?.failCount ?? 0} Failed`
            },
            {
                id: 'exam.kpi.avg',
                label: 'Overall Average',
                value: avg,
                format: 'percentage',
                subtext: 'Across all subjects'
            }
        ];
    }

    public static mapGradesToChart(grades: any[]): DashboardChartDataPoint[] {
        if (!Array.isArray(grades)) return [];
        return grades.map(g => ({
            name: DashboardMapper.safeString(g.grade),
            count: DashboardMapper.safeNumber(g.count)
        }));
    }
}

export default ExamAdapter;
