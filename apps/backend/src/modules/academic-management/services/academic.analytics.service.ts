import { AcademicDashboardQuery } from '../queries/academic.dashboard';
import { AcademicStructureQuery } from '../queries/academic.structure';
import { AcademicDashboardDto } from '../dto/response/dashboard.response.dto';

export class AcademicAnalyticsService {
  static async getDashboardMetrics(orgId?: string): Promise<AcademicDashboardDto> {
    return AcademicDashboardQuery.execute(orgId);
  }

  static async getStructureTree(academicYearId: string) {
    return AcademicStructureQuery.getFullStructure(academicYearId);
  }
}
