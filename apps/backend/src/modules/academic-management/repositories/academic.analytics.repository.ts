import prisma from '../../../lib/prismaClient';
import { academic_year_status } from '../constants/academic.constants';

const db: any = prisma;

export interface AcademicOverviewMetrics {
  academic_years: {
    total: number;
    current: {
      academic_year_id: string;
      academic_year_name: string;
      start_date: string;
      end_date: string;
      status: string;
    } | null;
  };
  grades: {
    total: number;
  };
  grade_offerings: {
    total: number;
  };
  sections: {
    total: number;
  };
  teacher_assignments: {
    assigned: number;
    unassigned: number;
  };
  readiness: {
    academic_year_configured: boolean;
    grades_configured: boolean;
    grade_offerings_configured: boolean;
    sections_configured: boolean;
    class_teachers_assigned: boolean;
  };
}

export class AcademicAnalyticsRepository {
  static async getOverview(orgId: string): Promise<AcademicOverviewMetrics> {
    const yearWhere = { org_id: orgId };
    const gradeWhere = { org_id: orgId };
    const offeringWhere = { academic_years: { org_id: orgId } };
    const sectionWhere = { academic_year_grades: { academic_years: { org_id: orgId } } };

    const [
      totalYears,
      currentYear,
      totalGrades,
      totalOfferings,
      totalSections,
      assignedTeachers,
      unassignedTeachers,
    ] = await Promise.all([
      db.academic_years.count({ where: yearWhere }),
      db.academic_years.findFirst({
        where: {
          org_id: orgId,
          status: {
            in: [academic_year_status.teaching, academic_year_status.open],
          },
        },
        orderBy: { start_date: 'desc' },
      }),
      db.grades.count({ where: gradeWhere }),
      db.academic_year_grades.count({ where: offeringWhere }),
      db.sections.count({ where: sectionWhere }),
      db.sections.count({
        where: {
          ...sectionWhere,
          class_teacher_id: { not: null },
        },
      }),
      db.sections.count({
        where: {
          ...sectionWhere,
          class_teacher_id: null,
        },
      }),
    ]);

    return {
      academic_years: {
        total: totalYears,
        current: currentYear
          ? {
              academic_year_id: currentYear.academic_year_id,
              academic_year_name: currentYear.academic_year_name,
              start_date: new Date(currentYear.start_date).toISOString(),
              end_date: new Date(currentYear.end_date).toISOString(),
              status: currentYear.status,
            }
          : null,
      },
      grades: {
        total: totalGrades,
      },
      grade_offerings: {
        total: totalOfferings,
      },
      sections: {
        total: totalSections,
      },
      teacher_assignments: {
        assigned: assignedTeachers,
        unassigned: unassignedTeachers,
      },
      readiness: {
        academic_year_configured: totalYears > 0,
        grades_configured: totalGrades > 0,
        grade_offerings_configured: totalOfferings > 0,
        sections_configured: totalSections > 0,
        class_teachers_assigned: totalSections > 0 && unassignedTeachers === 0,
      },
    };
  }

  static async getDashboardMetrics(orgId: string) {
    const yearWhere = { org_id: orgId };
    const gradeWhere = { org_id: orgId };
    const offeringWhere = { academic_years: { org_id: orgId } };
    const sectionWhere = { academic_year_grades: { academic_years: { org_id: orgId } } };

    const [totalYears, totalGrades, totalSections, totalYearGrades, yearStatusCounts] =
      await Promise.all([
        db.academic_years.count({ where: yearWhere }),
        db.grades.count({ where: gradeWhere }),
        db.sections.count({ where: sectionWhere }),
        db.academic_year_grades.count({ where: offeringWhere }),
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
