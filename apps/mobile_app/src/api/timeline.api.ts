import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import { ApplicationTimelineDto } from '../types/admission.types';

export const timelineApi = {
  /**
   * Get Application Status Timeline: GET /v1/applications/:id/timeline
   */
  async getTimeline(applicationId: string): Promise<ApplicationTimelineDto> {
    const res = await apiClient.get<any>(ENDPOINTS.TIMELINE.BY_APPLICATION(applicationId));
    if (res?.timeline) return res;
    if (Array.isArray(res?.data)) return { application_id: applicationId, timeline: res.data };
    if (Array.isArray(res)) return { application_id: applicationId, timeline: res };
    return { application_id: applicationId, timeline: [] };
  },
};
