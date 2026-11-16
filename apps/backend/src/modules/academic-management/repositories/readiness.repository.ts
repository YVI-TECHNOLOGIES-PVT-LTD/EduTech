import prisma from '../../../lib/prismaClient';

export interface RawAcademicYearConfig {
  academic_year_id: string;
  org_id: string;
  org_name: string;
  board_affiliation: string | null;
  academic_year_name: string;
  start_date: string;
  end_date: string;
  status: string;
  is_current: boolean;
}

export interface RawGradeOfferingConfig {
  academic_year_grade_id: string;
  grade_id: string;
  grade_name: string;
  grade_code: string;
  grade_board: string | null;
  is_active: boolean;
  sections_count: number;
  sections_with_class_teacher: number;
  subjects_count: number;
}

export interface RawSectionConfig {
  section_id: string;
  academic_year_grade_id: string;
  grade_name: string;
  section_name: string;
  capacity: number | null;
  class_teacher_id: string | null;
  class_teacher_name: string | null;
  is_active: boolean;
}

export interface RawSubjectMappingConfig {
  academic_year_grade_subject_id: string;
  academic_year_grade_id: string;
  grade_name: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  has_curriculum_plan: boolean;
  curriculum_plan_id: string | null;
  curriculum_plan_status: string | null;
  units_count: number;
  outcomes_count: number;
  faculty_assigned_count: number;
}

export interface RawCalendarConfig {
  calendar_id: string | null;
  status: string | null;
  version: number | null;
  published_at: string | null;
  terms_count: number;
  terms: Array<{
    term_id: string;
    term_name: string;
    start_date: string;
    end_date: string;
    sequence_number: number;
  }>;
  working_days: number[];
  entries_count: number;
}

export interface RawTimetableConfig {
  published_version_id: string | null;
  published_version_number: number | null;
  total_versions_count: number;
  published_entries_count: number;
  sections_scheduled_count: number;
  total_sections_count: number;
}

export interface RawFacultyConfig {
  total_active_staff: number;
  total_assignments: number;
  primary_assignments_count: number;
  co_teacher_assignments_count: number;
  unassigned_grade_subjects: number;
  qualification_records_count: number;
}

export interface RawClassroomConfig {
  total_classrooms: number;
  active_classrooms: number;
  classrooms_with_capacity: number;
}

export interface RawResourceConfig {
  total_published_resources: number;
  resources_with_grade_mapping: number;
  resources_with_subject_mapping: number;
}

export interface RawLessonPlanConfig {
  total_lesson_plans: number;
  active_lesson_plans: number;
  units_with_lessons_count: number;
  total_activities_count: number;
  total_exit_tickets_count: number;
}

export interface FullAcademicReadinessData {
  yearConfig: RawAcademicYearConfig;
  gradeOfferings: RawGradeOfferingConfig[];
  sections: RawSectionConfig[];
  subjectMappings: RawSubjectMappingConfig[];
  calendarConfig: RawCalendarConfig;
  timetableConfig: RawTimetableConfig;
  facultyConfig: RawFacultyConfig;
  classroomConfig: RawClassroomConfig;
  resourceConfig: RawResourceConfig;
  lessonPlanConfig: RawLessonPlanConfig;
  allOrgGradesCount: number;
  allOrgSubjectsCount: number;
}

