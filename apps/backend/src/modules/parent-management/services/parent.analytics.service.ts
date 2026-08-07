import { ParentDashboardQuery } from '../queries/parent.dashboard';
import { ParentTimelineQuery } from '../queries/parent.timeline';
import { ParentDashboardDto } from '../dto/response/parent-dashboard.dto';
import { ParentTimelineDto } from '../dto/response/parent-timeline.dto';

export class ParentAnalyticsService {
  static async getDashboardMetrics(orgId?: string): Promise<ParentDashboardDto> {
    return ParentDashboardQuery.execute(orgId);
  }

  static async getTimeline(parentId: string): Promise<ParentTimelineDto> {
    return ParentTimelineQuery.execute(parentId);
  }
}
