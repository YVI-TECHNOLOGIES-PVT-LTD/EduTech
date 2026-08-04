import { useQuery } from '@tanstack/react-query';
import { DashboardQueryKeys } from '../core/DashboardQueryKeys';
import { apiClient } from '../../../lib/api-client';
import { DashboardFilter, DashboardChart } from '../types/dashboard.types';
import { DASHBOARD_CONSTANTS } from '../constants/DashboardConstants';
import { ExamAdapter } from '../adapters/ExamAdapter';

export function useDashboardCharts(role: string, filters: DashboardFilter, refreshSignal: number) {
    return useQuery<DashboardChart[], Error>({
        queryKey: [...DashboardQueryKeys.charts(role, filters), refreshSignal],
        queryFn: async () => {
            try {
                if (role === DASHBOARD_CONSTANTS.ROLES.EXAM_CELL) {
                    const examsRes = await apiClient.get('/exams');
                    const exams = examsRes.data || [];
                    const activeExam = exams.find((e: any) => e.status === 'SCHEDULED' || e.status === 'DRAFT') || exams[0];

                    if (activeExam) {
                        const gradesRes = await apiClient.get('/exams/analytics/grades', {
                            params: { examId: activeExam.id }
                        });
                        const dataPoints = ExamAdapter.mapGradesToChart(gradesRes.data);
                        return [
                            {
                                id: 'exam.chart.grades',
                                type: 'pie',
                                title: 'Performance Distribution',
                                subtitle: activeExam.name,
                                data: dataPoints,
                                series: [{ key: 'count', label: 'Students Count' }]
                            }
                        ];
                    }
                }

                if (role === DASHBOARD_CONSTANTS.ROLES.ADMIN) {
                    const res = await apiClient.get('/dashboard/admin/overview', { params: filters });
                    const stats = res.data;
                    const totalApps = stats?.totalApplications || 150;
                    return [
                        {
                            id: 'admin.chart.funnel',
                            type: 'area',
                            title: 'Admissions Conversion Funnel',
                            data: [
                                { name: 'Submitted', value: totalApps },
                                { name: 'Reviewed', value: Math.round(totalApps * 0.8) },
                                { name: 'Invited', value: Math.round(totalApps * 0.6) },
                                { name: 'Enrolled', value: Math.round(totalApps * 0.45) },
                            ],
                            series: [{ key: 'value', label: 'Applicants' }]
                        },
                        {
                            id: 'admin.chart.revenue',
                            type: 'bar',
                            title: 'Revenue Collection Forecast',
                            data: [
                                { name: 'Jan', month: 'Jan', collected: 120000, target: 150000 },
                                { name: 'Feb', month: 'Feb', collected: 145000, target: 150000 },
                                { name: 'Mar', month: 'Mar', collected: 180000, target: 160000 },
                                { name: 'Apr', month: 'Apr', collected: 210000, target: 180000 },
                                { name: 'May', month: 'May', collected: 230000, target: 200000 },
                                { name: 'Jun', month: 'Jun', collected: 245000, target: 220000 }
                            ],
                            series: [
                                { key: 'collected', label: 'Collected (₹)' },
                                { key: 'target', label: 'Target (₹)' }
                            ]
                        },
                        {
                            id: 'admin.chart.classes',
                            type: 'pie',
                            title: 'Class Distribution',
                            data: [
                                { name: 'Primary (Grade 1-5)', value: 240 },
                                { name: 'Middle (Grade 6-8)', value: 160 },
                                { name: 'Secondary (Grade 9-10)', value: 100 }
                            ],
                            series: [{ key: 'value', label: 'Students' }]
                        }
                    ];
                }
            } catch (e) {
                console.error("Charts fetch failed", e);
            }
            return [];
        },
        staleTime: DASHBOARD_CONSTANTS.REFRESH_INTERVALS.CHARTS
    });
}

export default useDashboardCharts;
