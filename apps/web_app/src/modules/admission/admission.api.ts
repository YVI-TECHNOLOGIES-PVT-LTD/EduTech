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

  getLeadById: (id: string) => apiClient.get<any>(`/v1/leads/${id}`),
  getEnquiryById: (id: string) => apiClient.get<any>(`/v1/leads/${id}`),

  createEnquiry: (data?: any) => {
    const payload: any = {
      parent_name: data?.parent_name || data?.name || '',
      parent_phone: data?.parent_phone || data?.phone || '',
      grade_applied_for: data?.grade_applied_for || data?.academic_year_grade_id || '',
      contact_consent: data?.contact_consent ?? data?.consent ?? true,
      source: data?.source || 'website',
    };

    if (data?.parent_email || data?.email) {
      payload.parent_email = data.parent_email || data.email;
    }
    if (data?.student_name) {
      payload.student_name = data.student_name;
    }
    if (data?.query_type) {
      payload.query_type = data.query_type;
    }
    if (data?.remarks || data?.message) {
      payload.remarks = data.remarks || data.message;
    }
    if (data?.date_of_birth || data?.dob) {
      payload.date_of_birth = data.date_of_birth || data.dob;
    }
    if (data?.gender) {
      payload.gender = data.gender;
    }
    if (data?.academic_year_id) {
      payload.academic_year_id = data.academic_year_id;
    }

    return apiClient.post<any>('/v1/admission/enquiries', payload, { silent: true } as any);
  },

  updateLead: (id: string, data: any) => apiClient.patch<any>(`/v1/leads/${id}`, data),
  updateEnquiry: (id: string, data?: any) => apiClient.patch<any>(`/v1/leads/${id}`, data),

  deleteEnquiry: (id: string) => apiClient.delete<any>(`/v1/leads/${id}`),

  assignLead: (id: string, counselor_id?: string, remarks?: string, reassign?: boolean) =>
    apiClient.patch(`/v1/leads/${id}/assign`, {
      assigned_counsellor_id: counselor_id,
      remarks,
      reassign,
    }),

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

  getFollowups: (params?: any) => apiClient.get('/v1/leads/followups/due', { params }),

  createFollowup: (data: any) => {
    const leadId = data.lead_id || data.leadId;
    return apiClient.post(`/v1/leads/${leadId}/activities`, {
      activity_type: data.activity_type || data.type || 'follow_up',
      status: data.status || 'scheduled',
      activity_date: data.activity_date || data.date || new Date().toISOString(),
      next_followup_date: data.next_followup_date || data.scheduled_at || null,
      notes: data.notes || data.remarks || null,
    });
  },

  updateFollowup: (id: string, data: any) => apiClient.patch(`/v1/leads/activities/${id}`, data),

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

  approveCrmApplication: (id: string, remarks?: string) =>
    apiClient.post(`/v1/applications/${id}/decision`, {
      decision_status: 'approved',
      remarks: remarks || undefined,
    }),

  rejectCrmApplication: (id: string, reason?: string) =>
    apiClient.post(`/v1/applications/${id}/decision`, {
      decision_status: 'rejected',
      reason: reason || undefined,
    }),

  getCrmApplicationTimeline: (id: string) => apiClient.get(`/v1/applications/${id}`),

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
    apiClient.get(`/v1/admission/evaluation/exam/results/${applicationId}`, {
      silent: true,
    } as any),

  scheduleInterview: (data: any) =>
    apiClient.post('/v1/admission/evaluation/interview/schedule', data),

  recordInterviewScore: (data: any) =>
    apiClient.post('/v1/admission/evaluation/interview/result', data),

  generateMeritList: (data: any) => apiClient.post('/v1/admission/evaluation/merit/generate', data),

  getMeritList: (applicationId: string) =>
    apiClient.get(`/v1/admission/evaluation/merit/${applicationId}`, { silent: true } as any),

  generateOffer: (data: any) => {
    const appId = data.application_id || data.applicationId;
    return apiClient.post(`/v1/applications/${appId}/decision`, {
      decision_status: 'approved',
      remarks: data.remarks || 'Offer generated',
      offer_expiry_date: data.expiry_date || data.offer_expiry_date || undefined,
      scholarship_percentage: data.scholarship_percentage
        ? parseFloat(data.scholarship_percentage)
        : undefined,
    });
  },

  sendOffer: (data: any) => {
    const appId = data.application_id || data.applicationId;
    return apiClient.post(`/v1/applications/${appId}/decision`, {
      decision_status: 'approved',
      remarks: data.remarks || 'Offer sent',
    });
  },

  acceptOffer: (data: any) => {
    const appId = data.application_id || data.applicationId;
    return apiClient.post(`/v1/applications/${appId}/decision`, {
      decision_status: 'approved',
      remarks: data.remarks || 'Offer accepted',
    });
  },

  rejectOffer: (data: any) => {
    const appId = data.application_id || data.applicationId;
    return apiClient.post(`/v1/applications/${appId}/decision`, {
      decision_status: 'rejected',
      reason: data.reason || 'Offer rejected',
    });
  },

  getTimeline: (applicationId: string) =>
    apiClient.get(`/v1/admission/evaluation/timeline/${applicationId}`, { silent: true } as any),

  // ==========================================
  // BILLING & ENROLLMENT (Sprint 6)
  // ==========================================
  assignFeeStructure: (data: any) => apiClient.post('/v1/admission/enrollment/fees/assign', data),

  getFeesSummary: (applicationId: string) =>
    apiClient.get(`/v1/admission/enrollment/fees/${applicationId}`, { silent: true } as any),

  applyFeeWaiver: (data: any) => apiClient.post('/v1/admission/enrollment/waivers', data),

  collectPayment: (data: any) => apiClient.post('/v1/admission/enrollment/payments', data),

  verifyPayment: (data: any) => apiClient.post('/v1/admission/enrollment/payments/verify', data),

  getReceipt: (paymentId: string) =>
    apiClient.get(`/v1/admission/enrollment/payments/${paymentId}/receipt`),

  confirmAdmission: (data: any) => apiClient.post('/v1/admission/enrollment/confirm', data),

  enrollStudent: (data: any) => apiClient.post('/v1/admission/enrollment/enroll', data),

  getEnrollmentStatus: (applicationId: string) =>
    apiClient.get(`/v1/admission/enrollment/status/${applicationId}`, { silent: true } as any),

  // ==========================================
  // DOCUMENTS (Sprint 4 / Stage 3)
  // ==========================================
  listCrmDocuments: (applicationId: string) =>
    apiClient.get(`/v1/applications/${applicationId}/documents`),

  uploadCrmDocument: (
    applicationId: string,
    documentTypeId: string,
    fileOrPath: File | string,
  ): Promise<any> => {
    if (typeof fileOrPath === 'string') {
      return apiClient.post(`/v1/applications/${applicationId}/documents`, {
        document_type_id: documentTypeId,
        file_path: fileOrPath,
      });
    }
    const form = new FormData();
    form.append('file', fileOrPath);
    form.append('application_id', applicationId);
    form.append('document_type_code', documentTypeId);
    return apiClient.post(`/v1/applications/${applicationId}/documents`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteCrmDocument: (documentId: string) =>
    apiClient.delete(`/v1/applications/documents/${documentId}`),

  getDocumentTypes: (params?: { application_id?: string; org_id?: string; school_id?: string }) =>
    apiClient.get('/v1/applications/document-types', { params }),

  getCrmDocumentDownloadUrl: (documentId: string) =>
    apiClient.get<{ signed_url: string; expires_at: string }>(
      `/v1/applications/documents/${documentId}/signed-url`,
    ),

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

  // Fee Calculation & Payment
  getApplicationFee: (applicationId: string) =>
    apiClient.get(`/v1/applications/${applicationId}/fee`),

  getFeeConfig: (params?: { org_id?: string; academic_year_id?: string; school_id?: string }) =>
    apiClient.get('/v1/applications/fee-config', { params }),

  getApplicationPayment: (applicationId: string) =>
    apiClient.get(`/v1/applications/${applicationId}/payment`),

  recordApplicationPayment: (
    applicationId: string,
    payload?: {
      payment_status?: string;
      amount?: number;
      payment_date?: string;
      transaction_reference?: string;
      payment_mode?: string;
      card_name?: string;
      card_last_four?: string;
      remarks?: string;
    },
  ) => apiClient.post(`/v1/applications/${applicationId}/payment`, payload || {}),

  getApplicationProgress: (applicationId: string) =>
    apiClient.get(`/v1/admission/application/${applicationId}/progress`, { silent: true } as any),

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

  verifyOtp: (data: { email?: string; phone?: string; otp: string }) =>
    apiClient.post<any>('/v1/admission/verify-otp', data),

  registerParent: (data: any) => apiClient.post<any>('/v1/admission/register', data),
};
