import { LeadActivityRepository } from '../repositories/lead.activity.repository';
import { LeadRepository } from '../repositories/lead.repository';
import { LeadNotFoundError, LeadValidationError } from '../errors/lead.errors';
import { ActivityValidator } from '../validators/activity.validator';
import { CreateActivityDto, UpdateActivityDto } from '../dto/request/create-activity.dto';
import { LeadEvents, LeadEventType } from '../events/lead.events';
import { LeadTimelineQuery } from '../queries/lead.timeline';
import { LeadTimelineDto } from '../dto/response/lead-timeline.dto';
import { logger } from '../../../utils/logger';

export class LeadActivityService {
  static async createActivity(
    leadId: string,
    createdBy: string | null,
    dto: CreateActivityDto,
    orgId?: string,
  ) {
    const lead = await LeadRepository.findById(leadId, orgId);
    if (!lead) {
      throw new LeadNotFoundError(leadId);
    }

    ActivityValidator.validateCreate(dto);

    const activity = await LeadActivityRepository.create(leadId, createdBy, dto);

    await LeadEvents.publish(LeadEventType.ACTIVITY_ADDED, {
      leadId,
      orgId: lead.org_id,
      performedBy: createdBy || undefined,
      timestamp: new Date().toISOString(),
      metadata: { activityId: activity.activity_id, status: activity.status },
    });

    return activity;
  }

  static async getActivitiesByLead(leadId: string, orgId?: string) {
    const lead = await LeadRepository.findById(leadId, orgId);
    if (!lead) {
      throw new LeadNotFoundError(leadId);
    }

    return LeadActivityRepository.findByLeadId(leadId);
  }

  static async updateActivity(activityId: string, dto: UpdateActivityDto, orgId?: string) {
    const existing = await LeadActivityRepository.findById(activityId);
    if (!existing) {
      throw new LeadValidationError(`Activity with ID '${activityId}' was not found`);
    }

    if (orgId && existing.leads?.org_id && existing.leads.org_id !== orgId) {
      throw new LeadValidationError(`Activity with ID '${activityId}' was not found`);
    }

    const updated = await LeadActivityRepository.update(activityId, dto);

    await LeadEvents.publish(LeadEventType.ACTIVITY_ADDED, {
      leadId: existing.lead_id,
      orgId: existing.leads?.org_id,
      timestamp: new Date().toISOString(),
      metadata: { activityId, status: updated.status },
    });

    return updated;
  }

  static async deleteActivity(activityId: string, performedBy?: string | null, orgId?: string) {
    const existing = await LeadActivityRepository.findById(activityId);
    if (!existing) {
      throw new LeadValidationError(`Activity with ID '${activityId}' was not found`);
    }

    if (orgId && existing.leads?.org_id && existing.leads.org_id !== orgId) {
      throw new LeadValidationError(`Activity with ID '${activityId}' was not found`);
    }

    await LeadActivityRepository.delete(activityId);

    await LeadEvents.publish(LeadEventType.ACTIVITY_ADDED, {
      leadId: existing.lead_id,
      orgId: existing.leads?.org_id,
      performedBy: performedBy || undefined,
      timestamp: new Date().toISOString(),
      metadata: { activityId, deleted: true },
    });

    logger.info(`Lead activity deleted: ${activityId}`, { activityId, performedBy });
    return { success: true };
  }

  static async getTimeline(leadId: string, orgId?: string): Promise<LeadTimelineDto> {
    const lead = await LeadRepository.findById(leadId, orgId);
    if (!lead) {
      throw new LeadNotFoundError(leadId);
    }

    return LeadTimelineQuery.execute(leadId);
  }

  static async getDueFollowUps(params: {
    org_id?: string;
    staff_id?: string;
    date?: string;
    status?: any;
    page?: number;
    pageSize?: number;
  }) {
    return LeadActivityRepository.findFollowUpsDue(params);
  }
}
