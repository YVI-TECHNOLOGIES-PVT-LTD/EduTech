export interface SectionResponseDto {
  section_id: string;
  id: string;
  academic_year_grade_id: string;
  section_name: string;
  class_teacher_id: string | null;
  room_no: string | null;
  capacity: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  class_teacher_name?: string | null;
}
