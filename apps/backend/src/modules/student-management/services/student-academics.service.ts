import { StudentRepository } from '../repositories/student.repository';
import { StudentNotFoundError } from '../errors/student.errors';
import {
  buildDayScheduleSlots,
  ParentPortalService,
} from '../../parent-management/services/parent-portal.service';
import { ParentPortalRepository } from '../../parent-management/repositories/parent-portal.repository';
import { ParentForbiddenError } from '../../parent-management/errors/parent.errors';

export class StudentAcademicsService {
  private static async assertAccess(studentId: string, user: any, orgId?: string) {
    const effectiveOrgId = user?.org_id || user?.school_id || orgId;
    const rawRoles: string[] = Array.isArray(user?.roles) ? user.roles : [];
    const roles = rawRoles.map((r) =>
      String(r)
        .toUpperCase()
        .replace(/[\s-]+/g, '_'),
    );

    const isStaff = roles.some((r) =>
      [
        'ADMIN',
        'SUPERADMIN',
        'SUPER_ADMIN',
        'ORG_ADMIN',
        'HOI',
        'PRINCIPAL',
        'ADMISSION_OFFICER',
        'STAFF',
        'FRONT_OFFICE',
        'TEACHER',
        'FACULTY',
      ].includes(r),
    );
    const isParent = roles.some((r) => ['PARENT', 'GUARDIAN', 'ENROLLED_PARENT'].includes(r));
    const isStudent = roles.includes('STUDENT');

    if (isParent && !isStaff && user?.id && effectiveOrgId) {
      await ParentPortalService.assertAndResolveChild(
        effectiveOrgId,
        user.id,
        user.email,
        studentId,
      );
    }

    const student = await StudentRepository.findById(studentId);
    if (!student || (effectiveOrgId && student.org_id !== effectiveOrgId)) {
      throw new StudentNotFoundError(studentId);
    }

    if (isStudent && !isStaff && !isParent) {
      if (!user?.id || student.user_id !== user.id) {
        throw new ParentForbiddenError(
          'Forbidden: Students can only access their own academic records.',
        );
      }
    }

    return student;
  }

  private static resolveActiveEnrollment(student: any) {
    const enrollments: any[] = Array.isArray(student?.student_enrollments)
      ? [...student.student_enrollments]
      : [];
    if (enrollments.length === 0) return null;
    enrollments.sort((a, b) => {
      const aActive = a.status === 'active' ? 0 : 1;
      const bActive = b.status === 'active' ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      return (
        new Date(b.enrollment_date || b.created_at || 0).getTime() -
        new Date(a.enrollment_date || a.created_at || 0).getTime()
      );
    });
    return enrollments[0];
  }

  static async getExams(studentId: string, user: any, orgId?: string) {
    await this.assertAccess(studentId, user, orgId);
    return [];
  }

  static async getAttendanceSummary(studentId: string, user: any, orgId?: string, _month?: string) {
    await this.assertAccess(studentId, user, orgId);
    return {
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      percentage: 0,
      records: [],
    };
  }

  static async getAttendanceTimeline(studentId: string, user: any, orgId?: string) {
    await this.assertAccess(studentId, user, orgId);
    return [];
  }

  static async getTodayTimetable(studentId: string, user: any, orgId?: string) {
    const student = await this.assertAccess(studentId, user, orgId);
    const enrollment = this.resolveActiveEnrollment(student);
    const effectiveOrgId = student.org_id || orgId;

    const now = new Date();
    const jsDay = now.getDay();
    const weekday = jsDay === 0 ? 7 : jsDay;
    const currentTimeHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (
      !enrollment ||
      !enrollment.section_id ||
      !enrollment.academic_year_grades?.academic_year_id
    ) {
      return {
        student_id: student.student_id,
        has_published_timetable: false,
        weekday,
        slots: [],
      };
    }

    const timetable = await ParentPortalRepository.findChildTimetable(
      effectiveOrgId,
      enrollment.academic_year_grades.academic_year_id,
      enrollment.academic_year_grade_id,
      enrollment.section_id,
    );

    const dayEntries = timetable.entries.filter((e) => Number(e.weekday) === weekday);
    const slots = timetable.publishedVersion
      ? buildDayScheduleSlots(
          weekday,
          timetable.bellPeriods,
          dayEntries,
          timetable.coTeachersBySlotKey,
          { currentWeekday: weekday, currentTimeHHMM },
        )
      : [];

    return {
      student_id: student.student_id,
      has_published_timetable: Boolean(timetable.publishedVersion),
      section_id: enrollment.section_id,
      section_name: enrollment.sections?.section_name || null,
      weekday,
      current_class: slots.find((s) => !s.is_break && s.status === 'ongoing') || null,
      next_class:
        slots.find((s) => !s.is_break && s.timetable_entry_id && s.status === 'upcoming') || null,
      slots,
    };
  }

  static async getWeekTimetable(studentId: string, user: any, orgId?: string) {
    const student = await this.assertAccess(studentId, user, orgId);
    const enrollment = this.resolveActiveEnrollment(student);
    const effectiveOrgId = student.org_id || orgId;

    const now = new Date();
    const jsDay = now.getDay();
    const currentWeekday = jsDay === 0 ? 7 : jsDay;
    const currentTimeHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (
      !enrollment ||
      !enrollment.section_id ||
      !enrollment.academic_year_grades?.academic_year_id
    ) {
      return {
        student_id: student.student_id,
        has_published_timetable: false,
        working_weekdays: [],
        periods: [],
        days: [],
      };
    }

    const timetable = await ParentPortalRepository.findChildTimetable(
      effectiveOrgId,
      enrollment.academic_year_grades.academic_year_id,
      enrollment.academic_year_grade_id,
      enrollment.section_id,
    );

    const weekdays =
      timetable.workingWeekdays.length > 0 ? timetable.workingWeekdays : [1, 2, 3, 4, 5];

    const days = timetable.publishedVersion
      ? weekdays.map((weekday) => {
          const dayEntries = timetable.entries.filter((e) => Number(e.weekday) === weekday);
          return {
            weekday,
            slots: buildDayScheduleSlots(
              weekday,
              timetable.bellPeriods,
              dayEntries,
              timetable.coTeachersBySlotKey,
              { currentWeekday, currentTimeHHMM },
            ),
          };
        })
      : [];

    return {
      student_id: student.student_id,
      has_published_timetable: Boolean(timetable.publishedVersion),
      section_id: enrollment.section_id,
      section_name: enrollment.sections?.section_name || null,
      working_weekdays: weekdays,
      periods: timetable.bellPeriods,
      days,
    };
  }

  static async getHomework(studentId: string, user: any, orgId?: string) {
    await this.assertAccess(studentId, user, orgId);
    return [];
  }

  static async getResults(studentId: string, user: any, orgId?: string, _term?: string) {
    await this.assertAccess(studentId, user, orgId);
    return null;
  }

  static async getTransport(studentId: string, user: any, orgId?: string) {
    await this.assertAccess(studentId, user, orgId);
    return null;
  }

  static async getLibrary(studentId: string, user: any, orgId?: string) {
    const student = await this.assertAccess(studentId, user, orgId);
    return {
      studentId,
      cardNumber: student.admission_no || 'LIB-001',
      status: 'active',
      booksIssued: 0,
      maxAllowed: 3,
      activeBooks: [],
    };
  }

  static async getLibraryHistory(studentId: string, user: any, orgId?: string) {
    await this.assertAccess(studentId, user, orgId);
    return [];
  }
}
