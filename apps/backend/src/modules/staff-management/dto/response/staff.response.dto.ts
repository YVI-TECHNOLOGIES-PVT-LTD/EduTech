export interface StaffResponseDto {
  staff_id: string;
  id: string;
  org_id: string;
  user_id: string;
  employee_code: string;
  first_name: string;
  last_name: string | null;
  staff_name: string;
  phone: string;
  email: string;
  designation_id: string | null;
  designation_name: string | null;
  department_id: string | null;
  joining_date: string | null;
  is_active: boolean;
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
