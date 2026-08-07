import { StudentDashboardQuery } from '../queries/student.dashboard';
import { StudentTimelineQuery } from '../queries/student.timeline';
import { StudentDashboardDto } from '../dto/response/student-dashboard.dto';
import { StudentTimelineDto } from '../dto/response/student-timeline.dto';

export class StudentAnalyticsService {
  static async getDashboardMetrics(orgId?: string): Promise<StudentDashboardDto> {
    return StudentDashboardQuery.execute(orgId);
  }

  static async getTimeline(studentId: string): Promise<StudentTimelineDto> {
    return StudentTimelineQuery.execute(studentId);
  }
}
