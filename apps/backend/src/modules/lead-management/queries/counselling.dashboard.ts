import prisma from '../../../lib/prismaClient';

export interface CounsellingMetricsDto {
  today_counselling: number;
  pending_followups: number;
  unassigned_leads: number;
  hot_leads: number;
  total_leads: number;
  leads_by_priority: Record<string, number>;
  leads_by_stage: Record<string, number>;
}

export class CounsellingDashboardQuery {
  static async execute(orgId?: string): Promise<CounsellingMetricsDto> {
    const whereBase: any = {};
    if (orgId) {
      whereBase.org_id = orgId;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalLeads,
      unassignedLeads,
      hotLeads,
      pendingFollowups,
      todayActivities,
      todayVisits,
      priorityCounts,
      stageCounts,
    ] = await Promise.all([
      prisma.leads.count({ where: whereBase }),
      prisma.leads.count({
        where: {
          ...whereBase,
          assigned_counsellor_id: null,
        },
      }),
      prisma.leads.count({
        where: {
          ...whereBase,
          priority: 'high',
        },
      }),
      prisma.lead_activities.count({
        where: {
          status: 'scheduled',
          next_followup_date: { not: null },
          leads: whereBase,
        },
      }),
      prisma.lead_activities.count({
        where: {
          leads: whereBase,
          OR: [
            {
              activity_type: 'counselling',
              activity_date: {
                gte: todayStart,
                lte: todayEnd,
              },
            },
            {
              activity_type: 'counselling',
              created_at: {
                gte: todayStart,
                lte: todayEnd,
              },
            },
            {
              next_followup_date: {
                gte: todayStart,
                lte: todayEnd,
              },
            },
          ],
        },
      }),
      prisma.lead_visits.count({
        where: {
          leads: whereBase,
          scheduled_at: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
      prisma.leads.groupBy({
        by: ['priority'],
        where: whereBase,
        _count: { priority: true },
      }),
      prisma.leads.groupBy({
        by: ['stage'],
        where: whereBase,
        _count: { stage: true },
      }),
    ]);

    const leadsByPriority: Record<string, number> = {};
    for (const item of priorityCounts) {
      if (item.priority) {
        leadsByPriority[item.priority] = item._count.priority;
      }
    }

    const leadsByStage: Record<string, number> = {};
    for (const item of stageCounts) {
      leadsByStage[item.stage] = item._count.stage;
    }

    const todayCounselling = todayActivities + todayVisits;

    return {
      today_counselling: todayCounselling,
      pending_followups: pendingFollowups,
      unassigned_leads: unassignedLeads,
      hot_leads: hotLeads,
      total_leads: totalLeads,
      leads_by_priority: leadsByPriority,
      leads_by_stage: leadsByStage,
    };
  }
}
