import { AcademicDashboardQuery } from '../queries/academic.dashboard';
import { AcademicStructureQuery } from '../queries/academic.structure';
import {
  AcademicAnalyticsRepository,
  AcademicOverviewMetrics,
} from '../repositories/academic.analytics.repository';
import { AcademicDashboardDto } from '../dto/response/dashboard.response.dto';
import { AcademicYearNotFoundError } from '../errors/academic.errors';

export class AcademicAnalyticsService {
  static async getOverview(orgId: string): Promise<AcademicOverviewMetrics> {
    return AcademicAnalyticsRepository.getOverview(orgId);
  }

  static async getDashboardMetrics(orgId: string): Promise<AcademicDashboardDto> {
    return AcademicDashboardQuery.execute(orgId);
  }

  static async getStructureTree(orgId: string, academicYearId: string) {
    const tree = await AcademicStructureQuery.getFullStructure(orgId, academicYearId);
    if (!tree) {
      throw new AcademicYearNotFoundError(academicYearId);
    }
    return tree;
  }
}
