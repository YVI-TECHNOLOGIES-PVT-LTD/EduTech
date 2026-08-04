import { apiClient } from '../../../lib/api-client';
import { DashboardCard, DashboardFilter } from '../types/dashboard.types';
import { ExamAdapter } from '../adapters/ExamAdapter';

export class ExamDashboardService {
    public static async getKPIs(filters: DashboardFilter): Promise<DashboardCard[]> {
        // Query list of exams first to resolve selected exam context
        const examsRes = await apiClient.get('/exams');
        const exams = examsRes.data || [];
        const activeExam = exams.find((e: any) => e.status === 'SCHEDULED' || e.status === 'DRAFT') || exams[0];
        
        if (!activeExam) {
            return [
                {
                    id: 'exam.kpi.upcoming',
                    label: 'Upcoming Exams',
                    value: 0,
                    format: 'number',
                    subtext: 'No active exams found'
                }
            ];
        }

        const response = await apiClient.get('/exams/analytics/overview', {
            params: { examId: activeExam.id, ...filters }
        });
        
        return ExamAdapter.mapOverviewToKPIs(response.data);
    }
}

export default ExamDashboardService;
