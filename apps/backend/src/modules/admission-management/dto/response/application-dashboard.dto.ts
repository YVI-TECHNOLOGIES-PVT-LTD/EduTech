export interface ApplicationDashboardDto {
  total_applications: number;
  today_applications: number;
  approved_applications: number;
  rejected_applications: number;
  pending_documents: number;
  pending_assessments: number;
  pending_payments: number;
  applications_by_status: Record<string, number>;
}
