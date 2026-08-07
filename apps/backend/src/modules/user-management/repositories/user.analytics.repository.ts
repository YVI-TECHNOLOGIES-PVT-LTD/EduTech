import prisma from '../../../lib/prismaClient';
import { user_status } from '../constants/user.constants';

const db: any = prisma;

export class UserAnalyticsRepository {
  static async getDashboardMetrics(orgId?: string) {
    const whereBase: any = {};
    if (orgId) whereBase.org_id = orgId;

    const [totalUsers, activeUsers, inactiveUsers, suspendedUsers, usersPerRoleRaw] =
      await Promise.all([
        db.users.count({ where: whereBase }),
        db.users.count({ where: { ...whereBase, status: user_status.active } }),
        db.users.count({ where: { ...whereBase, status: user_status.inactive } }),
        db.users.count({ where: { ...whereBase, status: user_status.suspended } }),
        db.user_roles.groupBy({
          by: ['role_id'],
          _count: { role_id: true },
        }),
      ]);

    const usersPerRole: Record<string, number> = {};
    for (const item of usersPerRoleRaw) {
      if (item.role_id) {
        usersPerRole[item.role_id] = item._count.role_id;
      }
    }

    return {
      total_users: totalUsers,
      active_users: activeUsers,
      inactive_users: inactiveUsers,
      suspended_users: suspendedUsers,
      users_per_role: usersPerRole,
    };
  }
}
