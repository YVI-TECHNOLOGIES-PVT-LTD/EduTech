export interface UserDashboardDto {
  total_users: number;
  active_users: number;
  inactive_users: number;
  suspended_users: number;
  users_per_role: Record<string, number>;
}