export class ReadinessRepository {
  /**
   * Fetch complete multi-module academic configuration in cohesive, parameterized queries
   */
  static async getAcademicConfiguration(
    orgId: string,
    academicYearId: string,
  ): Promise<FullAcademicReadinessData | null> {
    // 1. Fetch Academic Year & Organization Metadata
    const yearRows = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT
        ay.academic_year_id,
        ay.org_id,
        o.org_name,
        o.board_affiliation,
        ay.academic_year_name,
        ay.start_date::text as start_date,
        ay.end_date::text as end_date,
        ay.status::text as status,
        (ay.status IN ('teaching', 'open')) as is_current
      FROM academic_years ay
      JOIN organizations o ON o.org_id = ay.org_id
      WHERE ay.academic_year_id = $1::uuid AND ay.org_id = $2::uuid
      LIMIT 1
      `,
      academicYearId,
      orgId,
    );

    if (!yearRows || yearRows.length === 0) {
      return null;
    }
    const yearConfig = yearRows[0] as RawAcademicYearConfig;

    // 2. Fetch Grade Offerings for this Academic Year
    const gradeOfferings = await prisma.$queryRawUnsafe<RawGradeOfferingConfig[]>(
      `
      SELECT
        ayg.academic_year_grade_id,
        g.grade_id,
        g.grade_name,
        g.grade_code,
        g.board as grade_board,
        ayg.is_active,
        (SELECT COUNT(*)::int FROM sections s WHERE s.academic_year_grade_id = ayg.academic_year_grade_id) as sections_count,
        (SELECT COUNT(*)::int FROM sections s WHERE s.academic_year_grade_id = ayg.academic_year_grade_id AND s.class_teacher_id IS NOT NULL) as sections_with_class_teacher,
        (SELECT COUNT(*)::int FROM academic_year_grade_subjects aygs WHERE aygs.academic_year_grade_id = ayg.academic_year_grade_id) as subjects_count
      FROM academic_year_grades ayg
      JOIN grades g ON g.grade_id = ayg.grade_id
      WHERE ayg.academic_year_id = $1::uuid AND g.org_id = $2::uuid
      ORDER BY g.display_order ASC, g.grade_name ASC
      `,
      academicYearId,
      orgId,
    );

    // 3. Fetch Sections
    const sections = await prisma.$queryRawUnsafe<RawSectionConfig[]>(
      `
      SELECT
        s.section_id,
        s.academic_year_grade_id,
        g.grade_name,
        s.section_name,
        s.capacity,
        s.class_teacher_id,
        TRIM(CONCAT(u.first_name, ' ', u.last_name)) as class_teacher_name,
        s.is_active
      FROM sections s
      JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = s.academic_year_grade_id
      JOIN grades g ON g.grade_id = ayg.grade_id
      LEFT JOIN staff st ON st.staff_id = s.class_teacher_id
      LEFT JOIN users u ON u.user_id = st.user_id
      WHERE ayg.academic_year_id = $1::uuid AND g.org_id = $2::uuid
      ORDER BY g.display_order ASC, s.section_name ASC
      `,
      academicYearId,
      orgId,
    );

    // 4. Fetch Subject Mappings & Curriculum Plans
    const subjectMappings = await prisma.$queryRawUnsafe<RawSubjectMappingConfig[]>(
      `
      SELECT
        aygs.academic_year_grade_subject_id,
        aygs.academic_year_grade_id,
        g.grade_name,
        sub.subject_id,
        sub.subject_name,
        sub.subject_code,
        (cp.curriculum_plan_id IS NOT NULL) as has_curriculum_plan,
        cp.curriculum_plan_id,
        cp.status::text as curriculum_plan_status,
        COALESCE((SELECT COUNT(*)::int FROM curriculum_plan_units cpu WHERE cpu.curriculum_plan_id = cp.curriculum_plan_id), 0) as units_count,
        COALESCE((
          SELECT COUNT(*)::int
          FROM curriculum_learning_outcomes clo
          JOIN curriculum_plan_units cpu ON cpu.curriculum_unit_id = clo.curriculum_unit_id
          WHERE cpu.curriculum_plan_id = cp.curriculum_plan_id
        ), 0) as outcomes_count,
        COALESCE((
          SELECT COUNT(*)::int
          FROM section_subject_faculty_assignments ssfa
          WHERE ssfa.academic_year_grade_subject_id = aygs.academic_year_grade_subject_id AND ssfa.is_active = true
        ), 0) as faculty_assigned_count
      FROM academic_year_grade_subjects aygs
      JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = aygs.academic_year_grade_id
      JOIN grades g ON g.grade_id = ayg.grade_id
      JOIN subjects sub ON sub.subject_id = aygs.subject_id
      LEFT JOIN curriculum_plans cp ON cp.academic_year_grade_subject_id = aygs.academic_year_grade_subject_id
      WHERE ayg.academic_year_id = $1::uuid AND g.org_id = $2::uuid
      ORDER BY g.display_order ASC, sub.subject_name ASC
      `,
      academicYearId,
      orgId,
    );

    // 5. Fetch Academic Calendar & Terms
    const calRows = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT
        ac.academic_calendar_id as calendar_id,
        ac.status::text as status,
        ac.version,
        ac.published_at::text as published_at,
        (SELECT COUNT(*)::int FROM academic_terms at WHERE at.academic_calendar_id = ac.academic_calendar_id) as terms_count,
        COALESCE(
          (SELECT array_agg(weekday ORDER BY weekday) FROM academic_calendar_working_days cwd WHERE cwd.academic_calendar_id = ac.academic_calendar_id),
          ARRAY[]::smallint[]
        ) as working_days,
        (SELECT COUNT(*)::int FROM academic_calendar_entries ace WHERE ace.academic_calendar_id = ac.academic_calendar_id) as entries_count
      FROM academic_calendars ac
      WHERE ac.academic_year_id = $1::uuid
      ORDER BY ac.version DESC
      LIMIT 1
      `,
      academicYearId,
    );

