import prisma from '../../../lib/prismaClient';
import {
  Prisma,
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

    const activityType: lead_activity_type =
      dto.visit_type === visit_type.virtual
        ? lead_activity_type.counselling
        : lead_activity_type.follow_up;
    const label = dto.visit_type === visit_type.virtual ? 'Virtual Counselling' : 'Campus Visit';

    const shouldAdvanceStage =
      lead.stage === lead_stage.enquiry_received || lead.stage === lead_stage.qualified;
    const nextStage = shouldAdvanceStage ? lead_stage.counselling_scheduled : lead.stage;

    const visit = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const v = await tx.lead_visits.create({
        data: {
          lead_id: dto.lead_id,
          visit_type: dto.visit_type,
          scheduled_at: visitDate,
          staff_id: dto.staff_id || undefined,
          meeting_link: dto.meeting_link || undefined,
          remarks: dto.remarks || undefined,
          created_by: performedBy || undefined,
        },
        include: {
          staff: true,
          leads: true,
        },
      });

      await tx.lead_activities.create({
        data: {
          lead_id: dto.lead_id,
          activity_type: activityType,
          status: activity_status.scheduled,
          notes:
            `${label} scheduled for ${visitDate.toLocaleString()}. ${dto.remarks || ''}`.trim(),
          activity_date: visitDate,
          created_by: performedBy || undefined,
        },
      });

      if (shouldAdvanceStage) {
        await tx.leads.update({
          where: { lead_id: dto.lead_id },
          data: {
            stage: nextStage,
            updated_at: new Date(),
            updated_by: performedBy || undefined,
          },
        });
      }

      return v;
    });

    logger.info(`Lead visit/counselling scheduled: ${visit.visit_id} for lead ${dto.lead_id}`, {
      visitId: visit.visit_id,
      leadId: dto.lead_id,
      visitType: dto.visit_type,
      scheduledAt: dto.scheduled_at,
      performedBy,
    });

    await LeadEvents.publish(LeadEventType.ACTIVITY_ADDED, {
      leadId: dto.lead_id,
      orgId: lead.org_id,
      performedBy: performedBy || undefined,
      timestamp: new Date().toISOString(),
      metadata: { visitId: visit.visit_id, visitType: dto.visit_type },
    });

    if (shouldAdvanceStage) {
      await LeadEvents.publish(LeadEventType.STATUS_CHANGED, {
        leadId: dto.lead_id,
        orgId: lead.org_id,
        previousStatus: lead.stage,
        newStatus: nextStage,
        performedBy: performedBy || undefined,
        timestamp: new Date().toISOString(),
      });
    }

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
    search?: string;
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

    // State machine validation
    if (visit.status !== visit_status.scheduled) {
      if (dto.status && dto.status !== visit.status) {
        throw new LeadValidationError(
          `Cannot change status of a visit that is already ${visit.status}`,
        );
      }
      if (dto.scheduled_at) {
        throw new LeadValidationError(`Cannot reschedule a visit that is already ${visit.status}`);
      }
    }

    const currentLeadStage = visit.leads?.stage;
    const shouldAdvanceToCampusVisit =
      dto.status === visit_status.completed &&
      visit.visit_type === visit_type.campus &&
      (currentLeadStage === lead_stage.enquiry_received ||
        currentLeadStage === lead_stage.qualified ||
        currentLeadStage === lead_stage.counselling_scheduled);

    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const v = await tx.lead_visits.update({
        where: { visit_id: visitId },
        data: {
          status: dto.status,
          scheduled_at: dto.scheduled_at ? new Date(dto.scheduled_at) : undefined,
          staff_id: dto.staff_id !== undefined ? dto.staff_id : undefined,
          meeting_link: dto.meeting_link !== undefined ? dto.meeting_link : undefined,
          remarks: dto.remarks !== undefined ? dto.remarks : undefined,
          updated_at: new Date(),
          updated_by: performedBy || undefined,
        },
        include: {
          staff: true,
          leads: true,
        },
      });

      if (dto.status === visit_status.completed) {
        const label =
          visit.visit_type === visit_type.virtual ? 'Counselling Session' : 'Campus Visit';
        await tx.lead_activities.create({
          data: {
            lead_id: visit.lead_id,
            activity_type:
              visit.visit_type === visit_type.virtual
                ? lead_activity_type.counselling
                : lead_activity_type.follow_up,
            status: activity_status.completed,
            notes:
              `${label} marked as COMPLETED. Outcome remarks: ${dto.remarks || 'Visited campus / session complete'}`.trim(),
            activity_date: new Date(),
            created_by: performedBy || undefined,
          },
        });
      }

      if (shouldAdvanceToCampusVisit) {
        await tx.leads.update({
          where: { lead_id: visit.lead_id },
          data: {
            stage: lead_stage.campus_visit,
            updated_at: new Date(),
            updated_by: performedBy || undefined,
          },
        });
      }

      return v;
    });

    logger.info(`Lead visit updated: ${visitId} to status ${dto.status}`, {
      visitId,
      status: dto.status,
      performedBy,
    });

    await LeadEvents.publish(LeadEventType.UPDATED, {
      leadId: visit.lead_id,
      orgId: visit.leads?.org_id,
      performedBy,
      timestamp: new Date().toISOString(),
      metadata: { visitId, status: dto.status },
    });

    if (dto.status === visit_status.completed) {
      await LeadEvents.publish(LeadEventType.ACTIVITY_ADDED, {
        leadId: visit.lead_id,
        orgId: visit.leads?.org_id,
        performedBy,
        timestamp: new Date().toISOString(),
        metadata: { visitId, status: dto.status },
      });
    }

    if (shouldAdvanceToCampusVisit) {
      await LeadEvents.publish(LeadEventType.STATUS_CHANGED, {
        leadId: visit.lead_id,
        orgId: visit.leads?.org_id,
        previousStatus: currentLeadStage,
        newStatus: lead_stage.campus_visit,
        performedBy,
        timestamp: new Date().toISOString(),
      });
    }

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
