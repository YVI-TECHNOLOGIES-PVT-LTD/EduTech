import prisma from '../../../lib/prismaClient';
import { AdmissionAssessmentRepository } from '../repositories/admission.assessment.repository';
import { AdmissionRepository } from '../repositories/admission.repository';
import { ApplicationNotFoundError, ApplicationValidationError } from '../errors/admission.errors';
import { RecordAssessmentDto } from '../dto/request/record-assessment.dto';
import { AdmissionEvents, ApplicationEventType } from '../events/admission.events';
import { logger } from '../../../utils/logger';

export class AdmissionAssessmentService {
  static async recordAssessment(
    applicationId: string,
    createdBy: string | null,
    dto: RecordAssessmentDto,
    orgId?: string,
  ) {
    const app = await AdmissionRepository.findById(applicationId, orgId);
    if (!app) {
      throw new ApplicationNotFoundError(applicationId);
    }

    // Document Completeness Gate
    const pendingDocs = await prisma.admission_documents.count({
      where: {
        application_id: applicationId,
        verify_status: 'pending',
      },
    });
    if (pendingDocs > 0) {
      throw new ApplicationValidationError(
        'Document completeness gate: All uploaded documents must be verified before recording assessment',
      );
    }

    if (
      dto.maximum_marks !== undefined &&
      dto.maximum_marks !== null &&
      dto.marks_obtained !== undefined &&
      dto.marks_obtained !== null
    ) {
      if (dto.marks_obtained < 0) {
        throw new ApplicationValidationError('Marks obtained cannot be negative');
      }
      if (dto.marks_obtained > dto.maximum_marks) {
        throw new ApplicationValidationError('Marks obtained cannot exceed maximum marks');
      }
      if (dto.maximum_marks > 0) {
        dto.percentage = Number(((dto.marks_obtained / dto.maximum_marks) * 100).toFixed(2));
      }
    }

    let configId = dto.config_id;
    if (!configId) {
      const activeConfig = await prisma.assessment_configurations.findFirst({
        where: { is_active: true },
      });
      configId = activeConfig?.config_id;
    }
    if (!configId) {
      const anyConfig = await prisma.assessment_configurations.findFirst();
      configId = anyConfig?.config_id;
    }
    if (!configId) {
      throw new ApplicationValidationError('No assessment configuration found for recording marks');
    }

    const payload = { ...dto, config_id: configId };

    const assessment = await AdmissionAssessmentRepository.upsert(
      applicationId,
      createdBy,
      payload,
    );

    logger.info(`Assessment recorded for application ${applicationId}`, {
      applicationId,
      assessmentId: assessment.assessment_id,
      result: assessment.result,
      percentage: assessment.percentage,
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

  static async getAssessmentByApplication(applicationId: string, orgId?: string) {
    const app = await AdmissionRepository.findById(applicationId, orgId);
    if (!app) {
      throw new ApplicationNotFoundError(applicationId);
    }

    return AdmissionAssessmentRepository.findByApplicationId(applicationId);
  }
}
