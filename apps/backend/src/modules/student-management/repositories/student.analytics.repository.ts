import prisma from '../../../lib/prismaClient';

const db: any = prisma;

export class StudentAnalyticsRepository {
  static async getDashboardMetrics(orgId?: string) {
    const whereBase: any = {};
    if (orgId) whereBase.org_id = orgId;

    const [
      totalStudents,
      statusCounts,
      genderCounts,
    ] = await Promise.all([
      db.students.count({ where: whereBase }),
      db.students.groupBy({
        by: ['status'],
        where: whereBase,
        _count: { status: true },
      }),
      db.students.groupBy({
        by: ['gender'],
        where: whereBase,
        _count: { gender: true },
      }),
    ]);

    const studentsByStatus: Record<string, number> = {};
    for (const item of statusCounts) {
      if (item.status) {
        studentsByStatus[item.status] = item._count.status;
      }
    }

    const studentsByGender: Record<string, number> = {};
    for (const item of genderCounts) {
      if (item.gender) {
        studentsByGender[item.gender] = item._count.gender;
      }
    }

    return {
      total_students: totalStudents,
      active_students: studentsByStatus['active'] || 0,
      transferred_students: studentsByStatus['transferred_out'] || 0,
      graduated_students: studentsByStatus['graduated'] || 0,
      withdrawn_students: studentsByStatus['withdrawn'] || 0,
      students_by_status: studentsByStatus,
      students_by_gender: studentsByGender,
    };
  }
}
