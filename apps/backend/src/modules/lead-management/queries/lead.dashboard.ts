import prisma from '../../../lib/prismaClient';
import { LeadDashboardDto } from '../dto/response/lead-dashboard.dto';

export class LeadDashboardQuery {
  static async execute(orgId?: string): Promise<LeadDashboardDto> {
    const whereBase: any = {};
    if (orgId) {
      whereBase.org_id = orgId;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalLeads, todayLeads, stageCounts, sourceCounts, pendingFollowups] = await Promise.all(
      [
        prisma.leads.count({ where: whereBase }),
        prisma.leads.count({
          where: {
            ...whereBase,
            created_at: { gte: todayStart },
          },
        }),
        prisma.leads.groupBy({
          by: ['stage'],
          where: whereBase,
          _count: { stage: true },
        }),
        prisma.leads.groupBy({
          by: ['source'],
          where: whereBase,
          _count: { source: true },
        }),
        prisma.lead_activities.count({
          where: {
            status: 'scheduled',
            leads: whereBase,
          },
        }),
      ],
    );

    const leadsByStatus: Record<string, number> = {};
    for (const item of stageCounts) {
      leadsByStatus[item.stage] = item._count.stage;
    }

    const leadsBySource: Record<string, number> = {};
    for (const item of sourceCounts) {
      leadsBySource[item.source] = item._count.source;
    }

    return {
      total_leads: totalLeads,
      today_leads: todayLeads,
      qualified_leads: leadsByStatus['qualified'] || 0,
      lost_leads: leadsByStatus['rejected'] || 0,
      converted_leads: leadsByStatus['enrolled'] || 0,
      pending_followups: pendingFollowups,
      leads_by_source: leadsBySource,
      leads_by_status: leadsByStatus,
    };
  }
}
