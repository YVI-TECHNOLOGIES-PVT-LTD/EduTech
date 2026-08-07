export interface ParentSummaryDto {
  parent_id: string;
  id: string;
  parent_name: string;
  phone: string;
  email: string | null;
  linked_students_count: number;
  created_at: string;
}
