import { apiClient } from '../../../lib/api-client';
import { DashboardCard, DashboardFilter } from '../types/dashboard.types';
import { AdmissionAdapter } from '../adapters/AdmissionAdapter';

export class AdmissionDashboardService {
    public static async getKPIs(filters: DashboardFilter): Promise<DashboardCard[]> {
        const response = await apiClient.get('/v1/admission/application/stats', {
            params: filters
        });
        return AdmissionAdapter.mapStatsToKPIs(response.data);
    }
}

export default AdmissionDashboardService;
