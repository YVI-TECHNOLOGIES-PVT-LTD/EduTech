export interface CounselorSummary {
  staff_id: string;
  employee_code?: string;
  name?: string;
  email?: string | null;
}

export interface LeadResponseDto {
  lead_id: string;
  id: string; // Alias for lead_id
  org_id: string;
  lead_number: string;
  academic_year_grade_id: string;
  student_first_name: string;
  student_last_name: string | null;
  student_name: string; // Computed full name
  dob: string | null;
  gender: string | null;
  curriculum_preference: string | null;
  scholarship_interest: boolean;
  contact_name: string;
  parent_name: string; // Computed alias
  contact_relationship: string | null;
  contact_phone: string;
  parent_phone: string; // Computed alias
  contact_email: string | null;
  parent_email: string | null; // Computed alias
  source: string;
  stage: string;
  status: string; // Computed alias for stage
  priority: string | null;
  ai_lead_score: number | null;
  assigned_counsellor_id: string | null;
  counselor_id: string | null; // Alias
  counselor?: CounselorSummary | null;
  remarks: string | null;
  enquiry_date: string;
  created_at: string;
  updated_at: string;
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
