import { lead_stage } from '@prisma/client';
import { LeadRepository } from '../repositories/lead.repository';
import { LeadValidator } from '../validators/lead.validator';
import { LeadNotFoundError } from '../errors/lead.errors';
import { LeadEvents, LeadEventType } from '../events/lead.events';
import { LeadMapper } from '../mappers/lead.mapper';
import { LeadResponseDto } from '../dto/response/lead.response.dto';
import { logger } from '../../../utils/logger';

export class LeadLifecycleService {
  static async updateStatus(
    id: string,
    targetStage: lead_stage,
    performedBy?: string | null,
    remarks?: string | null,
  ): Promise<LeadResponseDto> {
    const existing = await LeadRepository.findById(id);
    if (!existing) {
      throw new LeadNotFoundError(id);
    }

    LeadValidator.validateStatusTransition(existing.stage, targetStage, remarks);

    const updated = await LeadRepository.updateStatus(id, targetStage, remarks);

    logger.info(`Lead stage updated for lead ${id}: ${existing.stage} -> ${targetStage}`, {
      leadId: id,
      previousStage: existing.stage,
      newStage: targetStage,
      performedBy,
    });

    await LeadEvents.publish(LeadEventType.STATUS_CHANGED, {
      leadId: id,
      previousStatus: existing.stage,
      newStatus: targetStage,
      performedBy,
      timestamp: new Date().toISOString(),
    });

    if (targetStage === lead_stage.qualified) {
      await LeadEvents.publish(LeadEventType.QUALIFIED, {
        leadId: id,
        performedBy,
        timestamp: new Date().toISOString(),
      });
    } else if (targetStage === lead_stage.enrolled) {
      await LeadEvents.publish(LeadEventType.CONVERTED, {
        leadId: id,
        performedBy,
        timestamp: new Date().toISOString(),
      });
    }

    return LeadMapper.toResponseDto(updated);
  }
}
