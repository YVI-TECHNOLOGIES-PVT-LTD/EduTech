import { StudentAnalyticsRepository } from '../repositories/student.analytics.repository';
import { StudentDashboardDto } from '../dto/response/student-dashboard.dto';

export class StudentDashboardQuery {
  static async execute(orgId?: string): Promise<StudentDashboardDto> {
    return StudentAnalyticsRepository.getDashboardMetrics(orgId);
  }
}
