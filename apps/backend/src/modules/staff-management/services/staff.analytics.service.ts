import { StaffDashboardQuery } from '../queries/staff.dashboard';
import { StaffTimelineQuery } from '../queries/staff.timeline';
import { StaffDashboardDto } from '../dto/response/staff-dashboard.dto';
import { StaffTimelineDto } from '../dto/response/staff-timeline.dto';

export class StaffAnalyticsService {
  static async getDashboardMetrics(orgId?: string): Promise<StaffDashboardDto> {
    return StaffDashboardQuery.execute(orgId);
  }

  static async getTimeline(staffId: string): Promise<StaffTimelineDto> {
    return StaffTimelineQuery.execute(staffId);
  }
}
