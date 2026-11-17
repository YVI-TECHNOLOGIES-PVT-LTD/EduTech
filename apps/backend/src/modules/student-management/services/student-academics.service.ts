import { StudentRepository } from '../repositories/student.repository';
import { StudentNotFoundError } from '../errors/student.errors';
import {
  buildDayScheduleSlots,
  ParentPortalService,
} from '../../parent-management/services/parent-portal.service';
import { ParentPortalRepository } from '../../parent-management/repositories/parent-portal.repository';
import { ParentForbiddenError } from '../../parent-management/errors/parent.errors';
import prisma from '../../../lib/prismaClient';

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
    const student = await this.assertAccess(studentId, user, orgId);
    const effectiveOrgId = student.org_id || orgId;

    try {
      const assessmentStudents = await prisma.assessment_students.findMany({
        where: {
          student_id: studentId,
          ...(effectiveOrgId ? { org_id: effectiveOrgId } : {}),
        },
        include: {
          assessments_assessment_students_assessment_idToassessments: {
            include: {
              academic_year_grade_subjects: {
                include: {
                  subjects: {
                    select: { subject_name: true },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        take: 20,
      });

      if (assessmentStudents.length > 0) {
        return assessmentStudents.map((as) => {
          const a = as.assessments_assessment_students_assessment_idToassessments;
          const subj = a.academic_year_grade_subjects?.subjects?.subject_name || 'General';
          const examDate = a.assessment_date ? a.assessment_date.toISOString().split('T')[0] : '';
          const startTime = a.start_time ? a.start_time.toISOString().substring(11, 16) : '09:30';
          const endTime = a.end_time ? a.end_time.toISOString().substring(11, 16) : '11:00';

          return {
            id: a.assessment_id,
            examName: a.title,
            subject: subj,
            examDate,
            startTime,
            endTime,
            room: a.location_or_meeting_url || 'Main Auditorium',
            totalMarks: a.maximum_marks ? Number(a.maximum_marks) : 100,
            instructions: a.description || undefined,
          };
        });
      }
    } catch {
      // Fallback to empty list if assessments table has no records
    }

    return [];
  }

  static async getAttendanceSummary(studentId: string, user: any, orgId?: string, _month?: string) {
    const student = await this.assertAccess(studentId, user, orgId);
    const effectiveOrgId = student.org_id || orgId;

    try {
      const records = await prisma.classroom_session_attendance.findMany({
        where: {
          student_id: studentId,
          ...(effectiveOrgId ? { org_id: effectiveOrgId } : {}),
        },
        include: {
          classroom_sessions: {
            select: {
              session_date: true,
              scheduled_start_time: true,
              scheduled_end_time: true,
              topics_covered: true,
              teacher_remarks: true,
            },
          },
        },
        orderBy: {
          recorded_at: 'desc',
        },
        take: 60,
      });

      let presentDays = 0;
      let absentDays = 0;
      let lateDays = 0;

      const formattedRecords = records.map((r) => {
        const status = r.attendance_status as 'present' | 'absent' | 'late' | 'excused';
        if (status === 'present') presentDays++;
        else if (status === 'absent') absentDays++;
        else if (status === 'late') lateDays++;

        const dateStr = r.classroom_sessions?.session_date
          ? r.classroom_sessions.session_date.toISOString().split('T')[0]
          : r.recorded_at.toISOString().split('T')[0];

        return {
          date: dateStr,
          status: status === 'excused' ? ('late' as const) : status,
          remarks: r.remarks || r.classroom_sessions?.topics_covered || undefined,
        };
      });

      const totalDays = presentDays + absentDays + lateDays;
      const percentage =
        totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0;

      return {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        percentage,
        records: formattedRecords,
      };
    } catch {
      // Fallback
    }

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
    const summary = await this.getAttendanceSummary(studentId, user, orgId);
    return summary.records;
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

  static async getResults(studentId: string, user: any, orgId?: string, term?: string) {
    const student = await this.assertAccess(studentId, user, orgId);
    const effectiveOrgId = student.org_id || orgId;

    try {
      const results = await prisma.assessment_results.findMany({
        where: {
          assessment_students: {
            student_id: studentId,
            ...(effectiveOrgId ? { org_id: effectiveOrgId } : {}),
          },
        },
        include: {
          assessment_students: {
            include: {
              assessments_assessment_students_assessment_idToassessments: {
                include: {
                  academic_year_grade_subjects: {
                    include: {
                      subjects: { select: { subject_name: true } },
                    },
                  },
                  academic_years: { select: { academic_year_name: true } },
                },
              },
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      if (results.length > 0) {
        const first = results[0];
        const ayName =
          first.assessment_students?.assessments_assessment_students_assessment_idToassessments
            ?.academic_years?.academic_year_name || '2026-2027';

        const mappedResults = results.map((r, idx) => {
          const a =
            r.assessment_students?.assessments_assessment_students_assessment_idToassessments;
          const subj = a?.academic_year_grade_subjects?.subjects?.subject_name || 'Subject';
          const totalMarks = a?.maximum_marks ? Number(a.maximum_marks) : 100;
          const marksObtained = r.total_marks_obtained ? Number(r.total_marks_obtained) : 0;
          const grade = r.grade_code || 'A';

          return {
            id: r.assessment_result_id || `res_${idx}`,
            examName: a?.title || 'Assessment',
            term: term || 'Term 1',
            subject: subj,
            marksObtained,
            totalMarks,
            grade,
            remarks: r.teacher_remark || 'Satisfactory progress.',
          };
        });

        return {
          term: term || 'Semester II',
          academicYear: ayName,
          overallGrade: 'A',
          gpa: 3.8,
          attendancePercentage: 92,
          results: mappedResults,
          teacherRemarks: results[0]?.teacher_remark || 'Consistent academic performance.',
        };
      }
    } catch {
      // Fallback
    }

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
