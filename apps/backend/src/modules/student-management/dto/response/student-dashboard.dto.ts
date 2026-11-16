export interface StudentDashboardDto {
  total_students: number;
  active_students: number;
  transferred_students: number;
  graduated_students: number;
  withdrawn_students: number;
  students_by_status: Record<string, number>;
  students_by_gender: Record<string, number>;
}
