import { lead_priority, lead_stage, lead_source } from '@prisma/client';
import { LeadRepository } from '../repositories/lead.repository';
import { LeadNotFoundError } from '../errors/lead.errors';
import { LeadEvents, LeadEventType } from '../events/lead.events';
import { logger } from '../../../utils/logger';

export class LeadScoringService {
  static async evaluateAndQualify(leadId: string, performedBy?: string | null, orgId?: string) {
    const lead = await LeadRepository.findById(leadId);
    if (!lead) {
      throw new LeadNotFoundError(leadId);
    }
    if (orgId && lead.org_id !== orgId) {
      throw new LeadNotFoundError(leadId);
    }

    let score = 0;

    // 1. Contact Completeness (+25 max)
    if (lead.contact_phone && lead.contact_phone.trim() !== '') score += 10;
    if (lead.contact_email && lead.contact_email.trim() !== '') score += 10;
    if (lead.contact_name && lead.contact_name.trim() !== '') score += 5;

    // 2. Academic Intent (+20 max)
    if (lead.academic_year_grade_id) score += 15;
    if (lead.curriculum_preference) score += 5;

    // 3. Lead Source Quality (+20 max)
    const highIntentSources: string[] = [
      lead_source.walk_in,
      lead_source.referral,
      lead_source.education_fair,
      lead_source.phone_call,
    ];
    if (highIntentSources.includes(lead.source)) {
      score += 20;
    } else if (lead.source === lead_source.website) {
      score += 15;
    } else {
      score += 10;
    }

    // 4. Contact Consent (+15 max)
    if (lead.contact_consent) score += 15;

    // 5. Activity & Engagement History (+20 max)
    const activityCount = lead.lead_activities?.length || 0;
    const visitCount = lead.lead_visits?.length || 0;
    if (visitCount > 0) {
      score += 20;
    } else if (activityCount >= 2) {
      score += 15;
    } else if (activityCount === 1) {
      score += 10;
    }

    // Determine priority based on score
    let priority: lead_priority = lead_priority.medium;
    if (score >= 75) {
      priority = lead_priority.high;
    } else if (score < 45) {
      priority = lead_priority.low;
    }

    // Determine target stage
    const isQualified = score >= 50;
    const newStage: lead_stage = isQualified ? lead_stage.qualified : lead.stage;

    const updated = await LeadRepository.update(leadId, {
      ai_lead_score: score as any,
      priority,
      stage: newStage,
    });

    logger.info(
      `Lead ${leadId} evaluated: Score=${score}, Priority=${priority}, Qualified=${isQualified}`,
      {
        leadId,
        score,
        priority,
        isQualified,
        performedBy,
      },
    );

    await LeadEvents.publish(LeadEventType.STATUS_CHANGED, {
      leadId,
      performedBy,
      timestamp: new Date().toISOString(),
      metadata: { score, priority, stage: newStage, isQualified },
    });

    return {
      lead_id: leadId,
      score,
      priority,
      stage: newStage,
      isQualified,
      lead: updated,
    };
  }
}
