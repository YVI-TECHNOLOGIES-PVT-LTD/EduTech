import prisma from '../../../lib/prismaClient';

export interface SuperAdminAcademicOverviewDto {
  academic_years_count: number;
  active_academic_year: {
    academic_year_id: string;
    academic_year_name: string;
    start_date: Date;
    end_date: Date;
    status: string;
  } | null;
  grades_count: number;
  sections_count: number;
  faculty_assignments_count: number;
  curriculum_plans_count: number;
  lesson_plans_count: number;
  timetable_entries_count: number;
  learning_resources_count: number;
  published_timetable_versions_count: number;
}

export class SuperAdminRepository {
  /**
   * Aggregate high-level academic statistics across the organization
   */
  static async getAcademicOverview(orgId: string): Promise<SuperAdminAcademicOverviewDto> {
    const [
      academicYearsCount,
      activeAcademicYear,
      gradesCount,
      sectionsCount,
      facultyAssignmentsCount,
      curriculumPlansCount,
      lessonPlansCount,
      timetableEntriesCount,
      learningResourcesCount,
      publishedTimetablesCount,
    ] = await Promise.all([
      prisma.academic_years.count({ where: { org_id: orgId } }),
      prisma.academic_years.findFirst({
        where: {
          org_id: orgId,
          status: { in: ['teaching', 'open', 'admissions_open'] },
        },
        select: {
          academic_year_id: true,
          academic_year_name: true,
          start_date: true,
          end_date: true,
          status: true,
        },
      }),
      prisma.grades.count({ where: { org_id: orgId } }),
      prisma.sections.count({
        where: {
          academic_year_grades: {
            academic_years: { org_id: orgId },
          },
        },
      }),
      prisma.section_subject_faculty_assignments.count({
        where: {
          sections: {
            academic_year_grades: {
              academic_years: { org_id: orgId },
            },
          },
        },
      }),
      prisma.curriculum_plans.count({ where: { org_id: orgId } }),
      prisma.lesson_plans.count({
        where: {
          curriculum_plan_units: {
            curriculum_plans: { org_id: orgId },
          },
        },
      }),
      prisma.timetable_entries.count({
        where: {
          sections: {
            academic_year_grades: {
              academic_years: { org_id: orgId },
            },
          },
        },
      }),
      prisma.learning_resources.count({ where: { org_id: orgId } }),
      prisma.timetable_versions.count({
        where: {
          status: 'published',
          academic_years: { org_id: orgId },
        },
      }),
    ]);

    return {
      academic_years_count: academicYearsCount,
      active_academic_year: activeAcademicYear,
      grades_count: gradesCount,
      sections_count: sectionsCount,
      faculty_assignments_count: facultyAssignmentsCount,
      curriculum_plans_count: curriculumPlansCount,
      lesson_plans_count: lessonPlansCount,
      timetable_entries_count: timetableEntriesCount,
      learning_resources_count: learningResourcesCount,
      published_timetable_versions_count: publishedTimetablesCount,
    };
  }
}
