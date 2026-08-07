import { AdmissionAssessmentRepository } from '../repositories/admission.assessment.repository';
import { AdmissionRepository } from '../repositories/admission.repository';
import { ApplicationNotFoundError } from '../errors/admission.errors';
import { RecordAssessmentDto } from '../dto/request/record-assessment.dto';
import { AdmissionEvents, ApplicationEventType } from '../events/admission.events';
import { logger } from '../../../utils/logger';

export class AdmissionAssessmentService {
  static async recordAssessment(
    applicationId: string,
    createdBy: string | null,
    dto: RecordAssessmentDto,
  ) {
    const app = await AdmissionRepository.findById(applicationId);
    if (!app) {
      throw new ApplicationNotFoundError(applicationId);
    }

    const assessment = await AdmissionAssessmentRepository.upsert(applicationId, createdBy, dto);

    logger.info(`Assessment recorded for application ${applicationId}`, {
      applicationId,
      assessmentId: assessment.assessment_id,
      result: assessment.result,
      createdBy,
    });

    // Post-commit event emission
    await AdmissionEvents.publish(ApplicationEventType.ASSESSMENT_RECORDED, {
      applicationId,
      performedBy: createdBy,
      timestamp: new Date().toISOString(),
      metadata: { assessmentId: assessment.assessment_id, result: assessment.result },
    });

    return assessment;
  }

  static async getAssessmentByApplication(applicationId: string) {
    const app = await AdmissionRepository.findById(applicationId);
    if (!app) {
      throw new ApplicationNotFoundError(applicationId);
    }

    return AdmissionAssessmentRepository.findByApplicationId(applicationId);
  }
}
