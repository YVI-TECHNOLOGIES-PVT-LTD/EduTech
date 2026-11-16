import { AdmissionDashboardQuery } from '../queries/admission.dashboard';
import { AdmissionPendingQuery } from '../queries/admission.pending';
import { AdmissionTimelineQuery } from '../queries/admission.timeline';
import { ApplicationDashboardDto } from '../dto/response/application-dashboard.dto';
import { ApplicationTimelineDto } from '../dto/response/application-timeline.dto';

export class AdmissionAnalyticsService {
  static async getDashboardMetrics(orgId?: string): Promise<ApplicationDashboardDto> {
    return AdmissionDashboardQuery.execute(orgId);
  }

  static async getTimeline(applicationId: string): Promise<ApplicationTimelineDto> {
    return AdmissionTimelineQuery.execute(applicationId);
  }

  static async getPendingItems(orgId?: string) {
    return AdmissionPendingQuery.execute(orgId);
  }
}
