export interface ParentDashboardDto {
  total_parents: number;
  parents_with_students: number;
  parents_by_relationship: Record<string, number>;
}
