export interface GradeResponseDto {
  grade_id: string;
  id: string;
  org_id: string;
  grade_code: string;
  grade_name: string;
  board: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
