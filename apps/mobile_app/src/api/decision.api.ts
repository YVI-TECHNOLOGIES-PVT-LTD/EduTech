import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import { AdmissionDecision } from '../types/admission.types';

export const decisionApi = {
  /**
   * Get Decision for Application: GET /v1/applications/:id/decision
   */
  async getByApplicationId(applicationId: string): Promise<AdmissionDecision | null> {
    try {
      const res = await apiClient.get<any>(ENDPOINTS.DECISION.BY_APPLICATION(applicationId));
      return res?.decision || res?.data || res || null;
    } catch (error: any) {
      if (error?.status === 404) {
        return null;
      }
      throw error;
    }
  },
};
