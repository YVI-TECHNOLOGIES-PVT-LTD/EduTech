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
   * Get Single Application by ID: GET /v1/applications/:id
   */
  async getById(id: string): Promise<AdmissionApplication> {
    const res = await apiClient.get<any>(ENDPOINTS.APPLICATIONS.BY_ID(id));
    return res?.application || res?.data || res;
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