    let calendarConfig: RawCalendarConfig = {
      calendar_id: null,
      status: null,
      version: null,
      published_at: null,
      terms_count: 0,
      terms: [],
      working_days: [],
      entries_count: 0,
    };

    if (calRows && calRows.length > 0) {
      const c = calRows[0];
      let terms: any[] = [];
      if (c.calendar_id) {
        terms = await prisma.$queryRawUnsafe<any[]>(
          `
          SELECT
            at.academic_term_id as term_id,
            at.term_name,
            at.start_date::text as start_date,
            at.end_date::text as end_date,
            at.term_number as sequence_number
          FROM academic_terms at
          WHERE at.academic_calendar_id = $1::uuid
          ORDER BY at.term_number ASC
          `,
          c.calendar_id,
        );
      }
      calendarConfig = {
        calendar_id: c.calendar_id,
        status: c.status,
        version: c.version,
        published_at: c.published_at,
        terms_count: c.terms_count,
        terms,
        working_days: c.working_days || [],
        entries_count: c.entries_count,
      };
    }

    // 6. Fetch Timetable Configuration
    const ttRows = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT
        (SELECT tv.timetable_version_id FROM timetable_versions tv WHERE tv.academic_year_id = $1::uuid AND tv.status = 'published' LIMIT 1) as published_version_id,
        (SELECT tv.version_number FROM timetable_versions tv WHERE tv.academic_year_id = $1::uuid AND tv.status = 'published' LIMIT 1) as published_version_number,
        (SELECT COUNT(*)::int FROM timetable_versions tv WHERE tv.academic_year_id = $1::uuid) as total_versions_count,
        (
          SELECT COUNT(*)::int
          FROM timetable_entries te
          JOIN timetable_versions tv ON tv.timetable_version_id = te.timetable_version_id
          WHERE tv.academic_year_id = $1::uuid AND tv.status = 'published'
        ) as published_entries_count,
        (
          SELECT COUNT(DISTINCT te.section_id)::int
          FROM timetable_entries te
          JOIN timetable_versions tv ON tv.timetable_version_id = te.timetable_version_id
          WHERE tv.academic_year_id = $1::uuid AND tv.status = 'published'
        ) as sections_scheduled_count
      `,
      academicYearId,
    );

    const ttData = ttRows[0] || {};
    const timetableConfig: RawTimetableConfig = {
      published_version_id: ttData.published_version_id || null,
      published_version_number: ttData.published_version_number || null,
      total_versions_count: ttData.total_versions_count || 0,
      published_entries_count: ttData.published_entries_count || 0,
      sections_scheduled_count: ttData.sections_scheduled_count || 0,
      total_sections_count: sections.length,
    };

    // 7. Fetch Faculty & Qualification Configuration
    const facRows = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT
        (SELECT COUNT(*)::int FROM staff s WHERE s.org_id = $1::uuid AND s.is_active = true) as total_active_staff,
        (
          SELECT COUNT(*)::int
          FROM section_subject_faculty_assignments ssfa
          JOIN sections s ON s.section_id = ssfa.section_id
          JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = s.academic_year_grade_id
          WHERE ayg.academic_year_id = $2::uuid AND ssfa.is_active = true
        ) as total_assignments,
        (
          SELECT COUNT(*)::int
          FROM section_subject_faculty_assignments ssfa
          JOIN sections s ON s.section_id = ssfa.section_id
          JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = s.academic_year_grade_id
          WHERE ayg.academic_year_id = $2::uuid AND ssfa.is_active = true AND ssfa.assignment_role = 'primary'
        ) as primary_assignments_count,
        (
          SELECT COUNT(*)::int
          FROM section_subject_faculty_assignments ssfa
          JOIN sections s ON s.section_id = ssfa.section_id
          JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = s.academic_year_grade_id
          WHERE ayg.academic_year_id = $2::uuid AND ssfa.is_active = true AND ssfa.assignment_role = 'co_teacher'
        ) as co_teacher_assignments_count,
        (
          SELECT COUNT(*)::int
          FROM staff_subject_qualifications ssq
          JOIN staff s ON s.staff_id = ssq.staff_id
          WHERE s.org_id = $1::uuid
        ) as qualification_records_count
      `,
      orgId,
      academicYearId,
    );

    const facData = facRows[0] || {};
    const unassignedCount = subjectMappings.filter((sm) => sm.faculty_assigned_count === 0).length;
    const facultyConfig: RawFacultyConfig = {
      total_active_staff: facData.total_active_staff || 0,
      total_assignments: facData.total_assignments || 0,
      primary_assignments_count: facData.primary_assignments_count || 0,
      co_teacher_assignments_count: facData.co_teacher_assignments_count || 0,
      unassigned_grade_subjects: unassignedCount,
      qualification_records_count: facData.qualification_records_count || 0,
    };

    // 8. Fetch Classrooms Configuration
    const crRows = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT
        COUNT(*)::int as total_classrooms,
        COUNT(CASE WHEN is_active = true THEN 1 END)::int as active_classrooms,
        COUNT(CASE WHEN capacity IS NOT NULL AND capacity > 0 THEN 1 END)::int as classrooms_with_capacity
      FROM classrooms
      WHERE org_id = $1::uuid
      `,
      orgId,
    );
    const crData = crRows[0] || {};
    const classroomConfig: RawClassroomConfig = {
      total_classrooms: crData.total_classrooms || 0,
      active_classrooms: crData.active_classrooms || 0,
      classrooms_with_capacity: crData.classrooms_with_capacity || 0,
    };

    // 9. Fetch Learning Resources Configuration
    const resRows = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT
        COUNT(*)::int as total_published_resources,
        (SELECT COUNT(DISTINCT lr.resource_id)::int FROM learning_resource_grades lrg JOIN learning_resources lr ON lr.resource_id = lrg.resource_id WHERE lr.org_id = $1::uuid AND lr.resource_status = 'published') as resources_with_grade_mapping,
        (SELECT COUNT(DISTINCT lr.resource_id)::int FROM learning_resource_subjects lrs JOIN learning_resources lr ON lr.resource_id = lrs.resource_id WHERE lr.org_id = $1::uuid AND lr.resource_status = 'published') as resources_with_subject_mapping
      FROM learning_resources
      WHERE org_id = $1::uuid AND resource_status = 'published'
      `,
      orgId,
    );
    const resData = resRows[0] || {};
    const resourceConfig: RawResourceConfig = {
      total_published_resources: resData.total_published_resources || 0,
      resources_with_grade_mapping: resData.resources_with_grade_mapping || 0,
      resources_with_subject_mapping: resData.resources_with_subject_mapping || 0,
    };

    // 10. Fetch Lesson Plans Configuration
    const lpRows = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT
        COUNT(lp.lesson_plan_id)::int as total_lesson_plans,
        COUNT(CASE WHEN lp.is_active = true THEN 1 END)::int as active_lesson_plans,
        COUNT(DISTINCT lp.curriculum_unit_id)::int as units_with_lessons_count,
        (
          SELECT COUNT(*)::int
          FROM lesson_activities la
          JOIN lesson_plans lp2 ON lp2.lesson_plan_id = la.lesson_plan_id
          JOIN curriculum_plan_units cpu ON cpu.curriculum_unit_id = lp2.curriculum_unit_id
          JOIN curriculum_plans cp ON cp.curriculum_plan_id = cpu.curriculum_plan_id
          JOIN academic_year_grade_subjects aygs ON aygs.academic_year_grade_subject_id = cp.academic_year_grade_subject_id
          JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = aygs.academic_year_grade_id
          WHERE ayg.academic_year_id = $1::uuid
        ) as total_activities_count,
        (
          SELECT COUNT(*)::int
          FROM lesson_exit_tickets let
          JOIN lesson_plans lp3 ON lp3.lesson_plan_id = let.lesson_plan_id
          JOIN curriculum_plan_units cpu ON cpu.curriculum_unit_id = lp3.curriculum_unit_id
          JOIN curriculum_plans cp ON cp.curriculum_plan_id = cpu.curriculum_plan_id
          JOIN academic_year_grade_subjects aygs ON aygs.academic_year_grade_subject_id = cp.academic_year_grade_subject_id
          JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = aygs.academic_year_grade_id
          WHERE ayg.academic_year_id = $1::uuid
        ) as total_exit_tickets_count
      FROM lesson_plans lp
      JOIN curriculum_plan_units cpu ON cpu.curriculum_unit_id = lp.curriculum_unit_id
      JOIN curriculum_plans cp ON cp.curriculum_plan_id = cpu.curriculum_plan_id
      JOIN academic_year_grade_subjects aygs ON aygs.academic_year_grade_subject_id = cp.academic_year_grade_subject_id
      JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = aygs.academic_year_grade_id
      WHERE ayg.academic_year_id = $1::uuid
      `,
      academicYearId,
    );
    const lpData = lpRows[0] || {};
    const lessonPlanConfig: RawLessonPlanConfig = {
      total_lesson_plans: lpData.total_lesson_plans || 0,
      active_lesson_plans: lpData.active_lesson_plans || 0,
      units_with_lessons_count: lpData.units_with_lessons_count || 0,
      total_activities_count: lpData.total_activities_count || 0,
      total_exit_tickets_count: lpData.total_exit_tickets_count || 0,
    };

    // 11. Global Org Grade and Subject Totals
    const [allGradesRes, allSubjectsRes] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(
        `SELECT COUNT(*)::int as c FROM grades WHERE org_id = $1::uuid AND is_active = true`,
        orgId,
      ),
      prisma.$queryRawUnsafe<any[]>(
        `SELECT COUNT(*)::int as c FROM subjects WHERE org_id = $1::uuid AND is_active = true`,
        orgId,
      ),
    ]);

    return {
      yearConfig,
      gradeOfferings,
      sections,
      subjectMappings,
      calendarConfig,
      timetableConfig,
      facultyConfig,
      classroomConfig,
      resourceConfig,
      lessonPlanConfig,
      allOrgGradesCount: allGradesRes[0]?.c || 0,
      allOrgSubjectsCount: allSubjectsRes[0]?.c || 0,
    };
  }

  /**
   * Get tenant-wide readiness overview covering all academic years
   */
  static async getTenantReadinessOverview(orgId: string): Promise<any> {
    const years = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT
        ay.academic_year_id,
        ay.academic_year_name,
        ay.start_date::text as start_date,
        ay.end_date::text as end_date,
        ay.status::text as status,
        (SELECT COUNT(*)::int FROM academic_year_grades ayg WHERE ayg.academic_year_id = ay.academic_year_id) as grade_offerings_count,
        (
          SELECT COUNT(*)::int
          FROM sections s
          JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = s.academic_year_grade_id
          WHERE ayg.academic_year_id = ay.academic_year_id
        ) as sections_count,
        (
          SELECT COUNT(*)::int
          FROM timetable_versions tv
          WHERE tv.academic_year_id = ay.academic_year_id AND tv.status = 'published'
        ) as has_published_timetable,
        (
          SELECT COUNT(*)::int
          FROM academic_calendars ac
          WHERE ac.academic_year_id = ay.academic_year_id AND ac.status = 'published'
        ) as has_published_calendar
      FROM academic_years ay
      WHERE ay.org_id = $1::uuid
      ORDER BY ay.start_date DESC
      `,
      orgId,
    );

    return years;
  }
}
