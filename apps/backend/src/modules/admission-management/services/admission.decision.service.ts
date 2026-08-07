import { admission_decision_status } from '@prisma/client';
import { AdmissionDecisionRepository } from '../repositories/admission.decision.repository';
import { AdmissionRepository } from '../repositories/admission.repository';
import { ApplicationNotFoundError } from '../errors/admission.errors';
import { RecordDecisionDto } from '../dto/request/record-decision.dto';
import { AdmissionEvents, ApplicationEventType } from '../events/admission.events';
import { logger } from '../../../utils/logger';

export class AdmissionDecisionService {
  static async recordDecision(
    applicationId: string,
    createdBy: string | null,
    dto: RecordDecisionDto,
  ) {
    const app = await AdmissionRepository.findById(applicationId);
    if (!app) {
      throw new ApplicationNotFoundError(applicationId);
    }

    const decision = await AdmissionDecisionRepository.upsert(applicationId, createdBy, dto);

    logger.info(`Decision recorded for application ${applicationId}: ${decision.decision_status}`, {
      applicationId,
      decisionId: decision.decision_id,
      decisionStatus: decision.decision_status,
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
