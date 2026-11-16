import { AdmissionAnalyticsRepository } from '../repositories/admission.analytics.repository';
import { ApplicationDashboardDto } from '../dto/response/application-dashboard.dto';

export class AdmissionDashboardQuery {
  static async execute(orgId?: string): Promise<ApplicationDashboardDto> {
    return AdmissionAnalyticsRepository.getDashboardMetrics(orgId);
  }
}
