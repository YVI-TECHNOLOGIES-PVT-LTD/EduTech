import { TeacherContextRepository } from '../repositories/teacher-context.repository';
import { LessonPlanningRepository } from '../repositories/lesson-planning.repository';
import { AcademicError } from '../errors/academic.errors';

export class TeacherContextService {
  /**
   * Resolves the staff record for the requesting user, with administrative override support.
   * If caller has ADMIN or SUPERADMIN role and passes requestedStaffId, uses requestedStaffId.
   * Otherwise strictly resolves caller's own user_id.
   */
  static async resolveTeacherStaff(
    orgId: string,
    userId: string,
    requestedStaffId?: string,
    roles: string[] = [],
  ) {
    const isAdministrative = roles.some((r) =>
      ['ADMIN', 'ORG_ADMIN', 'SUPERADMIN', 'SUPER_ADMIN', 'HOI', 'PRINCIPAL'].includes(r),
    );

    let staff = null;
    if (isAdministrative && requestedStaffId) {
      staff = await TeacherContextRepository.findStaffById(orgId, requestedStaffId);
      if (!staff) {
        throw new AcademicError(
          `Staff record with ID '${requestedStaffId}' not found in this institution.`,
          404,
          'STAFF_NOT_FOUND',
        );
      }
    } else {
      staff = await TeacherContextRepository.findStaffByUserId(orgId, userId);
      if (!staff) {
        throw new AcademicError(
          `No active staff record found associated with your user account in this institution.`,
          404,
          'STAFF_NOT_FOUND',
        );
      }
    }

    return staff;
  }

  /**
   * Teacher Dashboard Aggregation
   */
  static async getTeacherDashboard(orgId: string, staffId: string, academicYearId?: string) {
    // Current day of the week (1 = Monday, 7 = Sunday)
    const now = new Date();
    const jsDay = now.getDay();
    const weekday = jsDay === 0 ? 7 : jsDay;

    const [sections, subjects, todaySchedule, workload, lessonPlans] = await Promise.all([
      TeacherContextRepository.getAssignedSections(orgId, staffId, academicYearId),
      TeacherContextRepository.getAssignedSubjects(orgId, staffId, academicYearId),
      TeacherContextRepository.getTeacherSchedule(orgId, staffId, weekday, academicYearId),
      TeacherContextRepository.getTeacherWorkload(orgId, staffId, academicYearId),
      TeacherContextRepository.getTeacherLessonPlans(orgId, staffId, academicYearId),
    ]);

    return {
      teacher_staff_id: staffId,
      current_weekday: weekday,
      assigned_sections_count: sections.length,
      assigned_subjects_count: subjects.length,
      total_weekly_periods: workload.total_weekly_periods,
      today_periods_count: todaySchedule.length,
      authored_lesson_plans_count: lessonPlans.length,
      today_schedule: todaySchedule.map((entry) => ({
        entry_id: entry.timetable_entry_id,
        weekday: entry.weekday,
        period_name: entry.bell_schedule_periods?.period_name || '',
        start_time: entry.bell_schedule_periods?.start_time
          ? String(entry.bell_schedule_periods.start_time)
          : '',
        end_time: entry.bell_schedule_periods?.end_time
          ? String(entry.bell_schedule_periods.end_time)
          : '',
        section_name: entry.sections?.section_name || '',
        grade_name: entry.sections?.academic_year_grades?.grades?.grade_name || '',
        subject_name: entry.academic_year_grade_subjects?.subjects?.subject_name || '',
        subject_code: entry.academic_year_grade_subjects?.subjects?.subject_code || '',
        classroom: entry.classrooms?.room_name || entry.classrooms?.room_code || null,
        lesson_type: entry.lesson_type,
        topic: entry.lesson_topic,
      })),
      sections_summary: sections.slice(0, 5),
      workload_summary: workload,
    };
  }

  /**
   * Get Assigned Sections
   */
  static async getTeacherClasses(orgId: string, staffId: string, academicYearId?: string) {
    return TeacherContextRepository.getAssignedSections(orgId, staffId, academicYearId);
  }

  /**
   * Get Assigned Subjects
   */
  static async getTeacherSubjects(orgId: string, staffId: string, academicYearId?: string) {
    return TeacherContextRepository.getAssignedSubjects(orgId, staffId, academicYearId);
  }

  /**
   * Get Teacher Timetable / Schedule
   */
  static async getTeacherSchedule(
    orgId: string,
    staffId: string,
    weekday?: number,
    academicYearId?: string,
  ) {
    return TeacherContextRepository.getTeacherSchedule(orgId, staffId, weekday, academicYearId);
  }

  /**
   * Get Teacher Curriculum Plans
   */
  static async getTeacherCurriculum(orgId: string, staffId: string, academicYearId?: string) {
    return TeacherContextRepository.getAssignedCurriculum(orgId, staffId, academicYearId);
  }

  /**
   * Get Teacher Lesson Plans
   */
  static async getTeacherLessonPlans(orgId: string, staffId: string, academicYearId?: string) {
    return TeacherContextRepository.getTeacherLessonPlans(orgId, staffId, academicYearId);
  }

  /**
   * Get Teacher Workload
   */
  static async getTeacherWorkload(orgId: string, staffId: string, academicYearId?: string) {
    return TeacherContextRepository.getTeacherWorkload(orgId, staffId, academicYearId);
  }

  /**
   * Enforces strict lesson plan ownership boundary.
   * If caller is ADMIN or SUPERADMIN, access is permitted institution-wide.
   * If caller is TEACHER, access is restricted strictly to plans authored by that teacher.
   */
  static async verifyLessonPlanOwnership(
    orgId: string,
    userId: string,
    lessonPlanId: string,
    roles: string[] = [],
  ) {
    const isAdministrative = roles.some((r) =>
      ['ADMIN', 'ORG_ADMIN', 'SUPERADMIN', 'SUPER_ADMIN', 'HOI', 'PRINCIPAL'].includes(r),
    );

    const plan = await LessonPlanningRepository.findSavedPlanById(orgId, lessonPlanId);
    if (!plan) {
      throw new AcademicError(
        `Saved lesson plan '${lessonPlanId}' was not found.`,
        404,
        'NOT_FOUND',
      );
    }

    if (isAdministrative) {
      return plan;
    }

    // Must be caller's own plan
    const staff = await TeacherContextRepository.findStaffByUserId(orgId, userId);
    if (!staff || plan.teacher_staff_id !== staff.staff_id) {
      throw new AcademicError(
        'Forbidden: Teachers may only access their own lesson plans.',
        403,
        'FORBIDDEN_LESSON_PLAN_ACCESS',
      );
    }

    return plan;
  }
}
