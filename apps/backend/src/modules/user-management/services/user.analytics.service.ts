import { UserDashboardQuery } from '../queries/user.dashboard';
import { UserTimelineQuery } from '../queries/user.timeline';
import { UserDashboardDto } from '../dto/response/user-dashboard.dto';
import { UserTimelineDto } from '../dto/response/user-timeline.dto';

export class UserAnalyticsService {
  static async getDashboardMetrics(orgId?: string): Promise<UserDashboardDto> {
    return UserDashboardQuery.execute(orgId);
  }

  static async getTimeline(userId: string): Promise<UserTimelineDto> {
    return UserTimelineQuery.execute(userId);
  }
}
