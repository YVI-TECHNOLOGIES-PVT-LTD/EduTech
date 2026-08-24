import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import { AssessmentResult } from '../types/admission.types';

export const assessmentApi = {
  /**
   * Get Assessment Result for Application: GET /v1/applications/:id/assessment
   */
  async getByApplicationId(applicationId: string): Promise<AssessmentResult | null> {
    try {
      const res = await apiClient.get<any>(ENDPOINTS.ASSESSMENT.BY_APPLICATION(applicationId));
      return res?.assessment || res?.data || res || null;
    } catch (error: any) {
      if (error?.status === 404) {
        return null;
      }
      throw error;
    }
  },
};
