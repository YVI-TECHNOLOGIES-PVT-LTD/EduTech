export interface EnrollmentResponseDto {
  enrollment_id: string;
  academic_year_grade_id: string;
  section_id: string | null;
  roll_number: string | null;
  enrollment_date: string;
  exit_date: string | null;
  status: string;
  remarks: string | null;
  section_name?: string | null;
}

export interface StudentParentResponseDto {
  parent_id: string;
  relationship: string;
  is_primary_contact: boolean;
  parent_first_name?: string | null;
  parent_last_name?: string | null;
  parent_phone?: string | null;
  parent_email?: string | null;
}

export interface StudentResponseDto {
  student_id: string;
  id: string;
  org_id: string;
  application_id: string;
  user_id: string | null;
  admission_no: string;
  first_name: string;
  last_name: string | null;
  student_name: string;
  dob: string | null;
  gender: string | null;
  admission_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  enrollments?: EnrollmentResponseDto[];
  parents?: StudentParentResponseDto[];
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
