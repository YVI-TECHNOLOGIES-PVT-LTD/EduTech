export type ApplicationStatus =
  | 'draft'
  | 'documents_pending'
  | 'submitted'
  | 'under_review'
  | 'assessment_pending'
  | 'assessment_completed'
  | 'approved'
  | 'waitlisted'
  | 'rejected'
  | 'enrolled'
  | 'withdrawn';

export type DecisionStatus = 'approved' | 'waitlisted' | 'rejected' | 'withdrawn' | 'pending';

export type PaymentStatus = 'pending' | 'paid' | 'waived' | 'failed' | 'refunded';

export type PaymentMode =
  'cash' | 'card' | 'upi' | 'netbanking' | 'bank_transfer' | 'cheque' | 'waived';

export interface AcademicYear {
  academic_year_id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  is_current?: boolean;
  status?: string;
}

export interface GradeClass {
  grade_id: string;
  grade_name: string;
  academic_year_grade_id?: string;
  capacity?: number;
  available_seats?: number;
}

export interface DocumentType {
  document_type_id: string;
  document_name: string;
  description?: string;
  is_mandatory: boolean;
  max_size_mb?: number;
  allowed_formats?: string[];
}

export interface AdmissionDocument {
  document_id: string;
  application_id: string;
  document_type_id: string;
  document_types?: DocumentType;
  file_name?: string;
  storage_path?: string;
  verify_status: 'pending' | 'verified' | 'rejected';
  rejection_reason?: string | null;
  uploaded_at?: string;
  created_at?: string;
}

export interface AssessmentResult {
  assessment_id: string;
  application_id: string;
  config_id?: string;
  assessment_date?: string;
  maximum_marks?: number;
  marks_obtained?: number;
  percentage?: number;
  result: 'pass' | 'fail' | 'pending';
  remarks?: string | null;
  evaluator_name?: string | null;
  assessed_by?: string | null;
}

export interface AdmissionDecision {
  decision_id: string;
  application_id: string;
  decision_status: DecisionStatus;
  decision_date?: string;
  remarks?: string | null;
  offer_expiry_date?: string | null;
  waitlist_position?: number | null;
  scholarship_percentage?: number | null;
  decided_by?: string | null;
}

export interface FeeSummary {
  application_id: string;
  application_number: string;
  org_id: string;
  org_name?: string | null;
  academic_year_id: string;
  currency: string;
  application_fee: number;
  processing_fee: number;
  total_fee: number;
  scholarship_percentage?: number | null;
  payment_status: PaymentStatus;
  bank_details?: {
    account_name: string;
    account_number: string;
    ifsc_code: string;
    bank_name: string;
    branch_name?: string;
    upi_id?: string;
  } | null;
  payment?: {
    payment_id: string;
    payment_status: PaymentStatus;
    amount: number;
    payment_date: string | null;
    transaction_reference: string;
    payment_mode: PaymentMode;
    card_name?: string | null;
    card_last_four?: string | null;
    remarks?: string | null;
  } | null;
}

export interface FeeReceipt {
  receipt_number: string;
  application_id: string;
  application_number: string;
  student_name: string;
  parent_name: string;
  payment_id: string;
  amount: number;
  currency: string;
  payment_mode: PaymentMode;
  payment_status: PaymentStatus;
  transaction_reference: string;
  payment_date: string;
  organization_name?: string;
  breakdown?: {
    application_fee: number;
    processing_fee: number;
    scholarship_amount?: number;
  };
}

export interface EnrolledStudentInfo {
  student_id: string;
  admission_no: string;
  roll_no?: string | null;
  section_name?: string | null;
  enrolled_date?: string | null;
  status: string;
}

export interface AdmissionApplication {
  application_id: string;
  application_number: string;
  lead_id?: string | null;
  org_id: string;
  academic_year_id: string;
  academic_year_grade_id?: string | null;
  student_first_name: string;
  student_last_name?: string | null;
  student_name?: string | null;
  grade_applied_for?: string | null;
  application_date?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  parent_name?: string | null;
  parent_email?: string | null;
  parent_phone?: string | null;
  contact_relationship?: string | null;
  previous_school_name?: string | null;
  previous_grade?: string | null;
  previous_percentage?: number | null;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
  lead?: any;
  leads?: {
    lead_id: string;
    student_first_name?: string | null;
    student_last_name?: string | null;
    stage?: string;
    parents?: {
      parent_id: string;
      first_name?: string | null;
      last_name?: string | null;
      phone?: string | null;
      email?: string | null;
      user_id?: string | null;
    } | null;
    academic_year_grades?: {
      academic_year_grade_id: string;
      grades?: GradeClass | null;
      academic_years?: AcademicYear | null;
    } | null;
  } | null;
  organizations?: {
    org_id: string;
    org_name: string;
  } | null;
  academic_years?: AcademicYear | null;
  admission_documents?: AdmissionDocument[];
  application_assessments?: AssessmentResult[];
  admission_decisions?: AdmissionDecision[];
  admission_fee_payments?: any[];
  students?: EnrolledStudentInfo | null;
}

export interface CreateApplicationRequest {
  org_id: string;
  academic_year_id: string;
  academic_year_grade_id?: string;
  grade_applied_for?: string;
  student_first_name: string;
  student_last_name?: string;
  date_of_birth: string;
  gender: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  contact_relationship?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  previous_school_name?: string;
  previous_grade?: string;
  previous_percentage?: number;
  status?: ApplicationStatus;
}

export interface UpdateApplicationStatusRequest {
  status: ApplicationStatus;
}

export interface RecordPaymentRequest {
  payment_mode?: PaymentMode;
  transaction_reference?: string;
  remarks?: string;
}

export interface ApplicationTimelineEvent {
  id: string;
  type:
    | 'APPLICATION_CREATED'
    | 'DOCUMENT_UPLOADED'
    | 'DOCUMENT_VERIFIED'
    | 'ASSESSMENT_RECORDED'
    | 'DECISION_RECORDED'
    | 'PAYMENT_RECORDED'
    | string;
  title: string;
  description: string | null;
  performed_by: string | null;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ApplicationTimelineDto {
  application_id: string;
  timeline: ApplicationTimelineEvent[];
}

export interface AdmissionConfigResponse {
  organization: {
    org_id: string;
    org_name: string;
  };
  academic_years: AcademicYear[];
  grades: GradeClass[];
  admission_config?: {
    application_fee?: number;
    processing_fee?: number;
    is_open?: boolean;
    start_date?: string;
    end_date?: string;
  };
  requirements?: DocumentType[];
}
