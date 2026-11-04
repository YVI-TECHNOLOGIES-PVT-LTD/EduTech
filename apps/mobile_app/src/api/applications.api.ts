import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import {
  AdmissionApplication,
  CreateApplicationRequest,
  UpdateApplicationStatusRequest,
} from '../types/admission.types';

export const applicationsApi = {
  /**
   * List Parent's Applications: GET /v1/applications?mine=true
   */
  async listMine(): Promise<AdmissionApplication[]> {
    const res = await apiClient.get<any>(ENDPOINTS.APPLICATIONS.LIST_MINE);
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.applications)) return res.applications;
    return [];
  },

  /**
   * Get Single Application by ID:
   * First tries canonical /v1/applications/:id.
   * If not found (or already finalized in admissions), falls back to /v1/admissions/:id.
   */
  async getById(id: string): Promise<AdmissionApplication> {
    if (!id || id === '[id]') {
      throw new Error('Application ID is required.');
    }

    try {
      const res = await apiClient.get<any>(ENDPOINTS.APPLICATIONS.BY_ID(id));
      const app = res?.application || res?.data || res;
      if (app && (app.application_id || app.id)) {
        return app;
      }
    } catch (primaryErr) {
      try {
        const fallbackRes = await apiClient.get<any>(`/v1/admissions/${id}`);
        const fallbackApp = fallbackRes?.application || fallbackRes?.data || fallbackRes;
        if (fallbackApp && (fallbackApp.application_id || fallbackApp.id)) {
          return fallbackApp;
        }
      } catch {
        throw primaryErr;
      }
    }

    try {
      const fallbackRes = await apiClient.get<any>(`/v1/admissions/${id}`);
      const fallbackApp = fallbackRes?.application || fallbackRes?.data || fallbackRes;
      if (fallbackApp && (fallbackApp.application_id || fallbackApp.id)) {
        return fallbackApp;
      }
    } catch {
      // Continue to throw default
    }

    throw new Error('The requested admission application could not be located.');
  },

  /**
   * Create New Application: POST /v1/applications
   */
  async create(payload: CreateApplicationRequest): Promise<AdmissionApplication> {
    const res = await apiClient.post<any>(ENDPOINTS.APPLICATIONS.CREATE, payload);
    return res?.application || res?.data || res;
  },

  /**
   * Update Application Status: PATCH /v1/applications/:id/status
   */
  async updateStatus(
    id: string,
    payload: UpdateApplicationStatusRequest,
  ): Promise<AdmissionApplication> {
    const res = await apiClient.patch<any>(ENDPOINTS.APPLICATIONS.UPDATE_STATUS(id), payload);
    return res?.application || res?.data || res;
  },
};
