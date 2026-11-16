import { ParentAnalyticsRepository } from '../repositories/parent.analytics.repository';
import { ParentDashboardDto } from '../dto/response/parent-dashboard.dto';

export class ParentDashboardQuery {
  static async execute(orgId?: string): Promise<ParentDashboardDto> {
    return ParentAnalyticsRepository.getDashboardMetrics(orgId);
  }
}
