export interface DocumentResponseDto {
  document_id: string;
  document_type_id: string;
  file_path: string;
  verify_status: string;
  verification_remarks: string | null;
  uploaded_at: string;
  verified_by: string | null;
  verified_at: string | null;
}

export interface AssessmentResponseDto {
  assessment_id: string;
  config_id: string;
  assessment_date: string;
  maximum_marks: number | null;
  marks_obtained: number | null;
  percentage: number | null;
  result: string | null;
  remarks: string | null;
  assessed_by: string | null;
}

export interface DecisionResponseDto {
  decision_id: string;
  decision_status: string;
  decision_date: string;
  decided_by: string | null;
  reason: string | null;
  remarks: string | null;
  offer_expiry_date: string | null;
  waitlist_position: number | null;
  scholarship_percentage: number | null;
}

export interface FeePaymentResponseDto {
  payment_id: string;
  payment_status: string;
  amount: number;
  payment_date: string | null;
  transaction_reference: string | null;
  remarks: string | null;
}

export interface ApplicationResponseDto {
  application_id: string;
  id: string; // Alias
  lead_id: string;
  org_id: string;
  academic_year_id: string;
  application_number: string;
  application_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  lead?: {
    lead_id: string;
    lead_number: string;
    student_first_name: string;
    student_last_name: string | null;
    student_name: string;
    contact_name: string;
    contact_phone: string;
    contact_email: string | null;
  } | null;
  academic_year?: {
    academic_year_id: string;
    academic_year_name: string;
  } | null;
  documents?: DocumentResponseDto[];
  assessment?: AssessmentResponseDto | null;
  decision?: DecisionResponseDto | null;
  payment?: FeePaymentResponseDto | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
