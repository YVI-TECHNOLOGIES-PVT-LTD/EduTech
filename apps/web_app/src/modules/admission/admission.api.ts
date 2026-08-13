import { apiClient } from '../../lib/api-client';
import { supabase } from '../../lib/supabase';
import { Admission, AdmissionFeeSnapshot } from './admission.types';

export const admissionApi = {
  // ==========================================
  // BASIC ADMISSIONS (Parent & Staff)
  // ==========================================
  getAdmissionFees: async (admissionId: string) => {
    const { data, error } = await supabase
      .from('admission_fees')
      .select('*')
      .eq('admission_id', admissionId)
      .order('snapshot_category', { ascending: true });

    if (error) throw error;
    return data as AdmissionFeeSnapshot[];
  },
  publicApply: (data: any) => apiClient.post<any>('/v1/admission/public-apply', data),

  getQueryTypes: () => apiClient.get<any>('/v1/admission/crm/query-types'),

  parentApply: (data: any) => apiClient.post<any>('/v1/admission/apply', data),

  listMyApplications: () => apiClient.get<any>('/v1/applications', { params: { mine: true } }),

  listCrmApplications: (params?: {
    status?: string;
    school_id?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) =>
    apiClient.get<any>('/v1/applications', {
      params: {
        page: params?.page,
        pageSize: params?.limit,
        searchText: params?.search,
        status: params?.status === 'all' ? undefined : params?.status,
        school_id: params?.school_id,
      },
    }),

  getCrmStats: (school_id?: string) =>
    apiClient.get<any>('/v1/applications/dashboard', { params: { school_id } }),

  // Legacy aliases — routed to canonical Phase 3 admission-management API
  create: (data: Partial<Admission>) => apiClient.post<any>('/v1/applications', data),

  update: (id: string, data: Partial<Admission>) => apiClient.patch(`/v1/applications/${id}`, data),

  submit: (id: string, payload?: any) =>
    apiClient.patch(`/v1/applications/${id}/status`, { status: 'submitted', ...payload }),

  list: (params?: {
    status?: string;
    school_id?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) =>
    apiClient.get<any>('/v1/applications', {
      params: {
        page: params?.page,
        pageSize: params?.limit,
        searchText: params?.search,
        status: params?.status === 'all' ? undefined : params?.status,
        school_id: params?.school_id,
      },
    }),

  getStats: (school_id?: string) =>
    apiClient.get<any>('/v1/applications/dashboard', { params: { school_id } }),

  getById: (id: string) => apiClient.get<Admission>(`/v1/applications/${id}`),

  review: (id: string, remark: string) =>
    apiClient.patch(`/v1/applications/${id}/status`, { status: 'under_review', remarks: remark }),

  verifyDocs: (documentId: string, remark?: string, status: string = 'verified') =>
    apiClient.patch(`/v1/applications/documents/${documentId}/verify`, {
      verify_status: status,
      verification_remarks: remark || 'Verified by staff',
    }),

  recordAssessment: (
    id: string,
    data: { maximum_marks?: number; marks_obtained?: number; remarks?: string; result?: string },
  ) => apiClient.post(`/v1/applications/${id}/assessment`, data),

  recordDecision: (
    id: string,
    decision_status: 'approved' | 'waitlisted' | 'rejected' | 'withdrawn',
    remarks?: string,
  ) => apiClient.post(`/v1/applications/${id}/decision`, { decision_status, remarks }),

  initiatePayment: (id: string, amount: number) =>
    apiClient.post(`/v1/applications/${id}/payment`, { amount, payment_status: 'pending' }),

  recommend: (id: string, remark: string) =>
    apiClient.post(`/v1/applications/${id}/decision`, {
      decision_status: 'approved',
      remarks: remark,
    }),

  approve: (id: string, remark: string) =>
    apiClient.post(`/v1/applications/${id}/decision`, {
      decision_status: 'approved',
      remarks: remark,
    }),

  reject: (id: string, reason: string) =>
    apiClient.post(`/v1/applications/${id}/decision`, {
      decision_status: 'rejected',
      remarks: reason,
    }),

  enrol: (id: string) => apiClient.post('/v1/admission/enrollment/enroll', { application_id: id }),

  submitPayment: (id: string, data: { mode: string; reference: string; proof_url?: string }) =>
    apiClient.post(`/v1/applications/${id}/payment`, {
      amount: 1000,
      transaction_reference: data.reference,
      remarks: data.mode,
    }),

  verifyFee: (id: string, status: 'verified' | 'correction', remarks: string) =>
    apiClient.post(`/v1/applications/${id}/payment`, {
      payment_status: status === 'verified' ? 'paid' : 'pending',
      remarks,
    }),

  decideLogin: (id: string, status: 'APPROVED' | 'REJECTED' | 'BLOCKED', reason: string) =>
    apiClient.post(`/v1/applications/${id}/decision`, {
      decision_status: status === 'APPROVED' ? 'approved' : 'rejected',
      remarks: reason,
    }),

  uploadDoc: (id: string, type: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    form.append('application_id', id);
    form.append('document_type_code', type);
    return apiClient.post('/v1/admission/application/documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  billing: (id: string, legacyStructureId: string) =>
    apiClient.post('/v1/admission/enrollment/fees/assign', {
      application_id: id,
      structure_id: legacyStructureId,
    }),

  getFeePreview: (applicationId: string) =>
    apiClient.get<any>(`/fees/application/${applicationId}/preview`, { silent: true } as any),

  getFeeStructures: () =>
    apiClient.get<any[]>('/v1/admission/crm/fee-structures', { silent: true } as any),

  // ==========================================
  // CRM / INQUIRY & LEAD MANAGEMENT (Phase 4)
  // ==========================================
  getEnquiries: (params?: any) => apiClient.get('/v1/leads', { params }),

  getEnquiryById: (id: string) => apiClient.get(`/v1/leads/${id}`),

  createEnquiry: (data: any) => apiClient.post('/v1/leads', data, { silent: true } as any),

  updateEnquiry: (id: string, data: any) => apiClient.patch(`/v1/leads/${id}`, data),

  deleteEnquiry: (id: string) => apiClient.delete(`/v1/leads/${id}`),

  assignLead: (id: string, counselor_id: string, remarks?: string) =>
    apiClient.patch(`/v1/leads/${id}/assign`, { assigned_counsellor_id: counselor_id, remarks }),

  qualifyLead: (id: string) => apiClient.post(`/v1/leads/${id}/qualify`),

  convertLead: (id: string) => apiClient.post(`/v1/leads/${id}/convert`),

  addLeadActivity: (id: string, activity_type: string, notes?: string) =>
    apiClient.post(`/v1/leads/${id}/activities`, { activity_type, notes }),

  scheduleVisit: (
    id: string,
    data: {
      visit_type: 'campus' | 'virtual';
      scheduled_at: string;
      staff_id?: string;
      remarks?: string;
    },
  ) => apiClient.post(`/v1/leads/${id}/visits`, data),

  listVisits: (params?: any) => apiClient.get('/v1/leads/visits', { params }),

  updateVisitStatus: (id: string, status: string, remarks?: string) =>
    apiClient.patch(`/v1/leads/visits/${id}`, { status, remarks }),

  convertEnquiry: (id: string) => apiClient.post(`/v1/leads/${id}/convert`),

  // ==========================================
  // ENROLLMENT DESK (Phase 5)
  // ==========================================
  getApprovedApplications: (params?: any) =>
    apiClient.get('/v1/students/approved-applications', { params }),

  enrollCandidate: (
    applicationId: string,
    data?: { section_id?: string; roll_number?: string; remarks?: string },
  ) => apiClient.post(`/v1/students/convert-application/${applicationId}`, data),

  assignSection: (enrollmentId: string, section_id: string, roll_number?: string) =>
    apiClient.patch(`/v1/students/enrollments/${enrollmentId}/section`, {
      section_id,
      roll_number,
    }),

  getFollowups: (params?: any) => apiClient.get('/v1/admission/crm/followups', { params }),

  createFollowup: (data: any) => apiClient.post('/v1/admission/crm/followups', data),

  updateFollowup: (id: string, data: any) =>
    apiClient.put(`/v1/admission/crm/followups/${id}`, data),

  getVisitors: (params?: any) => apiClient.get('/v1/admission/crm/visitors', { params }),

  createVisitor: (data: any) => apiClient.post('/v1/admission/crm/visitors', data),

  updateVisitor: (id: string, data: any) => apiClient.put(`/v1/admission/crm/visitors/${id}`, data),

  // ==========================================
  // CRM APPLICATION (New /v1/admission/application path)
  // ==========================================
  createCrmApplication: (data: {
    lead_id?: string;
    grade: string;
    date_of_birth: string;
    gender?: string;
    blood_group?: string;
    [key: string]: any;
  }) => apiClient.post('/v1/applications', data),

  getCrmApplication: (id: string) => apiClient.get(`/v1/applications/${id}`),

  patchCrmApplicationProfile: (id: string, data: any, expectedUpdatedAt: string) =>
    apiClient.patch(`/v1/admission/application/${id}/profile`, data, {
      headers: { 'x-expected-updated-at': expectedUpdatedAt },
    }),

  patchCrmApplicationParents: (id: string, data: any, expectedUpdatedAt: string) =>
    apiClient.patch(`/v1/admission/application/${id}/parents`, data, {
      headers: { 'x-expected-updated-at': expectedUpdatedAt },
    }),

  submitCrmApplication: (id: string, payload?: any) =>
    apiClient.post(`/v1/admission/application/${id}/submit`, payload ?? {}),

  reviewCrmApplication: (id: string, remark: string) =>
    apiClient.post(`/v1/admission/application/${id}/review`, { remark }),

  approveCrmApplication: (id: string, remark: string) =>
    apiClient.post(`/v1/admission/application/${id}/approve`, { remark }),

  getCrmApplicationTimeline: (id: string) =>
    apiClient.get(`/v1/admission/application/${id}/timeline`),

  // ==========================================
  // EVALUATION / EXAMS / INTERVIEWS
  // ==========================================
  createExamTemplate: (data: any) => apiClient.post('/v1/admission/evaluation/exam/template', data),

  scheduleExam: (data: any) => apiClient.post('/v1/admission/evaluation/exam/schedule', data),

  allocateCandidate: (data: any) => apiClient.post('/v1/admission/evaluation/exam/allocate', data),

  recordExamAttendance: (data: any) =>
    apiClient.post('/v1/admission/evaluation/exam/attendance', data),

  recordExamMarks: (data: any) => apiClient.post('/v1/admission/evaluation/exam/result', data),

  getExamResults: (applicationId: string) =>
    apiClient.get(`/v1/admission/evaluation/exam/results/${applicationId}`),

  scheduleInterview: (data: any) =>
    apiClient.post('/v1/admission/evaluation/interview/schedule', data),

  recordInterviewScore: (data: any) =>
    apiClient.post('/v1/admission/evaluation/interview/result', data),

  generateMeritList: (data: any) => apiClient.post('/v1/admission/evaluation/merit/generate', data),

  getMeritList: (applicationId: string) =>
    apiClient.get(`/v1/admission/evaluation/merit/${applicationId}`),

  generateOffer: (data: any) => apiClient.post('/v1/admission/evaluation/offer/generate', data),

  sendOffer: (data: any) => apiClient.post('/v1/admission/evaluation/offer/send', data),

  acceptOffer: (data: any) => apiClient.post('/v1/admission/evaluation/offer/accept', data),

  rejectOffer: (data: any) => apiClient.post('/v1/admission/evaluation/offer/reject', data),

  getTimeline: (applicationId: string) =>
    apiClient.get(`/v1/admission/evaluation/timeline/${applicationId}`),

  // ==========================================
  // BILLING & ENROLLMENT (Sprint 6)
  // ==========================================
  assignFeeStructure: (data: any) => apiClient.post('/v1/admission/enrollment/fees/assign', data),

  getFeesSummary: (applicationId: string) =>
    apiClient.get(`/v1/admission/enrollment/fees/${applicationId}`),

  applyFeeWaiver: (data: any) => apiClient.post('/v1/admission/enrollment/waivers', data),

  collectPayment: (data: any) => apiClient.post('/v1/admission/enrollment/payments', data),

  verifyPayment: (data: any) => apiClient.post('/v1/admission/enrollment/payments/verify', data),

  getReceipt: (paymentId: string) =>
    apiClient.get(`/v1/admission/enrollment/payments/${paymentId}/receipt`),

  confirmAdmission: (data: any) => apiClient.post('/v1/admission/enrollment/confirm', data),

  enrollStudent: (data: any) => apiClient.post('/v1/admission/enrollment/enroll', data),

  getEnrollmentStatus: (applicationId: string) =>
    apiClient.get(`/v1/admission/enrollment/status/${applicationId}`),

  // ==========================================
  // DOCUMENTS (Sprint 4 / Stage 3)
  // ==========================================
  listCrmDocuments: (applicationId: string) =>
    apiClient.get(`/v1/applications/${applicationId}/documents`),

  uploadCrmDocument: (applicationId: string, documentTypeId: string, filePath: string) => {
    return apiClient.post(`/v1/applications/${applicationId}/documents`, {
      document_type_id: documentTypeId,
      file_path: filePath,
    });
  },

  deleteCrmDocument: (documentId: string) =>
    apiClient.delete(`/v1/applications/documents/${documentId}`),

  getCrmDocumentDownloadUrl: (documentId: string) =>
    apiClient.get(`/v1/applications/documents/${documentId}/download-url`),

  verifyCrmDocument: (documentId: string, remarks?: string) =>
    apiClient.patch(`/v1/applications/documents/${documentId}/verify`, {
      verify_status: 'verified',
      verification_remarks: remarks,
    }),

  rejectCrmDocument: (documentId: string, rejectionReason: string) =>
    apiClient.patch(`/v1/applications/documents/${documentId}/verify`, {
      verify_status: 'rejected',
      verification_remarks: rejectionReason,
    }),

  requestCrmDocumentCorrection: (documentId: string, remarks: string) =>
    apiClient.patch(`/v1/applications/documents/${documentId}/verify`, {
      verify_status: 'resubmission_requested',
      verification_remarks: remarks,
    }),

  getApplicationProgress: (applicationId: string) =>
    apiClient.get(`/v1/admission/application/${applicationId}/progress`),

  getAuditLogs: async (applicationId: string) => {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_id', applicationId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  getStatusHistory: async (applicationId: string) => {
    const { data, error } = await supabase
      .from('status_history')
      .select('*')
      .eq('entity_id', applicationId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
};
