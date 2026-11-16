export interface StaffSummaryDto {
  staff_id: string;
  id: string;
  employee_code: string;
  staff_name: string;
  email: string;
  designation_name: string | null;
  is_active: boolean;
  joining_date: string | null;
  created_at: string;
}
