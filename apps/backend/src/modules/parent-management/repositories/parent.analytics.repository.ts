import prisma from '../../../lib/prismaClient';

const db: any = prisma;

export class ParentAnalyticsRepository {
  static async getDashboardMetrics(orgId?: string) {
    const whereBase: any = {};
    if (orgId) whereBase.org_id = orgId;

    const [
      totalParents,
      parentsWithStudentsCount,
      relationshipCounts,
    ] = await Promise.all([
      db.parents.count({ where: whereBase }),
      db.parents.count({
        where: {
          ...whereBase,
          student_parents: { some: {} },
        },
      }),
      db.student_parents.groupBy({
        by: ['relationship'],
        _count: { relationship: true },
      }),
    ]);

    const parentsByRelationship: Record<string, number> = {};
    for (const item of relationshipCounts) {
      if (item.relationship) {
        parentsByRelationship[item.relationship] = item._count.relationship;
      }
    }

    return {
      total_parents: totalParents,
      parents_with_students: parentsWithStudentsCount,
      parents_by_relationship: parentsByRelationship,
    };
  }
}
