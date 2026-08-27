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
      // Find config matching the application's academic_year_grade_id if possible
      const academicYearGradeId = app.leads?.academic_year_grade_id;
      if (academicYearGradeId) {
        const gradeConfig = await prisma.assessment_configurations.findFirst({
          where: {
            academic_year_grade_id: academicYearGradeId,
            is_active: true,
          },
        });
        if (gradeConfig) {
          configId = gradeConfig.config_id;
        }
      }

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
    }

    if (!configId) {
      throw new ApplicationValidationError('No assessment configuration found for recording marks');
    }

    // Determine result if not provided
    if (!dto.result && dto.percentage !== undefined && dto.percentage !== null) {
      const config = await prisma.assessment_configurations.findUnique({
        where: { config_id: configId },
      });
      const passMarks = config?.pass_marks ? Number(config.pass_marks) : 40;
      const maxMarks = config?.maximum_marks ? Number(config.maximum_marks) : 100;
      const passPercentage = maxMarks > 0 ? (passMarks / maxMarks) * 100 : 40;
      dto.result = (dto.percentage >= passPercentage ? 'pass' : 'fail') as any;
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
      assessed_by: assessment.assessed_by,
      createdBy,
    });

    // Update lead stage to assessment if lead exists
    if (app.lead_id) {
      await prisma.leads
        .update({
          where: { lead_id: app.lead_id },
          data: {
            stage: 'assessment',
            updated_at: new Date(),
          },
        })
        .catch((err) => {
          logger.warn(`Could not update lead stage for lead ${app.lead_id}: ${err.message}`);
        });
    }

    // Post-commit event emission
    await AdmissionEvents.publish(ApplicationEventType.ASSESSMENT_RECORDED, {
      applicationId,
      orgId: app.org_id,
      performedBy: createdBy,
      timestamp: new Date().toISOString(),
      metadata: { assessmentId: assessment.assessment_id, result: assessment.result },
    });

    return assessment;
  }

  static async getAssessmentByApplication(
    applicationId: string,
    orgId?: string,
    parentUserId?: string,
  ) {
    const app = await AdmissionRepository.findById(applicationId, orgId, parentUserId);
    if (!app) {
      throw new ApplicationNotFoundError(applicationId);
    }

    return AdmissionAssessmentRepository.findByApplicationId(applicationId);
  }

  static async listAssessments(params: {
    orgId?: string;
    academicYearId?: string;
    gradeId?: string;
    result?: string;
    searchText?: string;
    page?: number;
    pageSize?: number;
  }) {
    return AdmissionAssessmentRepository.findAll(params);
  }

  static async getAssessmentConfigs(orgId?: string) {
    return AdmissionAssessmentRepository.getConfigs(orgId);
  }

  static async upsertAssessmentConfig(
    academicYearGradeId: string,
    data: {
      assessment_required?: boolean;
      assessment_mode?: any;
      result_type?: any;
      maximum_marks?: number | null;
      pass_marks?: number | null;
      is_active?: boolean;
    },
    userId?: string | null,
  ) {
    if (
      data.maximum_marks !== undefined &&
      data.maximum_marks !== null &&
      data.pass_marks !== undefined &&
      data.pass_marks !== null
    ) {
      if (data.maximum_marks < 0 || data.pass_marks < 0) {
        throw new ApplicationValidationError('Marks cannot be negative');
      }
      if (data.pass_marks > data.maximum_marks) {
        throw new ApplicationValidationError('Pass marks cannot exceed maximum marks');
      }
    }

    return AdmissionAssessmentRepository.upsertConfig(academicYearGradeId, data, userId);
  }

  static async getAssessmentAnalytics(orgId?: string) {
    return AdmissionAssessmentRepository.getAnalytics(orgId);
  }
}
