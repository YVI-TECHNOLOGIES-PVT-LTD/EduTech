export type AdmissionStatus =
    | 'draft'
    | 'submitted'
    | 'under_review'
    | 'docs_verified'
    | 'payment_pending'
    | 'payment_submitted'
    | 'payment_verified'
    | 'payment_correction'
    | 'recommended'
    | 'approved'
    | 'rejected'
    | 'enrolled';

export interface AdmissionDocument {
    id: string;
    admission_id: string;
    document_type: string;
    file_url: string;
    uploaded_at: string;
}

export interface AdmissionAuditLog {
    id: string;
    admission_id: string;
    action: string;
    performed_by: string;
    remarks: string;
    created_at: string;
    users?: { full_name: string };
}

export interface AdmissionFeeSnapshot {
    id: string;
    admission_id: string;
    fee_structure_id: string;
    snapshot_name: string;
    snapshot_amount: number;
    snapshot_category: string;
    is_mandatory: boolean;
    payment_status: 'ENABLED' | 'PAID' | 'VOIDED';
    enabled_at: string;
    created_at: string;
}

export interface Admission {
    id: string;
    school_id: string;
    academic_year_id: string;
    applicant_user_id: string;
    student_name: string;
    date_of_birth: string;
    gender: 'Male' | 'Female' | 'Other';
    grade_applied_for: string;
    parent_name?: string;
    parent_email?: string;
    parent_phone?: string;
    address?: string;
    previous_school?: string;
    last_grade_completed?: string;
    status: AdmissionStatus;
    remark_by_officer?: string;
    remark_by_hoi?: string;
    submitted_at?: string;
    recommended_at?: string;
    approved_at?: string;
    rejected_at?: string;
    rejection_reason?: string;
    payment_enabled?: boolean;
    payment_amount?: number;
    payment_mode?: string;
    payment_reference?: string;
    payment_proof?: string;
    payment_date?: string;
    payment_verified?: boolean;
    remark_by_finance?: string;
    created_at: string;
    updated_at: string;
    academic_years?: { year_label: string };
    admission_documents?: AdmissionDocument[];
    admission_audit_logs?: AdmissionAuditLog[];
    admission_fees?: AdmissionFeeSnapshot[];
    applicant?: {
        id: string;
        full_name: string;
        email: string;
        login_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';
    };
}

/** Normalized application view used across pages */
export interface AdmissionApplication extends Admission {
    uiStatus?: string;
    progressPercent?: number;
}

export interface AdmissionTimelineEntry {
    id: string;
    action: string;
    actor?: string;
    operator_name?: string;
    remarks?: string;
    timestamp: string;
    status?: string;
}

export interface AdmissionPayment {
    id?: string;
    applicationId: string;
    amount: number;
    mode?: string;
    reference?: string;
    status: 'pending' | 'submitted' | 'verified' | 'rejected';
    verifiedAt?: string;
}

export interface AdmissionOffer {
    id?: string;
    applicationId: string;
    status: 'pending' | 'sent' | 'accepted' | 'rejected' | 'expired';
    sentAt?: string;
}

export interface AdmissionEnrollment {
    applicationId: string;
    status: 'pending' | 'ready' | 'completed' | 'failed';
    provisioningSteps?: { key: string; label: string; status: 'SUCCESS' | 'FAILED' | 'PENDING' }[];
    studentId?: string;
    rollNumber?: string;
    admissionNumber?: string;
}

export interface AdmissionInquiry {
    id: string;
    inquiry_number?: string;
    student_name: string;
    parent_name?: string;
    parent_email?: string;
    parent_phone?: string;
    phone?: string;
    email?: string;
    grade_applied_for?: string;
    source?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
    assigned_counselor?: string;
    assigned_counselor_id?: string;
    application_id?: string;
    counselor?: string;
    enquiry_id?: string;
    lead_id?: string;
    converted_at?: string;
    assigned_at?: string;
    assigned_by?: string;
}

export interface Lead extends AdmissionInquiry {
    priority?: LeadScoreTier;
    score?: number;
    next_followup_at?: string;
    communication_count?: number;
    document_count?: number;
}

export type LeadScoreTier = 'cold' | 'warm' | 'hot' | 'excellent';

export interface Followup {
    id: string;
    lead_id?: string;
    enquiry_id?: string;
    scheduled_at?: string;
    due_date?: string;
    due_at?: string;
    remarks?: string;
    status?: 'pending' | 'completed' | 'missed' | 'upcoming';
    assigned_to?: string;
    assigned_staff?: string;
    completed_at?: string;
}

export interface Reminder {
    id: string;
    followup_id?: string;
    remind_at: string;
    message?: string;
}

export interface CounselorAssignment {
    leadId: string;
    counselorId: string;
    counselorName?: string;
    assignedAt?: string;
}

export interface LeadMetrics {
    walkInsToday: number;
    onlineToday: number;
    assigned: number;
    unassigned: number;
    pending: number;
    converted: number;
    conversionRate: number;
    avgFollowUpHours: number;
    avgResponseHours: number;
    applicationsSubmitted: number;
    todayFollowups: number;
    overdueFollowups: number;
    todayVisitors: number;
}

export interface LeadTimelineEntry {
    id: string;
    action: string;
    timestamp: string;
    actor?: string;
    remarks?: string;
}

export interface LeadScore {
    tier: LeadScoreTier;
    score: number;
    factors: { label: string; points: number }[];
}

export interface LeadDashboard {
    metrics: LeadMetrics;
    leads: Lead[];
    inquiries: AdmissionInquiry[];
    followups: Followup[];
}

export interface DuplicateMatch {
    id: string;
    student_name: string;
    parent_name?: string;
    phone?: string;
    email?: string;
    matchFields: string[];
    score: number;
}

export interface AdmissionTask {
    id: string;
    text: string;
    done: boolean;
    dueDate?: string;
}

export interface AdmissionDashboardStats {
    total?: number;
    pending?: number;
    approved?: number;
    enrolled?: number;
    [key: string]: unknown;
}

export interface AdmissionWorkflowActionPayload {
    remark?: string;
    reason?: string;
    fee_ids?: string[];
    amount?: number;
    status?: 'verified' | 'correction' | 'APPROVED' | 'REJECTED' | 'BLOCKED';
    mode?: string;
    reference?: string;
    proof_url?: string;
}
