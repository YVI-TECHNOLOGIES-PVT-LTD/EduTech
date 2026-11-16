export interface LinkedStudentResponseDto {
  student_id: string;
  admission_no: string;
  student_first_name: string;
  student_last_name: string | null;
  student_name: string;
  relationship: string;
  is_primary_contact: boolean;
  status: string;
}

export interface ParentResponseDto {
  parent_id: string;
  id: string;
  org_id: string;
  first_name: string;
  last_name: string | null;
  parent_name: string;
  phone: string;
  email: string | null;
  occupation: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  linked_students?: LinkedStudentResponseDto[];
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
