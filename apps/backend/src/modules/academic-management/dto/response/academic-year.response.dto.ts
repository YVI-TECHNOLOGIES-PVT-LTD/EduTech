import { AcademicYearGradeResponseDto } from './academic-year-grade.response.dto';

export interface AcademicYearResponseDto {
  academic_year_id: string;
  id: string;
  org_id: string;
  academic_year_name: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  grade_offerings?: AcademicYearGradeResponseDto[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
