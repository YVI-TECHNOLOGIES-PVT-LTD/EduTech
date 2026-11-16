import { StaffAnalyticsRepository } from '../repositories/staff.analytics.repository';
import { StaffDashboardDto } from '../dto/response/staff-dashboard.dto';

export class StaffDashboardQuery {
  static async execute(orgId?: string): Promise<StaffDashboardDto> {
    return StaffAnalyticsRepository.getDashboardMetrics(orgId);
  }
}
