import {
  visit_type,
  visit_status,
  lead_activity_type,
  lead_stage,
  activity_status,
} from '@prisma/client';
import {
  LeadVisitRepository,
  CreateVisitDto,
  UpdateVisitDto,
} from '../repositories/lead.visit.repository';
import { LeadRepository } from '../repositories/lead.repository';
import { LeadActivityRepository } from '../repositories/lead.activity.repository';
import { LeadNotFoundError, LeadValidationError } from '../errors/lead.errors';
import { LeadEvents, LeadEventType } from '../events/lead.events';
import { logger } from '../../../utils/logger';

export class LeadVisitService {
  static async scheduleVisit(dto: CreateVisitDto, performedBy?: string | null, orgId?: string) {
    const lead = await LeadRepository.findById(dto.lead_id);
    if (!lead) {
      throw new LeadNotFoundError(dto.lead_id);
    }

    if (orgId && lead.org_id !== orgId) {
      throw new LeadNotFoundError(dto.lead_id);
    }

    const visitDate = new Date(dto.scheduled_at);
    if (isNaN(visitDate.getTime())) {
      throw new LeadValidationError('Invalid scheduled date/time');
    }

    const visit = await LeadVisitRepository.create(dto, performedBy);

    // Record timeline activity
    const activityType: lead_activity_type =
      dto.visit_type === visit_type.virtual
        ? lead_activity_type.counselling
        : lead_activity_type.follow_up;
    const label = dto.visit_type === visit_type.virtual ? 'Virtual Counselling' : 'Campus Visit';

    await LeadActivityRepository.create(dto.lead_id, performedBy || null, {
      activity_type: activityType,
      status: activity_status.scheduled,
      notes: `${label} scheduled for ${visitDate.toLocaleString()}. ${dto.remarks || ''}`.trim(),
      activity_date: visitDate.toISOString(),
    });

    logger.info(`Lead visit/counselling scheduled: ${visit.visit_id} for lead ${dto.lead_id}`, {
      visitId: visit.visit_id,
      leadId: dto.lead_id,
      visitType: dto.visit_type,
      scheduledAt: dto.scheduled_at,
      performedBy,
    });

    return visit;
  }

  static async getVisitsByLead(leadId: string, orgId?: string) {
    const lead = await LeadRepository.findById(leadId);
    if (!lead) {
      throw new LeadNotFoundError(leadId);
    }
    if (orgId && lead.org_id !== orgId) {
      throw new LeadNotFoundError(leadId);
    }

    return LeadVisitRepository.findByLeadId(leadId);
  }

  static async getQueue(params: {
    org_id?: string;
    staff_id?: string;
    visit_type?: visit_type;
    status?: visit_status;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }) {
    return LeadVisitRepository.findQueue(params);
  }

  static async updateVisitStatus(
    visitId: string,
    dto: UpdateVisitDto,
    performedBy?: string | null,
    orgId?: string,
  ) {
    const visit = await LeadVisitRepository.findById(visitId);
    if (!visit) {
      throw new LeadValidationError(`Visit not found: ${visitId}`);
    }

    if (orgId && visit.leads?.org_id && visit.leads.org_id !== orgId) {
      throw new LeadValidationError(`Visit not found: ${visitId}`);
    }

    const updated = await LeadVisitRepository.update(visitId, dto, performedBy);

    if (dto.status === visit_status.completed) {
      const label =
        visit.visit_type === visit_type.virtual ? 'Counselling Session' : 'Campus Visit';
      await LeadActivityRepository.create(visit.lead_id, performedBy || null, {
        activity_type:
          visit.visit_type === visit_type.virtual
            ? lead_activity_type.counselling
            : lead_activity_type.note,
        status: activity_status.completed,
        notes:
          `${label} marked as COMPLETED. Outcome remarks: ${dto.remarks || 'Visited campus / session complete'}`.trim(),
      });
    }

    logger.info(`Lead visit updated: ${visitId} to status ${dto.status}`, {
      visitId,
      status: dto.status,
      performedBy,
    });

    return updated;
  }

  static async deleteVisit(visitId: string, performedBy?: string | null, orgId?: string) {
    const visit = await LeadVisitRepository.findById(visitId);
    if (!visit) {
      throw new LeadValidationError(`Visit not found: ${visitId}`);
    }

    if (orgId && visit.leads?.org_id && visit.leads.org_id !== orgId) {
      throw new LeadValidationError(`Visit not found: ${visitId}`);
    }

    await LeadVisitRepository.delete(visitId);

    logger.info(`Lead visit deleted: ${visitId}`, { visitId, performedBy });
    return { success: true };
  }
}
