import prisma from '../../../lib/prismaClient';
import { admission_decision_status, application_status } from '@prisma/client';
import { AdmissionDecisionRepository } from '../repositories/admission.decision.repository';
import { AdmissionRepository } from '../repositories/admission.repository';
import { ApplicationNotFoundError, ApplicationValidationError } from '../errors/admission.errors';
import { RecordDecisionDto } from '../dto/request/record-decision.dto';
import { AdmissionEvents, ApplicationEventType } from '../events/admission.events';
import { logger } from '../../../utils/logger';

export class AdmissionDecisionService {
  static async recordDecision(
    applicationId: string,
    createdBy: string | null,
    dto: RecordDecisionDto,
    orgId?: string,
  ) {
    const app = await AdmissionRepository.findById(applicationId, orgId);
    if (!app) {
      throw new ApplicationNotFoundError(applicationId);
    }

    // Document Completeness Gate for Approval
    if (dto.decision_status === admission_decision_status.approved) {
      const pendingDocs = await prisma.admission_documents.count({
        where: {
          application_id: applicationId,
          verify_status: 'pending',
        },
      });
      if (pendingDocs > 0) {
        throw new ApplicationValidationError(
          'Document completeness gate: All uploaded documents must be verified before approving admission decision',
        );
      }
    }

    // Determine target application_status based on decision
    let targetStatus: application_status | null = null;
    if (dto.decision_status === admission_decision_status.approved) {
      targetStatus = application_status.approved;
    } else if (dto.decision_status === admission_decision_status.waitlisted) {
      targetStatus = application_status.waitlisted;
    } else if (dto.decision_status === admission_decision_status.rejected) {
      targetStatus = application_status.rejected;
    } else if (dto.decision_status === admission_decision_status.withdrawn) {
      targetStatus = application_status.withdrawn;
    }

    // Atomic transaction for decision + application status sync
    const decision = await prisma.$transaction(async (tx) => {
      const dec = await AdmissionDecisionRepository.upsert(applicationId, createdBy, dto);
      if (targetStatus) {
        await tx.admissions_applications.update({
          where: { application_id: applicationId },
          data: {
            status: targetStatus,
            updated_at: new Date(),
            updated_by: createdBy || undefined,
          },
        });
      }
      return dec;
    });

    logger.info(`Decision recorded for application ${applicationId}: ${decision.decision_status}`, {
      applicationId,
      decisionId: decision.decision_id,
      decisionStatus: decision.decision_status,
      targetStatus,
      createdBy,
    });

    // Post-commit event emission
    await AdmissionEvents.publish(ApplicationEventType.DECISION_RECORDED, {
      applicationId,
      performedBy: createdBy,
      timestamp: new Date().toISOString(),
      metadata: { decisionId: decision.decision_id, decisionStatus: decision.decision_status },
    });

    if (dto.decision_status === admission_decision_status.approved) {
      await AdmissionEvents.publish(ApplicationEventType.APPROVED, {
        applicationId,
        performedBy: createdBy,
        timestamp: new Date().toISOString(),
      });
    } else if (dto.decision_status === admission_decision_status.rejected) {
      await AdmissionEvents.publish(ApplicationEventType.REJECTED, {
        applicationId,
        performedBy: createdBy,
        timestamp: new Date().toISOString(),
      });
    }

    return decision;
  }

  static async getDecisionByApplication(applicationId: string) {
    const app = await AdmissionRepository.findById(applicationId);
    if (!app) {
      throw new ApplicationNotFoundError(applicationId);
    }

    return AdmissionDecisionRepository.findByApplicationId(applicationId);
  }
}
