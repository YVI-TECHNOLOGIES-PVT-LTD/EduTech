import { apiClient } from '../../../lib/api-client';
import { DashboardCard, DashboardFilter } from '../types/dashboard.types';
import { DashboardMapper } from '../utils/dashboard.mapper';

export class FacultyDashboardService {
    public static async getKPIs(filters: DashboardFilter): Promise<DashboardCard[]> {
        const response = await apiClient.get('/dashboard/faculty/overview', {
            params: filters
        });
        const data = response.data;
        
        return [
            {
                id: 'faculty.kpi.classes_today',
                label: 'Classes Today',
                value: DashboardMapper.safeNumber(data?.classes_today),
                format: 'number',
                subtext: 'Scheduled lessons'
            },
            {
                id: 'faculty.kpi.my_sections',
                label: 'My Sections',
                value: DashboardMapper.safeNumber(data?.sections_count),
                format: 'number',
                subtext: 'Assigned classroom sections'
            },
            {
                id: 'faculty.kpi.pending_works',
                label: 'Pending Submissions',
                value: DashboardMapper.safeNumber(data?.pending_assignments),
                format: 'number',
                subtext: 'Ungraded works'
            }
        ];
    }
}

export default FacultyDashboardService;
