import prisma from '../../../lib/prismaClient';

const db: any = prisma;

export class StaffAnalyticsRepository {
  static async getDashboardMetrics(orgId?: string) {
    const whereBase: any = {};
    if (orgId) whereBase.org_id = orgId;

    const [
      totalStaff,
      activeStaff,
      inactiveStaff,
      designationCountsRaw,
    ] = await Promise.all([
      db.staff.count({ where: whereBase }),
      db.staff.count({ where: { ...whereBase, is_active: true } }),
      db.staff.count({ where: { ...whereBase, is_active: false } }),
      db.staff.groupBy({
        by: ['designation_id'],
        where: whereBase,
        _count: { designation_id: true },
      }),
    ]);

    const designationCounts: Record<string, number> = {};
    for (const item of designationCountsRaw) {
      if (item.designation_id) {
        designationCounts[item.designation_id] = item._count.designation_id;
      }
    }

    return {
      total_staff: totalStaff,
      active_staff: activeStaff,
      inactive_staff: inactiveStaff,
      designation_counts: designationCounts,
    };
  }
}
