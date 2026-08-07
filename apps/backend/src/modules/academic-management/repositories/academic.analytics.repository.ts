import prisma from '../../../lib/prismaClient';

const db: any = prisma;

export class AcademicAnalyticsRepository {
  static async getDashboardMetrics(orgId?: string) {
    const yearWhere: any = {};
    const gradeWhere: any = {};
    if (orgId) {
      yearWhere.org_id = orgId;
      gradeWhere.org_id = orgId;
    }

    const [
      totalYears,
      totalGrades,
      totalSections,
      totalYearGrades,
      yearStatusCounts,
    ] = await Promise.all([
      db.academic_years.count({ where: yearWhere }),
      db.grades.count({ where: gradeWhere }),
      db.sections.count(),
      db.academic_year_grades.count(),
      db.academic_years.groupBy({
        by: ['status'],
        where: yearWhere,
        _count: { status: true },
      }),
    ]);

    const academicYearsByStatus: Record<string, number> = {};
    for (const item of yearStatusCounts) {
      if (item.status) {
        academicYearsByStatus[item.status] = item._count.status;
      }
    }

    return {
      total_academic_years: totalYears,
      total_grades: totalGrades,
      total_sections: totalSections,
      total_academic_year_grades: totalYearGrades,
      academic_years_by_status: academicYearsByStatus,
    };
  }
}
