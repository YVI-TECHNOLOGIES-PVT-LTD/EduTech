import { SectionResponseDto } from './section.response.dto';

export interface AcademicYearGradeResponseDto {
  academic_year_grade_id: string;
  id: string;
  academic_year_id: string;
  grade_id: string;
  intake_capacity: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  academic_year_name?: string;
  grade_code?: string;
  grade_name?: string;
  sections?: SectionResponseDto[];
}
