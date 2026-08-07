export interface AcademicDashboardDto {
  total_academic_years: number;
  total_grades: number;
  total_sections: number;
  total_academic_year_grades: number;
  academic_years_by_status: Record<string, number>;
}
