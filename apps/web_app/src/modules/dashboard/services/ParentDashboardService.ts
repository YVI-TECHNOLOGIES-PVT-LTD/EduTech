import { apiClient } from '../../../lib/api-client';
import { DashboardCard, DashboardFilter } from '../types/dashboard.types';
import { StudentDashboardService } from './StudentDashboardService';

export class ParentDashboardService {
    public static async getKPIs(filters: DashboardFilter): Promise<DashboardCard[]> {
        // Parents share student statistics for their active children
        return StudentDashboardService.getKPIs(filters);
    }

    public static async getOverview(): Promise<any> {
        const response = await apiClient.get('/dashboard/parent/overview');
        return response.data;
    }

    public static async getMyFees(): Promise<any> {
        const response = await apiClient.get('/fees/my');
        return response.data;
    }
}

export default ParentDashboardService;
