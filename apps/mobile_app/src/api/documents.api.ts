import { Platform } from 'react-native';
import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import { AdmissionDocument } from '../types/admission.types';

export interface UploadDocumentParams {
  applicationId: string;
  documentTypeId: string;
  file: {
    uri: string;
    name: string;
    type: string;
    rawFile?: any;
    size?: number;
  };
}

export const documentsApi = {
  /**
   * List Documents for Application: GET /v1/applications/:id/documents
   */
  async listByApplication(applicationId: string): Promise<AdmissionDocument[]> {
    const res = await apiClient.get<any>(ENDPOINTS.DOCUMENTS.LIST(applicationId));
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.documents)) return res.documents;
    return [];
  },

  /**
   * Upload Document for Application: POST /v1/applications/:id/documents
   */
  async upload(params: UploadDocumentParams): Promise<AdmissionDocument> {
    const formData = new FormData();
    formData.append('document_type_id', params.documentTypeId);
    formData.append('document_code', params.documentTypeId);
    formData.append('document_type', params.documentTypeId);
    formData.append('application_id', params.applicationId);

    if (Platform.OS === 'web') {
      let fileToAppend: any = params.file.rawFile;
      if (!fileToAppend && params.file.uri) {
        if (params.file.uri.startsWith('blob:') || params.file.uri.startsWith('data:')) {
          try {
            const resp = await fetch(params.file.uri);
            fileToAppend = await resp.blob();
          } catch (e) {
            console.warn('[documentsApi] Could not fetch blob URI:', e);
          }
        }
      }

      if (fileToAppend) {
        formData.append('file', fileToAppend, params.file.name);
      } else {
        formData.append('file', {
          uri: params.file.uri,
          name: params.file.name,
          type: params.file.type,
        } as any);
      }
    } else {
      formData.append('file', {
        uri: params.file.uri,
        name: params.file.name,
        type: params.file.type,
      } as any);
    }

    const res = await apiClient.upload<any>(
      ENDPOINTS.DOCUMENTS.UPLOAD(params.applicationId),
      formData,
    );
    return res?.document || res?.data || res;
  },

  /**
   * Get Pre-Signed View URL: GET /v1/applications/documents/:id/signed-url
   */
  async getSignedUrl(documentId: string): Promise<{ signed_url: string; expires_at?: string }> {
    const res = await apiClient.get<any>(ENDPOINTS.DOCUMENTS.SIGNED_URL(documentId));
    return res?.data || res;
  },
};
