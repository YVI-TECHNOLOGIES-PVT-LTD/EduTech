import { AcademicAnalyticsRepository } from '../repositories/academic.analytics.repository';
import { AcademicDashboardDto } from '../dto/response/dashboard.response.dto';

export class AcademicDashboardQuery {
  static async execute(orgId?: string): Promise<AcademicDashboardDto> {
    return AcademicAnalyticsRepository.getDashboardMetrics(orgId);
  }
}
