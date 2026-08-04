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
    publicApply: (data: any) =>
        apiClient.post<any>('/v1/admission/public-apply', data),

    parentApply: (data: any) =>
        apiClient.post<any>('/v1/admission/apply', data),

    listMyApplications: () =>
        apiClient.get<{ data: Admission[]; total: number }>('/v1/admission/my'),

    listCrmApplications: (params?: { status?: string, school_id?: string, page?: number, limit?: number, search?: string }) =>
        apiClient.get<any>('/v1/admission/application', { params }),

    getCrmStats: (school_id?: string) =>
        apiClient.get<any>('/v1/admission/application/stats', { params: { school_id } }),

    // Legacy aliases — routed to CRM pipeline (Stage 3.3)
    create: (data: Partial<Admission>) =>
        apiClient.post<any>('/v1/admission/apply', data),

    update: (id: string, data: Partial<Admission>, expectedUpdatedAt?: string) =>
        apiClient.patch(`/v1/admission/application/${id}/profile`, data, {
            headers: expectedUpdatedAt ? { 'x-expected-updated-at': expectedUpdatedAt } : {},
        }),

    submit: (id: string, payload?: any) =>
        apiClient.post(`/v1/admission/application/${id}/submit`, payload ?? {}),

    list: (params?: { status?: string, school_id?: string, page?: number, limit?: number, search?: string }) =>
        apiClient.get<any>('/v1/admission/application', { params }),

    getStats: (school_id?: string) =>
        apiClient.get<any>('/v1/admission/application/stats', { params: { school_id } }),

    getById: (id: string) =>
        apiClient.get<Admission>(`/v1/admission/application/${id}`),

    review: (id: string, remark: string) =>
        apiClient.post(`/v1/admission/application/${id}/review`, { remark }),

    verifyDocs: (id: string, remark: string) =>
        apiClient.post(`/v1/admission/application/${id}/verify-docs`, { remark }),

    initiatePayment: (id: string, amount: number) =>
        apiClient.post('/v1/admission/enrollment/fees/assign', { application_id: id, structure_id: amount }),

    recommend: (id: string, remark: string) =>
        apiClient.post(`/v1/admission/application/${id}/approve`, { remark }),

    approve: (id: string, remark: string) =>
        apiClient.post(`/v1/admission/application/${id}/approve`, { remark }),

    reject: (id: string, reason: string) =>
        apiClient.post(`/v1/admission/application/${id}/reject`, { reason }),

    enrol: (id: string) =>
        apiClient.post('/v1/admission/enrollment/enroll', { application_id: id }),

    submitPayment: (id: string, data: { mode: string, reference: string, proof_url?: string }) =>
        apiClient.post('/v1/admission/enrollment/payments', {
            application_id: id,
            payment_mode: data.mode,
            reference_number: data.reference,
            proof_url: data.proof_url,
        }),

    verifyFee: (id: string, status: 'verified' | 'correction', remarks: string) =>
        apiClient.post('/v1/admission/enrollment/payments/verify', {
            application_id: id,
            status,
            remarks,
        }),

    decideLogin: (id: string, status: 'APPROVED' | 'REJECTED' | 'BLOCKED', reason: string) =>
        apiClient.post(`/admissions/${id}/decide-login`, { status, reason }),

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
    // CRM / INQUIRY MANAGEMENT
    // ==========================================
    getEnquiries: (params?: any) =>
        apiClient.get('/v1/admission/crm/enquiries', { params }),

    getEnquiryById: (id: string) =>
        apiClient.get(`/v1/admission/crm/enquiries/${id}`),

    createEnquiry: (data: any) =>
        apiClient.post('/v1/admission/crm/enquiries', data),

    updateEnquiry: (id: string, data: any) =>
        apiClient.put(`/v1/admission/crm/enquiries/${id}`, data),

    deleteEnquiry: (id: string) =>
        apiClient.delete(`/v1/admission/crm/enquiries/${id}`),

    convertEnquiry: (id: string) =>
        apiClient.post(`/v1/admission/crm/enquiries/${id}/convert`),

    getLeads: (params?: any) =>
        apiClient.get('/v1/admission/crm/leads', { params }),

    getLeadById: (id: string) =>
        apiClient.get(`/v1/admission/crm/leads/${id}`),

    updateLead: (id: string, data: any) =>
        apiClient.put(`/v1/admission/crm/leads/${id}`, data),

    assignLead: (id: string, counselorId?: string, strategy?: string, reassign?: boolean) =>
        apiClient.put(`/v1/admission/crm/leads/${id}/assign`, { counselorId, strategy, reassign }),

    getFollowups: (params?: any) =>
        apiClient.get('/v1/admission/crm/followups', { params }),

    createFollowup: (data: any) =>
        apiClient.post('/v1/admission/crm/followups', data),

    updateFollowup: (id: string, data: any) =>
        apiClient.put(`/v1/admission/crm/followups/${id}`, data),

    getVisitors: (params?: any) =>
        apiClient.get('/v1/admission/crm/visitors', { params }),

    createVisitor: (data: any) =>
        apiClient.post('/v1/admission/crm/visitors', data),

    updateVisitor: (id: string, data: any) =>
        apiClient.put(`/v1/admission/crm/visitors/${id}`, data),

    // ==========================================
    // CRM APPLICATION (New /v1/admission/application path)
    // ==========================================
    createCrmApplication: (data: { lead_id: string; grade: string; date_of_birth: string; gender?: string; blood_group?: string; [key: string]: any }) =>
        apiClient.post('/v1/admission/application', data),

    getCrmApplication: (id: string) =>
        apiClient.get(`/v1/admission/application/${id}`),

    patchCrmApplicationProfile: (id: string, data: any, expectedUpdatedAt: string) =>
        apiClient.patch(`/v1/admission/application/${id}/profile`, data, {
            headers: { 'x-expected-updated-at': expectedUpdatedAt }
        }),

    patchCrmApplicationParents: (id: string, data: any, expectedUpdatedAt: string) =>
        apiClient.patch(`/v1/admission/application/${id}/parents`, data, {
            headers: { 'x-expected-updated-at': expectedUpdatedAt }
        }),

    submitCrmApplication: (id: string, payload: any) =>
        apiClient.post(`/v1/admission/application/${id}/submit`, payload),

    reviewCrmApplication: (id: string, remark: string) =>
        apiClient.post(`/v1/admission/application/${id}/review`, { remark }),

    approveCrmApplication: (id: string, remark: string) =>
        apiClient.post(`/v1/admission/application/${id}/approve`, { remark }),

    getCrmApplicationTimeline: (id: string) =>
        apiClient.get(`/v1/admission/application/${id}/timeline`),

    // ==========================================
    // EVALUATION / EXAMS / INTERVIEWS
    // ==========================================
    createExamTemplate: (data: any) =>
        apiClient.post('/v1/admission/evaluation/exam/template', data),

    scheduleExam: (data: any) =>
        apiClient.post('/v1/admission/evaluation/exam/schedule', data),

    allocateCandidate: (data: any) =>
        apiClient.post('/v1/admission/evaluation/exam/allocate', data),

    recordExamAttendance: (data: any) =>
        apiClient.post('/v1/admission/evaluation/exam/attendance', data),

    recordExamMarks: (data: any) =>
        apiClient.post('/v1/admission/evaluation/exam/result', data),

    getExamResults: (applicationId: string) =>
        apiClient.get(`/v1/admission/evaluation/exam/results/${applicationId}`),

    scheduleInterview: (data: any) =>
        apiClient.post('/v1/admission/evaluation/interview/schedule', data),

    recordInterviewScore: (data: any) =>
        apiClient.post('/v1/admission/evaluation/interview/result', data),

    generateMeritList: (data: any) =>
        apiClient.post('/v1/admission/evaluation/merit/generate', data),

    getMeritList: (applicationId: string) =>
        apiClient.get(`/v1/admission/evaluation/merit/${applicationId}`),

    generateOffer: (data: any) =>
        apiClient.post('/v1/admission/evaluation/offer/generate', data),

    sendOffer: (data: any) =>
        apiClient.post('/v1/admission/evaluation/offer/send', data),

    acceptOffer: (data: any) =>
        apiClient.post('/v1/admission/evaluation/offer/accept', data),

    rejectOffer: (data: any) =>
        apiClient.post('/v1/admission/evaluation/offer/reject', data),

    getTimeline: (applicationId: string) =>
        apiClient.get(`/v1/admission/evaluation/timeline/${applicationId}`),

    // ==========================================
    // BILLING & ENROLLMENT (Sprint 6)
    // ==========================================
    assignFeeStructure: (data: any) =>
        apiClient.post('/v1/admission/enrollment/fees/assign', data),

    getFeesSummary: (applicationId: string) =>
        apiClient.get(`/v1/admission/enrollment/fees/${applicationId}`),

    applyFeeWaiver: (data: any) =>
        apiClient.post('/v1/admission/enrollment/waivers', data),

    collectPayment: (data: any) =>
        apiClient.post('/v1/admission/enrollment/payments', data),

    verifyPayment: (data: any) =>
        apiClient.post('/v1/admission/enrollment/payments/verify', data),

    getReceipt: (paymentId: string) =>
        apiClient.get(`/v1/admission/enrollment/payments/${paymentId}/receipt`),

    confirmAdmission: (data: any) =>
        apiClient.post('/v1/admission/enrollment/confirm', data),

    enrollStudent: (data: any) =>
        apiClient.post('/v1/admission/enrollment/enroll', data),

    getEnrollmentStatus: (applicationId: string) =>
        apiClient.get(`/v1/admission/enrollment/status/${applicationId}`),

    // ==========================================
    // DOCUMENTS (Sprint 4 / Stage 3)
    // ==========================================
    listCrmDocuments: (applicationId: string) =>
        apiClient.get(`/v1/admission/application/documents/application/${applicationId}`),

    uploadCrmDocument: (applicationId: string, documentTypeCode: string, file: File) => {
        const form = new FormData();
        form.append('file', file);
        form.append('application_id', applicationId);
        form.append('document_type_code', documentTypeCode);
        return apiClient.post('/v1/admission/application/documents/upload', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    deleteCrmDocument: (documentId: string) =>
        apiClient.delete(`/v1/admission/application/documents/${documentId}`),

    getCrmDocumentDownloadUrl: (documentId: string) =>
        apiClient.get(`/v1/admission/application/documents/${documentId}/download-url`),

    verifyCrmDocument: (documentId: string, remarks?: string) =>
        apiClient.post(`/v1/admission/application/documents/${documentId}/verify`, { remarks }),

    rejectCrmDocument: (documentId: string, rejectionReason: string) =>
        apiClient.post(`/v1/admission/application/documents/${documentId}/reject`, { rejection_reason: rejectionReason }),

    requestCrmDocumentCorrection: (documentId: string, remarks: string) =>
        apiClient.post(`/v1/admission/application/documents/${documentId}/request-correction`, { remarks }),

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
