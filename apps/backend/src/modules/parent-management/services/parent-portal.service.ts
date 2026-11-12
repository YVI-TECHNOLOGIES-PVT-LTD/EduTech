import prisma from '../../../lib/prismaClient';
import {
  isValidUuid,
  ParentPortalRepository,
  RawBellPeriodRow,
  RawChildEnrollment,
  RawLinkedChild,
  RawTimetableEntryRow,
} from '../repositories/parent-portal.repository';
import { ParentError, ParentForbiddenError } from '../errors/parent.errors';
import { LearningResourceService } from '../../academic-management/services/learning-resource.service';
import { UserAvatarService } from '../../user-management/services/user-avatar.service';

export interface AuthorizedChildContext {
  child: RawLinkedChild;
  currentEnrollment: RawChildEnrollment | null;
  photoUrl: string | null;
}

export interface TimetableSlotDto {
  period_number: number;
  period_name: string;
  period_type: string;
  start_time: string;
  end_time: string;
  weekday: number;
  status: 'ongoing' | 'upcoming' | 'completed' | 'break' | 'lunch' | 'scheduled' | 'free';
  is_break: boolean;
  timetable_entry_id: string | null;
  subject_id: string | null;
  subject_code: string | null;
  subject_name: string | null;
  staff_id: string | null;
  teacher_name: string | null;
  co_teachers: string[];
  classroom_id: string | null;
  classroom_label: string | null;
  building_name: string | null;
  floor_name: string | null;
  notes: string | null;
}

const WEEKDAY_NAMES: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

function toMinutes(hhmm: string): number {
  const [hStr, mStr] = (hhmm || '00:00').split(':');
  return Number(hStr || 0) * 60 + Number(mStr || 0);
}

function getIsoWeekday(date: Date = new Date()): number {
  const d = date.getDay();
  return d === 0 ? 7 : d;
}

