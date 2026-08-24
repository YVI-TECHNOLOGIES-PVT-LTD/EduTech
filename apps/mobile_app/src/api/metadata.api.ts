import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import {
  AdmissionConfigResponse,
  AcademicYear,
  GradeClass,
  DocumentType,
} from '../types/admission.types';

export const metadataApi = {
  /**
   * Public Admission Configuration: GET /public/admission/config
   */
  async getAdmissionConfig(): Promise<AdmissionConfigResponse> {
    const res = await apiClient.get<any>(ENDPOINTS.METADATA.CONFIG);
    return res.data || res;
  },

  /**
   * Public Academic Years: GET /public/academic-years
   */
  async getAcademicYears(): Promise<AcademicYear[]> {
    const res = await apiClient.get<any>(ENDPOINTS.METADATA.ACADEMIC_YEARS);
    return res.data || res;
  },

  /**
   * Public Grade Classes: GET /public/classes
   */
  async getClasses(): Promise<GradeClass[]> {
    const res = await apiClient.get<any>(ENDPOINTS.METADATA.CLASSES);
    return res.data || res;
  },

  /**
   * Document Types: GET /v1/applications/document-types
   */
  async getDocumentTypes(): Promise<DocumentType[]> {
    const res = await apiClient.get<any>(ENDPOINTS.METADATA.DOCUMENT_TYPES);
    return res.data || res;
  },
};
