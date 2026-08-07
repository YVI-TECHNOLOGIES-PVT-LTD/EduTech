import { LeadRepository } from '../repositories/lead.repository';
import { LeadNotFoundError } from '../errors/lead.errors';
import { LeadEvents, LeadEventType } from '../events/lead.events';
import { LeadMapper } from '../mappers/lead.mapper';
import { LeadResponseDto } from '../dto/response/lead.response.dto';
import { logger } from '../../../utils/logger';

export class LeadAssignmentService {
  static async assignCounselor(
    id: string,
    counselorId: string,
    performedBy?: string | null,
    remarks?: string,
  ): Promise<LeadResponseDto> {
    const existing = await LeadRepository.findById(id);
    if (!existing) {
      throw new LeadNotFoundError(id);
    }

    const updated = await LeadRepository.assignCounselor(id, counselorId);

    logger.info(`Assigned counselor ${counselorId} to lead ${id}`, {
      leadId: id,
      counselorId,
      performedBy,
      remarks,
    });

    await LeadEvents.publish(LeadEventType.ASSIGNED, {
      leadId: id,
      counselorId,
      performedBy,
      timestamp: new Date().toISOString(),
      metadata: { remarks },
    });

    return LeadMapper.toResponseDto(updated);
  }

  static async bulkAssignCounselor(
    leadIds: string[],
    counselorId: string,
    performedBy?: string | null,
    remarks?: string,
  ): Promise<{ updatedCount: number }> {
    const result = await LeadRepository.bulkAssignCounselor(leadIds, counselorId);

    logger.info(`Bulk assigned counselor ${counselorId} to ${result.count} leads`, {
      leadCount: result.count,
      counselorId,
      performedBy,
      remarks,
    });

    for (const leadId of leadIds) {
      await LeadEvents.publish(LeadEventType.ASSIGNED, {
        leadId,
        counselorId,
        performedBy,
        timestamp: new Date().toISOString(),
        metadata: { remarks },
      });
    }

    return { updatedCount: result.count };
  }
}
