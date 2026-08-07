import { UserAnalyticsRepository } from '../repositories/user.analytics.repository';
import { UserDashboardDto } from '../dto/response/user-dashboard.dto';

export class UserDashboardQuery {
  static async execute(orgId?: string): Promise<UserDashboardDto> {
    return UserAnalyticsRepository.getDashboardMetrics(orgId);
  }
}
