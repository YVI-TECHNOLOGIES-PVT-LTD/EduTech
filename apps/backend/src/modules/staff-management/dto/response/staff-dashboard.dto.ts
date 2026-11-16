export interface StaffDashboardDto {
  total_staff: number;
  active_staff: number;
  inactive_staff: number;
  designation_counts: Record<string, number>;
}