function formatTimeHHMM(date: Date = new Date()): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatDateIso(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function selectChildCurrentEnrollment(
  enrollments: RawChildEnrollment[],
): RawChildEnrollment | null {
  if (!enrollments || enrollments.length === 0) return null;
  // Query already orders by active status, current year, enrollment_date DESC, created_at DESC
  return enrollments[0];
}

export function formatClassroomLabel(entry: RawTimetableEntryRow): string | null {
  if (entry.room_name && entry.room_code) {
    return `${entry.room_name} (${entry.room_code})`;
  }
  return entry.room_name || entry.room_code || null;
}

export function buildDayScheduleSlots(
  weekday: number,
  bellPeriods: RawBellPeriodRow[],
  dayEntries: RawTimetableEntryRow[],
  coTeachersBySlotKey: Map<string, string[]>,
  options: { currentWeekday: number; currentTimeHHMM: string },
): TimetableSlotDto[] {
  const entryByPeriodId = new Map<string, RawTimetableEntryRow>();
  for (const e of dayEntries) {
    if (!entryByPeriodId.has(e.bell_schedule_period_id)) {
      entryByPeriodId.set(e.bell_schedule_period_id, e);
    }
  }

  const isToday = weekday === options.currentWeekday;
  const nowMinutes = toMinutes(options.currentTimeHHMM);

  const computeStatus = (
    periodType: string,
    hasClass: boolean,
    startTime: string,
    endTime: string,
  ): TimetableSlotDto['status'] => {
    if (periodType === 'break') return 'break';
    if (periodType === 'lunch') return 'lunch';
    if (periodType !== 'teaching') return 'break';
    if (!hasClass) return 'free';
    if (!isToday) return 'scheduled';

    const startMin = toMinutes(startTime);
    const endMin = toMinutes(endTime);
    if (nowMinutes >= startMin && nowMinutes < endMin) return 'ongoing';
    if (nowMinutes < startMin) return 'upcoming';
    return 'completed';
  };

  if (bellPeriods.length > 0) {
    return bellPeriods.map((bp) => {
      const entry = entryByPeriodId.get(bp.bell_schedule_period_id) || null;
      const isBreak = bp.period_type !== 'teaching';
      const coTeachers = entry
        ? (coTeachersBySlotKey.get(entry.academic_year_grade_subject_id) || []).filter(
            (name) => name !== entry.teacher_name,
          )
        : [];

      return {
        period_number: bp.period_number,
        period_name: bp.period_name,
        period_type: bp.period_type,
        start_time: bp.start_time,
        end_time: bp.end_time,
        weekday,
        status: computeStatus(bp.period_type, Boolean(entry), bp.start_time, bp.end_time),
        is_break: isBreak,
        timetable_entry_id: entry?.timetable_entry_id || null,
        subject_id: entry?.subject_id || null,
        subject_code: entry?.subject_code || null,
        subject_name: entry?.subject_name || null,
        staff_id: entry?.staff_id || null,
        teacher_name: entry?.teacher_name || null,
        co_teachers: coTeachers,
        classroom_id: entry?.classroom_id || null,
        classroom_label: entry ? formatClassroomLabel(entry) : null,
        building_name: entry?.building_name || null,
        floor_name: entry?.floor_name || null,
        notes: entry?.notes || null,
      };
    });
  }

  // Fallback when entries exist without bellPeriods lookup match
  return dayEntries.map((entry) => {
    const isBreak = entry.period_type !== 'teaching';
    const coTeachers = (coTeachersBySlotKey.get(entry.academic_year_grade_subject_id) || []).filter(
      (name) => name !== entry.teacher_name,
    );

    return {
      period_number: entry.period_number,
      period_name: entry.period_name,
      period_type: entry.period_type,
      start_time: entry.start_time,
      end_time: entry.end_time,
      weekday,
      status: computeStatus(entry.period_type, true, entry.start_time, entry.end_time),
      is_break: isBreak,
      timetable_entry_id: entry.timetable_entry_id,
      subject_id: entry.subject_id,
      subject_code: entry.subject_code,
      subject_name: entry.subject_name,
      staff_id: entry.staff_id,
      teacher_name: entry.teacher_name,
      co_teachers: coTeachers,
      classroom_id: entry.classroom_id,
      classroom_label: formatClassroomLabel(entry),
      building_name: entry.building_name,
      floor_name: entry.floor_name,
      notes: entry.notes,
    };
  });
}

export class ParentPortalService {
  private static async resolveChildPhotoUrl(child: RawLinkedChild): Promise<string | null> {
    if (!child.avatar_url) return null;
    try {
      return await UserAvatarService.getAvatarSignedUrl(child.avatar_url);
    } catch {
      return null;
    }
  }

  /**
   * Authorizes parent access to a single linked child, blocking cross-parent and cross-tenant IDOR.
   */
  static async assertAndResolveChild(
    orgId: string,
    userId: string,
    userEmail: string | null | undefined,
    childId: string,
  ): Promise<AuthorizedChildContext> {
    if (!isValidUuid(orgId) || !isValidUuid(userId)) {
      throw new ParentError(
        'Invalid session organization or user identifier.',
        401,
        'UNAUTHORIZED',
      );
    }

    if (!isValidUuid(childId)) {
      throw new ParentError('Invalid student identifier format.', 400, 'INVALID_CHILD_ID');
    }

    const studentInOrg = await ParentPortalRepository.studentExistsInOrg(orgId, childId);
    if (!studentInOrg) {
      throw new ParentError('Child record was not found in your school.', 404, 'CHILD_NOT_FOUND');
    }

    const parentRecords = await ParentPortalRepository.resolveAuthorizedParentRecords(
      orgId,
      userId,
      userEmail,
    );
    const parentIds = parentRecords.map((p) => p.parent_id);

    if (parentIds.length === 0) {
      throw new ParentForbiddenError(
        'Forbidden: You do not have an authorized parent profile linked in this school.',
      );
    }

    const matchedChildren = await ParentPortalRepository.findAuthorizedChildren(
      orgId,
      parentIds,
      childId,
    );
    const child = matchedChildren[0];

    if (!child) {
      throw new ParentForbiddenError(
        'Forbidden: You are not authorized to view records for this student.',
      );
    }

    const photoUrl = await this.resolveChildPhotoUrl(child);
    return {
      child,
      currentEnrollment: selectChildCurrentEnrollment(child.enrollments),
      photoUrl,
    };
  }

  /**
   * Lists all authorized linked children for the authenticated parent.
   */
  static async listAuthorizedChildren(orgId: string, userId: string, userEmail?: string | null) {
    if (!isValidUuid(orgId) || !isValidUuid(userId)) {
      throw new ParentError('Invalid session context.', 401, 'UNAUTHORIZED');
    }

    const [orgMeta, currentYear, parentRecords] = await Promise.all([
      ParentPortalRepository.getOrganizationMeta(orgId),
      ParentPortalRepository.getCurrentAcademicYear(orgId),
      ParentPortalRepository.resolveAuthorizedParentRecords(orgId, userId, userEmail),
    ]);

    const parentIds = parentRecords.map((p) => p.parent_id);
    const rawChildren = await ParentPortalRepository.findAuthorizedChildren(orgId, parentIds);

    const children = await Promise.all(
      rawChildren.map(async (c) => {
        const enr = selectChildCurrentEnrollment(c.enrollments);
        const photoUrl = await this.resolveChildPhotoUrl(c);
        return {
          student_id: c.student_id,
          admission_no: c.admission_no,
          first_name: c.first_name,
          last_name: c.last_name,
          full_name: c.full_name,
          dob: c.dob,
          gender: c.gender,
          admission_date: c.admission_date,
          status: c.student_status,
          relationship: c.relationship,
          is_primary_contact: c.is_primary_contact,
          photo_url: photoUrl,
          board_affiliation: enr?.grade_board || orgMeta?.board_affiliation || null,
          current_enrollment: enr
            ? {
                enrollment_id: enr.enrollment_id,
                academic_year_id: enr.academic_year_id,
                academic_year_name: enr.academic_year_name,
                academic_year_grade_id: enr.academic_year_grade_id,
                grade_id: enr.grade_id,
                grade_code: enr.grade_code,
                grade_name: enr.grade_name,
                section_id: enr.section_id,
                section_name: enr.section_name,
                section_room_no: enr.section_room_no,
                roll_number: enr.roll_number,
                enrollment_status: enr.enrollment_status,
                class_teacher: enr.class_teacher_staff_id
                  ? {
                      staff_id: enr.class_teacher_staff_id,
                      name: enr.class_teacher_name || 'Assigned Teacher',
                      email: enr.class_teacher_email,
                      designation: enr.class_teacher_designation,
                    }
                  : null,
              }
            : null,
          enrollment_history: c.enrollments,
        };
      }),
    );

    return {
      organization: orgMeta,
      current_academic_year: currentYear,
      children,
    };
  }

  /**
   * Returns complete profile, placement, class teacher, and subject teachers for one authorized child.
   */
  static async getChildProfile(
    orgId: string,
    userId: string,
    userEmail: string | null | undefined,
    childId: string,
  ) {
    const [{ child, currentEnrollment, photoUrl }, orgMeta] = await Promise.all([
      this.assertAndResolveChild(orgId, userId, userEmail, childId),
      ParentPortalRepository.getOrganizationMeta(orgId),
    ]);

    const teachers = currentEnrollment?.section_id
      ? await ParentPortalRepository.findSectionFaculty(orgId, currentEnrollment.section_id)
      : [];

    const subjects =
      currentEnrollment && currentEnrollment.academic_year_grade_id
        ? await ParentPortalRepository.findChildSubjects(
            orgId,
            child.student_id,
            currentEnrollment.grade_id,
            currentEnrollment.academic_year_grade_id,
            currentEnrollment.section_id,
          )
        : [];

    return {
      organization: orgMeta,
      child: {
        student_id: child.student_id,
        application_id: child.application_id,
        admission_no: child.admission_no,
        first_name: child.first_name,
        last_name: child.last_name,
        full_name: child.full_name,
        dob: child.dob,
        gender: child.gender,
        admission_date: child.admission_date,
        status: child.student_status,
        relationship: child.relationship,
        is_primary_contact: child.is_primary_contact,
        photo_url: photoUrl,
        board_affiliation: currentEnrollment?.grade_board || orgMeta?.board_affiliation || null,
        current_enrollment: currentEnrollment
          ? {
              enrollment_id: currentEnrollment.enrollment_id,
              academic_year_id: currentEnrollment.academic_year_id,
              academic_year_name: currentEnrollment.academic_year_name,
              academic_year_grade_id: currentEnrollment.academic_year_grade_id,
              grade_id: currentEnrollment.grade_id,
              grade_code: currentEnrollment.grade_code,
              grade_name: currentEnrollment.grade_name,
              section_id: currentEnrollment.section_id,
              section_name: currentEnrollment.section_name,
              section_room_no: currentEnrollment.section_room_no,
              roll_number: currentEnrollment.roll_number,
              enrollment_status: currentEnrollment.enrollment_status,
              class_teacher: currentEnrollment.class_teacher_staff_id
                ? {
                    staff_id: currentEnrollment.class_teacher_staff_id,
                    name: currentEnrollment.class_teacher_name || 'Assigned Teacher',
                    email: currentEnrollment.class_teacher_email,
                    designation: currentEnrollment.class_teacher_designation,
                  }
                : null,
            }
          : null,
        enrollment_history: child.enrollments,
        subject_teachers: teachers,
        subjects_count: subjects.length,
      },
    };
  }

  /**
   * Builds today's child timetable merging published entries with configured bell schedule breaks/lunch.
   */
  static async getChildTodayTimetable(
    orgId: string,
    userId: string,
    userEmail: string | null | undefined,
    childId: string,
    options: { weekday?: number; currentTimeHHMM?: string } = {},
  ) {
    const { child, currentEnrollment } = await this.assertAndResolveChild(
      orgId,
      userId,
      userEmail,
      childId,
    );

    const now = new Date();
    const actualTodayWeekday = getIsoWeekday(now);
    const requestedWeekday =
      options.weekday && options.weekday >= 1 && options.weekday <= 7
        ? options.weekday
        : actualTodayWeekday;
    const currentTimeHHMM = options.currentTimeHHMM || formatTimeHHMM(now);

    if (!currentEnrollment) {
      return {
        child_id: child.student_id,
        has_active_enrollment: false,
        has_published_timetable: false,
        weekday: requestedWeekday,
        weekday_name: WEEKDAY_NAMES[requestedWeekday] || 'Day',
        date: formatDateIso(now),
        is_working_day: false,
        current_class: null,
        next_class: null,
        current_slot: null,
        slots: [],
      };
    }

    if (!currentEnrollment.section_id) {
      return {
        child_id: child.student_id,
        has_active_enrollment: true,
        has_section_assignment: false,
        has_published_timetable: false,
        grade_name: currentEnrollment.grade_name,
        academic_year_name: currentEnrollment.academic_year_name,
        weekday: requestedWeekday,
        weekday_name: WEEKDAY_NAMES[requestedWeekday] || 'Day',
        date: formatDateIso(now),
        is_working_day: false,
        current_class: null,
        next_class: null,
        current_slot: null,
        slots: [],
      };
    }

    const timetable = await ParentPortalRepository.findChildTimetable(
      orgId,
      currentEnrollment.academic_year_id,
      currentEnrollment.academic_year_grade_id,
      currentEnrollment.section_id,
    );

    const dayEntries = timetable.entries.filter((e) => Number(e.weekday) === requestedWeekday);
    const isWorkingDay =
      timetable.workingWeekdays.length === 0
        ? dayEntries.length > 0
        : timetable.workingWeekdays.includes(requestedWeekday);

    const slots =
      timetable.publishedVersion && isWorkingDay
        ? buildDayScheduleSlots(
            requestedWeekday,
            timetable.bellPeriods,
            dayEntries,
            timetable.coTeachersBySlotKey,
            { currentWeekday: actualTodayWeekday, currentTimeHHMM },
          )
        : [];

    const currentSlot =
      slots.find((s) => {
        if (requestedWeekday !== actualTodayWeekday) return false;
        const nowMin = toMinutes(currentTimeHHMM);
        return nowMin >= toMinutes(s.start_time) && nowMin < toMinutes(s.end_time);
      }) || null;

    const currentClass = slots.find((s) => !s.is_break && s.status === 'ongoing') || null;
    const nextClass =
      slots.find((s) => !s.is_break && s.timetable_entry_id && s.status === 'upcoming') || null;

    return {
      child_id: child.student_id,
      has_active_enrollment: true,
      has_section_assignment: true,
      has_published_timetable: Boolean(timetable.publishedVersion),
      published_version: timetable.publishedVersion,
      grade_name: currentEnrollment.grade_name,
      section_name: currentEnrollment.section_name,
      academic_year_name: currentEnrollment.academic_year_name,
      weekday: requestedWeekday,
      weekday_name: WEEKDAY_NAMES[requestedWeekday] || 'Day',
      date: formatDateIso(now),
      is_working_day: isWorkingDay,
      working_weekdays: timetable.workingWeekdays,
      current_slot: currentSlot,
      current_class: currentClass,
      next_class: nextClass,
      teaching_classes_count: slots.filter((s) => !s.is_break && s.timetable_entry_id).length,
      slots,
    };
  }

  /**
   * Builds full weekly schedule matrix across configured working days with bell schedule breaks.
   */
  static async getChildWeeklyTimetable(
    orgId: string,
    userId: string,
    userEmail: string | null | undefined,
    childId: string,
    options: { currentTimeHHMM?: string } = {},
  ) {
    const { child, currentEnrollment } = await this.assertAndResolveChild(
      orgId,
      userId,
      userEmail,
      childId,
    );

    const now = new Date();
    const currentWeekday = getIsoWeekday(now);
    const currentTimeHHMM = options.currentTimeHHMM || formatTimeHHMM(now);

    if (!currentEnrollment || !currentEnrollment.section_id) {
      return {
        child_id: child.student_id,
        has_active_enrollment: Boolean(currentEnrollment),
        has_section_assignment: Boolean(currentEnrollment?.section_id),
        has_published_timetable: false,
        grade_name: currentEnrollment?.grade_name || null,
        section_name: currentEnrollment?.section_name || null,
        academic_year_name: currentEnrollment?.academic_year_name || null,
        current_weekday: currentWeekday,
        working_weekdays: [],
        periods: [],
        days: [],
      };
    }

    const timetable = await ParentPortalRepository.findChildTimetable(
      orgId,
      currentEnrollment.academic_year_id,
      currentEnrollment.academic_year_grade_id,
      currentEnrollment.section_id,
    );

    const weekdays =
      timetable.workingWeekdays.length > 0 ? timetable.workingWeekdays : [1, 2, 3, 4, 5];

    const days = timetable.publishedVersion
      ? weekdays.map((weekday) => {
          const dayEntries = timetable.entries.filter((e) => Number(e.weekday) === weekday);
          const slots = buildDayScheduleSlots(
            weekday,
            timetable.bellPeriods,
            dayEntries,
            timetable.coTeachersBySlotKey,
            { currentWeekday, currentTimeHHMM },
          );
          return {
            weekday,
            weekday_name: WEEKDAY_NAMES[weekday] || `Day ${weekday}`,
            is_today: weekday === currentWeekday,
            slots,
          };
        })
      : [];

    return {
      child_id: child.student_id,
      has_active_enrollment: true,
      has_section_assignment: true,
      has_published_timetable: Boolean(timetable.publishedVersion),
      published_version: timetable.publishedVersion,
      grade_name: currentEnrollment.grade_name,
      section_name: currentEnrollment.section_name,
      academic_year_name: currentEnrollment.academic_year_name,
      current_weekday: currentWeekday,
      working_weekdays: weekdays,
      periods: timetable.bellPeriods,
      days,
    };
  }

  /**
   * Lists subjects and faculty teachers scoped to the child's grade offering and section.
   */
  static async getChildSubjects(
    orgId: string,
    userId: string,
    userEmail: string | null | undefined,
    childId: string,
  ) {
    const [{ child, currentEnrollment }, orgMeta] = await Promise.all([
      this.assertAndResolveChild(orgId, userId, userEmail, childId),
      ParentPortalRepository.getOrganizationMeta(orgId),
    ]);

    if (!currentEnrollment) {
      return {
        child_id: child.student_id,
        has_active_enrollment: false,
        board_affiliation: orgMeta?.board_affiliation || null,
        subjects: [],
      };
    }

    const subjects = await ParentPortalRepository.findChildSubjects(
      orgId,
      child.student_id,
      currentEnrollment.grade_id,
      currentEnrollment.academic_year_grade_id,
      currentEnrollment.section_id,
    );

    return {
      child_id: child.student_id,
      has_active_enrollment: true,
      academic_year_name: currentEnrollment.academic_year_name,
      grade_name: currentEnrollment.grade_name,
      section_name: currentEnrollment.section_name,
      board_affiliation: currentEnrollment.grade_board || orgMeta?.board_affiliation || null,
      individual_elective_selection_supported: false,
      subjects,
    };
  }

  /**
   * Returns published curriculum plans, syllabus units, learning outcomes, and schedule pacing.
   */
  static async getChildCurriculumAndProgress(
    orgId: string,
    userId: string,
    userEmail: string | null | undefined,
    childId: string,
    subjectId?: string,
  ) {
    const [{ child, currentEnrollment }, orgMeta] = await Promise.all([
      this.assertAndResolveChild(orgId, userId, userEmail, childId),
      ParentPortalRepository.getOrganizationMeta(orgId),
    ]);

    if (!currentEnrollment) {
      return {
        child_id: child.student_id,
        has_active_enrollment: false,
        board_affiliation: orgMeta?.board_affiliation || null,
        plans: [],
        pacing_summary: {
          published_subjects_count: 0,
          total_units: 0,
          total_outcomes: 0,
          scheduled_completed_units: 0,
          scheduled_in_progress_units: 0,
          scheduled_upcoming_units: 0,
          scheduled_timeline_percent: null,
        },
        unsupported_tracking: {
          attendance: false,
          exam_marks: false,
          report_cards: false,
          assignment_submissions: false,
          verified_topic_completion: false,
        },
      };
    }

    const plans = await ParentPortalRepository.findChildCurriculum(
      orgId,
      currentEnrollment.academic_year_grade_id,
      subjectId,
    );

    const now = new Date();
    let totalUnits = 0;
    let totalOutcomes = 0;
    let scheduledCompletedUnits = 0;
    let scheduledInProgressUnits = 0;
    let scheduledUpcomingUnits = 0;

    const enrichedPlans = plans.map((plan) => {
      let planCompleted = 0;
      let planInProgress = 0;
      let planUpcoming = 0;
      let planOutcomes = 0;
      let planPeriods = 0;

      const units = (plan.units || []).map((u: any) => {
        totalUnits += 1;
        planPeriods += Number(u.planned_duration_periods || 0);
        const unitOutcomeCount = Array.isArray(u.outcomes) ? u.outcomes.length : 0;
        totalOutcomes += unitOutcomeCount;
        planOutcomes += unitOutcomeCount;

        const startDate = u.planned_start_date ? new Date(u.planned_start_date) : null;
        const endDate = u.planned_end_date ? new Date(u.planned_end_date) : null;

        let scheduleState:
          'completed_by_schedule' | 'in_progress_by_schedule' | 'upcoming' | 'unscheduled' =
          'unscheduled';
        if (endDate && endDate < now) {
          scheduleState = 'completed_by_schedule';
          scheduledCompletedUnits += 1;
          planCompleted += 1;
        } else if (startDate && endDate && startDate <= now && endDate >= now) {
          scheduleState = 'in_progress_by_schedule';
          scheduledInProgressUnits += 1;
          planInProgress += 1;
        } else if (startDate || endDate) {
          scheduleState = 'upcoming';
          scheduledUpcomingUnits += 1;
          planUpcoming += 1;
        }

        return {
          ...u,
          schedule_state: scheduleState,
        };
      });

      const unitCount = units.length;
      const planTimelinePct = unitCount > 0 ? Math.round((planCompleted / unitCount) * 100) : null;

      return {
        ...plan,
        units,
        schedule_pacing: {
          total_units: unitCount,
          total_outcomes: planOutcomes,
          total_planned_periods: planPeriods,
          completed_units_by_schedule: planCompleted,
          in_progress_units_by_schedule: planInProgress,
          upcoming_units: planUpcoming,
          scheduled_timeline_percent: planTimelinePct,
        },
      };
    });

    const scheduledTimelinePercent =
      totalUnits > 0 ? Math.round((scheduledCompletedUnits / totalUnits) * 100) : null;

    return {
      child_id: child.student_id,
      has_active_enrollment: true,
      academic_year_name: currentEnrollment.academic_year_name,
      grade_name: currentEnrollment.grade_name,
      section_name: currentEnrollment.section_name,
      board_affiliation: currentEnrollment.grade_board || orgMeta?.board_affiliation || null,
      plans: enrichedPlans,
      pacing_summary: {
        published_subjects_count: enrichedPlans.length,
        total_units: totalUnits,
        total_outcomes: totalOutcomes,
        scheduled_completed_units: scheduledCompletedUnits,
        scheduled_in_progress_units: scheduledInProgressUnits,
        scheduled_upcoming_units: scheduledUpcomingUnits,
        scheduled_timeline_percent: scheduledTimelinePercent,
        note: 'Derived strictly from planned syllabus unit dates. Student-level completion, marks, and attendance are unsupported by the finalized Stage-1 database.',
      },
      unsupported_tracking: {
        attendance: false,
        exam_marks: false,
        report_cards: false,
        assignment_submissions: false,
        verified_topic_completion: false,
      },
    };
  }

  /**
   * Lists child-accessible published digital learning resources.
   */
  static async getChildResources(
    orgId: string,
    userId: string,
    userEmail: string | null | undefined,
    childId: string,
    filters: {
      subjectId?: string;
      categoryId?: string;
      resourceType?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { child, currentEnrollment } = await this.assertAndResolveChild(
      orgId,
      userId,
      userEmail,
      childId,
    );

    if (!currentEnrollment) {
      return {
        child_id: child.student_id,
        has_active_enrollment: false,
        items: [],
        categories: [],
        meta: { total: 0, page: 1, limit: 24, totalPages: 1 },
      };
    }

    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 24;

    const [{ items, total }, categories] = await Promise.all([
      ParentPortalRepository.findChildResources(
        orgId,
        child.student_id,
        currentEnrollment.grade_id,
        currentEnrollment.section_id,
        filters,
      ),
      LearningResourceService.listCategories(orgId),
    ]);

    return {
      child_id: child.student_id,
      has_active_enrollment: true,
      grade_name: currentEnrollment.grade_name,
      section_name: currentEnrollment.section_name,
      items,
      categories,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  /**
   * Authorizes child access and returns a short-lived signed preview URL for a published resource.
   */
  static async getChildResourcePreviewUrl(
    orgId: string,
    userId: string,
    userEmail: string | null | undefined,
    childId: string,
    resourceId: string,
  ) {
    const { child, currentEnrollment } = await this.assertAndResolveChild(
      orgId,
      userId,
      userEmail,
      childId,
    );

    if (!currentEnrollment) {
      throw new ParentForbiddenError('Child has no active grade enrollment for resource access.');
    }

    const access = await ParentPortalRepository.checkChildResourceAccess(
      orgId,
      child.student_id,
      currentEnrollment.grade_id,
      currentEnrollment.section_id,
      resourceId,
    );

    if (!access.accessible) {
      throw new ParentForbiddenError(
        'Forbidden: This learning resource is not published or not shared with this child.',
      );
    }

    return LearningResourceService.getPreviewUrl(orgId, resourceId);
  }

  /**
   * Authorizes child access + allow_download policy and returns a short-lived signed download URL.
   */
  static async getChildResourceDownloadUrl(
    orgId: string,
    userId: string,
    userEmail: string | null | undefined,
    childId: string,
    resourceId: string,
  ) {
    const { child, currentEnrollment } = await this.assertAndResolveChild(
      orgId,
      userId,
      userEmail,
      childId,
    );

    if (!currentEnrollment) {
      throw new ParentForbiddenError('Child has no active grade enrollment for resource access.');
    }

    const access = await ParentPortalRepository.checkChildResourceAccess(
      orgId,
      child.student_id,
      currentEnrollment.grade_id,
      currentEnrollment.section_id,
      resourceId,
    );

    if (!access.accessible) {
      throw new ParentForbiddenError(
        'Forbidden: This learning resource is not published or not shared with this child.',
      );
    }

    if (!access.allowDownload) {
      throw new ParentForbiddenError(
        'Downloads are restricted for this shared resource; preview only is enabled.',
      );
    }

    return LearningResourceService.getDownloadUrl(orgId, resourceId);
  }

  /**
   * Fetches published academic calendar entries filtered to school-wide and child's grade.
   */
  static async getChildCalendar(
    orgId: string,
    userId: string,
    userEmail: string | null | undefined,
    childId: string,
    filters: { entryType?: string; fromDate?: string; toDate?: string } = {},
  ) {
    const { child, currentEnrollment } = await this.assertAndResolveChild(
      orgId,
      userId,
      userEmail,
      childId,
    );

    if (!currentEnrollment) {
      return {
        child_id: child.student_id,
        has_active_enrollment: false,
        is_published: false,
        calendar: null,
        working_days: [],
        terms: [],
        entries: [],
      };
    }

    const result = await ParentPortalRepository.findChildCalendar(
      orgId,
      currentEnrollment.academic_year_id,
      currentEnrollment.academic_year_grade_id,
      filters,
    );

    return {
      child_id: child.student_id,
      has_active_enrollment: true,
      grade_name: currentEnrollment.grade_name,
      academic_year_name: currentEnrollment.academic_year_name,
      ...result,
    };
  }

  /**
   * Consolidated dashboard overview prioritizing real linked children, today's classes,
   * upcoming academic events, published resources, and unread notifications.
   */
  static async getDashboardOverview(
    orgId: string,
    userId: string,
    userEmail: string | null | undefined,
    requestedChildId?: string,
  ) {
    const childrenOverview = await this.listAuthorizedChildren(orgId, userId, userEmail);
    const { organization, current_academic_year, children } = childrenOverview;

    const unreadNotificationsCount = await prisma.notifications.count({
      where: {
        org_id: orgId,
        recipient_user_id: userId,
        is_read: false,
        OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
      },
    });

    const selectedChild =
      (requestedChildId ? children.find((c) => c.student_id === requestedChildId) : undefined) ||
      children[0] ||
      null;

    if (!selectedChild) {
      return {
        organization,
        current_academic_year,
        children: [],
        selected_child_id: null,
        summary: {
          total_children: 0,
          active_enrollments: 0,
          today_classes_count: 0,
          upcoming_events_count: 0,
          available_resources_count: 0,
          unread_notifications_count: unreadNotificationsCount,
        },
        selected_child_academic: null,
        unsupported_metrics: {
          attendance_percentage: false,
          exam_results: false,
          assignment_completion: false,
        },
      };
    }

    const activeEnrollmentsCount = children.filter(
      (c) => c.current_enrollment?.enrollment_status === 'active',
    ).length;

    const todayStr = formatDateIso(new Date());

    const [todayTimetable, weeklyTimetable, subjectsRes, curriculumRes, resourcesRes, calendarRes] =
      await Promise.all([
        this.getChildTodayTimetable(orgId, userId, userEmail, selectedChild.student_id),
        this.getChildWeeklyTimetable(orgId, userId, userEmail, selectedChild.student_id),
        this.getChildSubjects(orgId, userId, userEmail, selectedChild.student_id),
        this.getChildCurriculumAndProgress(orgId, userId, userEmail, selectedChild.student_id),
        this.getChildResources(orgId, userId, userEmail, selectedChild.student_id, {
          page: 1,
          limit: 6,
        }),
        this.getChildCalendar(orgId, userId, userEmail, selectedChild.student_id, {
          fromDate: todayStr,
        }),
      ]);

    return {
      organization,
      current_academic_year,
      children,
      selected_child_id: selectedChild.student_id,
      summary: {
        total_children: children.length,
        active_enrollments: activeEnrollmentsCount,
        today_classes_count: todayTimetable.teaching_classes_count || 0,
        upcoming_events_count: calendarRes.entries.length,
        available_resources_count: resourcesRes.meta.total,
        unread_notifications_count: unreadNotificationsCount,
      },
      selected_child_academic: {
        child: selectedChild,
        today_timetable: todayTimetable,
        weekly_timetable: weeklyTimetable,
        subjects: subjectsRes.subjects,
        board_affiliation: subjectsRes.board_affiliation,
        curriculum_pacing: curriculumRes.pacing_summary,
        curriculum_plans: curriculumRes.plans,
        recent_resources: resourcesRes.items,
        upcoming_calendar_entries: calendarRes.entries.slice(0, 6),
        calendar_terms: calendarRes.terms,
      },
      unsupported_metrics: {
        attendance_percentage: false,
        exam_results: false,
        assignment_completion: false,
      },
    };
  }
}
