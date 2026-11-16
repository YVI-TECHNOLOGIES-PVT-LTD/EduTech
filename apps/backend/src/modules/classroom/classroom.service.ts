import {
  ClassroomConflictError,
  ClassroomDeliveryMode,
  ClassroomError,
  ClassroomEventName,
  ClassroomEventType,
  ClassroomForbiddenError,
  ClassroomNotFoundError,
  ClassroomSessionDto,
  ClassroomSessionStatus,
  ClassroomTeachingApproach,
  ClassroomValidationError,
} from './classroom.types';
import { ClassroomRepository, SessionListFilters, StudentContextRow } from './classroom.repository';
import { EventBus } from '../../workflows/event-bus.service';
import { NotificationService } from '../notifications/services/notification.service';
import {
  notification_category,
  notification_priority,
} from '../notifications/dto/notification.dto';
import { realtimeNotificationServer } from '../notifications/realtime/notification.realtime';
import { logger } from '../../utils/logger';

function translatePgClassroomError(err: any): never {
  if (err instanceof ClassroomError) throw err;

  const rawMsg = String(err?.meta?.message || err?.message || '');
  const pgCode = String(err?.meta?.code || err?.code || '');

  if (
    pgCode === '23514' ||
    rawMsg.includes('ck_classroom_') ||
    rawMsg.includes('within academic year date bounds') ||
    rawMsg.includes('not active on session_date') ||
    rawMsg.includes('attendance participation_mode') ||
    rawMsg.includes('cannot be changed before')
  ) {
    throw new ClassroomValidationError(rawMsg || 'Database constraint validation failed');
  }

  if (
    rawMsg.includes('Only the assigned teacher') ||
    rawMsg.includes('Lesson plan') ||
    rawMsg.includes('does not belong to')
  ) {
    throw new ClassroomForbiddenError(rawMsg || 'Authorization constraint failed');
  }

  if (
    pgCode === '23505' ||
    rawMsg.includes('uq_classroom_') ||
    rawMsg.includes('Invalid classroom_sessions state transition') ||
    rawMsg.includes('only allowed when session_status is in_progress') ||
    rawMsg.includes('Cannot modify classroom_session_attendance')
  ) {
    throw new ClassroomConflictError(rawMsg || 'Classroom state or uniqueness conflict');
  }

  throw err;
}

function validateModeConstraints(
  deliveryMode: ClassroomDeliveryMode,
  classroomId: string | null,
  meetingUrl: string | null,
) {
  if ((deliveryMode === 'physical' || deliveryMode === 'hybrid') && !classroomId) {
    throw new ClassroomValidationError(`Classroom is required for ${deliveryMode} sessions`);
  }
  if (deliveryMode === 'online' && classroomId) {
    throw new ClassroomValidationError('Online sessions cannot specify a physical classroom');
  }
  if ((deliveryMode === 'online' || deliveryMode === 'hybrid') && !meetingUrl) {
    throw new ClassroomValidationError(`Meeting URL is required for ${deliveryMode} sessions`);
  }
  if (deliveryMode === 'physical' && meetingUrl) {
    throw new ClassroomValidationError('Physical sessions cannot carry an online meeting URL');
  }
}

async function dispatchClassroomRealtimeAndNotifications(input: {
  orgId: string;
  eventType: ClassroomEventName;
  session: ClassroomSessionDto;
  specificStudentIds?: string[];
  notifyTeacher?: boolean;
}) {
  try {
    const audience = await ClassroomRepository.getSessionAudienceUsers(
      input.orgId,
      input.session.session_id,
      input.specificStudentIds,
    );
    if (!audience) return;

    const redactedWsData = {
      session_id: input.session.session_id,
      section_id: input.session.section_id,
      subject_id: input.session.subject_id,
      subject_name: input.session.subject_name,
      section_name: input.session.section_name,
      session_date: input.session.session_date,
      scheduled_start_time: input.session.scheduled_start_time,
      scheduled_end_time: input.session.scheduled_end_time,
      session_status: input.session.session_status,
      delivery_mode: input.session.delivery_mode,
      teaching_approach: input.session.teaching_approach,
      has_meeting_url: input.session.has_meeting_url,
    };

    try {
      await EventBus.publish(input.eventType, {
        orgId: input.orgId,
        ...redactedWsData,
      });
    } catch (busErr: any) {
      logger.warn(`[Classroom] EventBus publish warning: ${busErr?.message || busErr}`);
    }

    const wsUserIds = new Set<string>([...audience.studentUserIds, ...audience.parentUserIds]);
    if (audience.teacherUserId) {
      wsUserIds.add(audience.teacherUserId);
    }

    for (const targetUserId of wsUserIds) {
      try {
        realtimeNotificationServer.sendToUser(input.orgId, targetUserId, {
          type: input.eventType,
          data: redactedWsData,
        });
      } catch (wsErr: any) {
        logger.warn(`[Classroom] WebSocket dispatch warning: ${wsErr?.message || wsErr}`);
      }
    }

    const notifMeta = buildNotificationDescriptor(
      input.eventType,
      input.session,
      audience.subjectName,
    );
    if (!notifMeta) return;

    const bulkDtos: any[] = [];
    for (const studentUserId of audience.studentUserIds) {
      bulkDtos.push({
        recipient_user_id: studentUserId,
        category: notifMeta.category,
        type: input.eventType,
        priority: notifMeta.priority,
        title: notifMeta.title,
        message: notifMeta.message,
        entity_type: 'classroom_session',
        entity_id: input.session.session_id,
        action_url: '/app/student/classroom',
        metadata: redactedWsData,
      });
    }
    for (const parentUserId of audience.parentUserIds) {
      bulkDtos.push({
        recipient_user_id: parentUserId,
        category: notifMeta.category,
        type: input.eventType,
        priority: notifMeta.priority,
        title: notifMeta.title,
        message: notifMeta.message,
        entity_type: 'classroom_session',
        entity_id: input.session.session_id,
        action_url: '/app/parent/classroom',
        metadata: redactedWsData,
      });
    }
    if (input.notifyTeacher && audience.teacherUserId) {
      bulkDtos.push({
        recipient_user_id: audience.teacherUserId,
        category: notifMeta.category,
        type: input.eventType,
        priority: notifMeta.priority,
        title: notifMeta.title,
        message: notifMeta.message,
        entity_type: 'classroom_session',
        entity_id: input.session.session_id,
        action_url: '/app/teacher/classroom',
        metadata: redactedWsData,
      });
    }

    if (bulkDtos.length > 0) {
      await NotificationService.sendBulkNotifications(input.orgId, bulkDtos);
    }
  } catch (err: any) {
    logger.warn(`[Classroom] Non-blocking notification dispatch error: ${err?.message || err}`);
  }
}

function buildNotificationDescriptor(
  eventType: ClassroomEventName,
  session: ClassroomSessionDto,
  subjectName: string,
): {
  category: notification_category;
  priority: notification_priority;
  title: string;
  message: string;
} | null {
  const slot = `${session.session_date} ${session.scheduled_start_time.slice(0, 5)}`;
  switch (eventType) {
    case ClassroomEventType.SESSION_SCHEDULED:
      return {
        category: notification_category.SYSTEM,
        priority: notification_priority.NORMAL,
        title: `New ${subjectName} Session Scheduled`,
        message: `${subjectName} (${session.section_name}) scheduled on ${slot} (${session.delivery_mode}).`,
      };
    case ClassroomEventType.SESSION_STARTED:
      return {
        category: notification_category.SYSTEM,
        priority: notification_priority.HIGH,
        title: `${subjectName} Class is Live`,
        message: `${subjectName} (${session.section_name}) has started (${session.delivery_mode} mode).`,
      };
    case ClassroomEventType.SESSION_COMPLETED:
      return {
        category: notification_category.SYSTEM,
        priority: notification_priority.LOW,
        title: `${subjectName} Session Completed`,
        message: `${subjectName} (${session.section_name}) on ${session.session_date} is marked completed.`,
      };
    case ClassroomEventType.SESSION_CANCELLED:
      return {
        category: notification_category.SYSTEM,
        priority: notification_priority.HIGH,
        title: `${subjectName} Session Cancelled`,
        message: `${subjectName} (${session.section_name}) scheduled for ${slot} has been cancelled.`,
      };
    case ClassroomEventType.SESSION_NOT_CONDUCTED:
      return {
        category: notification_category.SYSTEM,
        priority: notification_priority.NORMAL,
        title: `${subjectName} Session Not Conducted`,
        message: `${subjectName} (${session.section_name}) on ${slot} was marked not conducted.`,
      };
    case ClassroomEventType.ATTENDANCE_UPDATED:
      return {
        category: notification_category.ATTENDANCE,
        priority: notification_priority.NORMAL,
        title: `Attendance Updated: ${subjectName}`,
        message: `Classroom attendance for ${subjectName} (${session.session_date}) has been updated.`,
      };
    default:
      return null;
  }
}

export class ClassroomService {
  // ──────────────────────────────────────────────────────────────────────────
  // TEACHER OPERATIONS
  // ──────────────────────────────────────────────────────────────────────────

  static async resolveTeacherOrThrow(orgId: string, userId: string) {
    const staff = await ClassroomRepository.findTeacherStaffByUserId(orgId, userId);
    if (!staff) {
      throw new ClassroomForbiddenError(
        'No active staff/teacher profile is linked to your account in this school.',
      );
    }
    return staff;
  }

  static async getTeacherOverview(orgId: string, userId: string) {
    const teacher = await this.resolveTeacherOrThrow(orgId, userId);
    const data = await ClassroomRepository.getTeacherOverviewAndRefs(orgId, teacher.staff_id);
    return {
      teacher: {
        staff_id: teacher.staff_id,
        full_name: teacher.full_name,
      },
      ...data,
    };
  }

  static async getTeacherClasses(orgId: string, userId: string) {
    const teacher = await this.resolveTeacherOrThrow(orgId, userId);
    const data = await ClassroomRepository.getTeacherOverviewAndRefs(orgId, teacher.staff_id);
    return data.assignments;
  }

  static async listTeacherSessions(orgId: string, userId: string, filters: SessionListFilters) {
    const teacher = await this.resolveTeacherOrThrow(orgId, userId);
    const result = await ClassroomRepository.listTeacherSessions(orgId, teacher.staff_id, filters);
    return {
      ...result,
      page: filters.page,
      limit: filters.limit,
      total_pages: Math.max(1, Math.ceil(result.total / filters.limit)),
    };
  }

  static async createTeacherSession(
    orgId: string,
    userId: string,
    payload: {
      faculty_assignment_id: string;
      session_date: string;
      scheduled_start_time: string;
      scheduled_end_time: string;
      delivery_mode: ClassroomDeliveryMode;
      teaching_approach: ClassroomTeachingApproach;
      classroom_id?: string | null;
      meeting_url?: string | null;
      lesson_plan_id?: string | null;
      topics_covered?: string | null;
      teacher_remarks?: string | null;
    },
  ) {
    const teacher = await this.resolveTeacherOrThrow(orgId, userId);

    const assignment = await ClassroomRepository.findFacultyAssignmentOwnedByStaff(
      orgId,
      teacher.staff_id,
      payload.faculty_assignment_id,
    );
    if (!assignment) {
      throw new ClassroomForbiddenError(
        'Faculty assignment does not belong to you or does not exist in this organization.',
      );
    }
    if (!assignment.is_active) {
      throw new ClassroomValidationError('Selected faculty assignment is inactive.');
    }
    if (
      payload.session_date < assignment.effective_from ||
      (assignment.effective_to && payload.session_date > assignment.effective_to)
    ) {
      throw new ClassroomValidationError(
        `Session date must fall within assignment effective period (${assignment.effective_from} to ${assignment.effective_to || 'open'}).`,
      );
    }
    if (
      payload.session_date < assignment.academic_year_start_date ||
      payload.session_date > assignment.academic_year_end_date
    ) {
      throw new ClassroomValidationError(
        `Session date must fall within academic year range (${assignment.academic_year_start_date} to ${assignment.academic_year_end_date}).`,
      );
    }

    const classroomId = payload.classroom_id || null;
    const meetingUrl = payload.meeting_url?.trim() || null;
    validateModeConstraints(payload.delivery_mode, classroomId, meetingUrl);

    if (classroomId) {
      const room = await ClassroomRepository.verifyClassroomInOrg(orgId, classroomId);
      if (!room || !room.is_active) {
        throw new ClassroomValidationError(
          'Selected physical classroom is not active in this school.',
        );
      }
    }

    const lessonPlanId = payload.lesson_plan_id || null;
    if (lessonPlanId) {
      const lp = await ClassroomRepository.verifyLessonPlanOwnedByStaff(
        teacher.staff_id,
        lessonPlanId,
      );
      if (!lp) {
        throw new ClassroomForbiddenError('Selected lesson plan does not belong to this teacher.');
      }
    }

    const conflict = await ClassroomRepository.checkSessionConflicts({
      orgId,
      staffId: teacher.staff_id,
      sectionId: assignment.section_id,
      classroomId,
      sessionDate: payload.session_date,
      startTime: payload.scheduled_start_time,
      endTime: payload.scheduled_end_time,
    });
    if (conflict) {
      const labels: Record<string, string> = {
        teacher: 'You already have another overlapping classroom session at this time.',
        section: 'The selected section already has an overlapping session scheduled at this time.',
        classroom: 'The selected classroom is already booked for another session at this time.',
      };
      throw new ClassroomConflictError(
        labels[conflict.conflictType] || 'Schedule conflict detected.',
        'SESSION_SCHEDULE_CONFLICT',
        {
          conflicting_session_id: conflict.conflictingSessionId,
          conflict_type: conflict.conflictType,
        },
      );
    }

    let sessionId: string;
    try {
      sessionId = await ClassroomRepository.createManualSession({
        orgId,
        academicYearId: assignment.academic_year_id,
        sectionId: assignment.section_id,
        academicYearGradeSubjectId: assignment.academic_year_grade_subject_id,
        facultyAssignmentId: assignment.faculty_assignment_id,
        lessonPlanId,
        classroomId,
        sessionDate: payload.session_date,
        scheduledStartTime: payload.scheduled_start_time,
        scheduledEndTime: payload.scheduled_end_time,
        deliveryMode: payload.delivery_mode,
        teachingApproach: payload.teaching_approach,
        meetingUrl,
        topicsCovered: payload.topics_covered || null,
        teacherRemarks: payload.teacher_remarks || null,
        actorUserId: userId,
      });
    } catch (err) {
      translatePgClassroomError(err);
    }

    const created = await ClassroomRepository.getSessionDtoById(orgId, sessionId, true);
    if (created) {
      await dispatchClassroomRealtimeAndNotifications({
        orgId,
        eventType: ClassroomEventType.SESSION_SCHEDULED,
        session: created,
      });
    }
    return created!;
  }

  static async getTeacherSessionDetail(orgId: string, userId: string, sessionId: string) {
    const teacher = await this.resolveTeacherOrThrow(orgId, userId);
    const owned = await ClassroomRepository.findRawSessionOwnedByTeacher(
      orgId,
      teacher.staff_id,
      sessionId,
    );
    if (!owned) {
      const existsInOrg = await ClassroomRepository.findSessionByIdInOrg(orgId, sessionId);
      if (existsInOrg) {
        throw new ClassroomForbiddenError('You do not own or teach this classroom session.');
      }
      throw new ClassroomNotFoundError('Classroom session not found.');
    }

    const [session, roster] = await Promise.all([
      ClassroomRepository.getSessionDtoById(orgId, sessionId, true, true),
      ClassroomRepository.getSessionRosterWithAttendance(
        orgId,
        sessionId,
        owned.section_id,
        owned.academic_year_grade_id,
        owned.session_date,
      ),
    ]);

    return {
      session: session!,
      roster,
      flipped_preparation: session?.flipped_preparation || null,
      capabilities: {
        can_edit_metadata:
          owned.session_status === 'scheduled' || owned.session_status === 'in_progress',
        can_edit_schedule: owned.session_status === 'scheduled',
        can_start: owned.session_status === 'scheduled',
        can_complete: owned.session_status === 'in_progress',
        can_cancel: owned.session_status === 'scheduled',
        can_mark_not_conducted: owned.session_status === 'scheduled',
        can_edit_attendance: owned.session_status === 'in_progress',
        attendance_lock_reason:
          owned.session_status === 'in_progress'
            ? null
            : 'Attendance edits are permitted only while the session is in progress.',
      },
    };
  }

  static async updateTeacherSession(
    orgId: string,
    userId: string,
    sessionId: string,
    payload: {
      session_date?: string;
      scheduled_start_time?: string;
      scheduled_end_time?: string;
      delivery_mode?: ClassroomDeliveryMode;
      teaching_approach?: ClassroomTeachingApproach;
      classroom_id?: string | null;
      meeting_url?: string | null;
      lesson_plan_id?: string | null;
      topics_covered?: string | null;
      teacher_remarks?: string | null;
    },
  ) {
    const teacher = await this.resolveTeacherOrThrow(orgId, userId);
    const existing = await ClassroomRepository.findRawSessionOwnedByTeacher(
      orgId,
      teacher.staff_id,
      sessionId,
    );
    if (!existing) {
      const existsInOrg = await ClassroomRepository.findSessionByIdInOrg(orgId, sessionId);
      if (existsInOrg)
        throw new ClassroomForbiddenError('You cannot modify another teacher session.');
      throw new ClassroomNotFoundError('Classroom session not found.');
    }

    if (!['scheduled', 'in_progress'].includes(existing.session_status)) {
      throw new ClassroomConflictError(
        `Cannot update a session in '${existing.session_status}' status.`,
        'SESSION_IMMUTABLE_STATE',
      );
    }

    const scheduleChanging =
      (payload.session_date && payload.session_date !== existing.session_date) ||
      (payload.scheduled_start_time &&
        payload.scheduled_start_time !== existing.scheduled_start_time) ||
      (payload.scheduled_end_time && payload.scheduled_end_time !== existing.scheduled_end_time);

    if (existing.session_status !== 'scheduled' && scheduleChanging) {
      throw new ClassroomConflictError(
        'Date and scheduled time can only be changed before the session starts.',
        'SCHEDULE_LOCKED_WHILE_ACTIVE',
      );
    }

    const nextDate = payload.session_date ?? existing.session_date;
    const nextStart = payload.scheduled_start_time ?? existing.scheduled_start_time;
    const nextEnd = payload.scheduled_end_time ?? existing.scheduled_end_time;
    if (nextEnd <= nextStart) {
      throw new ClassroomValidationError('Scheduled end time must be after scheduled start time.');
    }

    const nextMode = payload.delivery_mode ?? existing.delivery_mode;
    const nextApproach = payload.teaching_approach ?? existing.teaching_approach;
    const nextClassroomId =
      payload.classroom_id !== undefined
        ? payload.classroom_id
        : nextMode === 'online'
          ? null
          : existing.classroom_id;
    const nextMeetingUrl =
      payload.meeting_url !== undefined
        ? payload.meeting_url
        : nextMode === 'physical'
          ? null
          : existing.meeting_url;

    validateModeConstraints(nextMode, nextClassroomId, nextMeetingUrl);

    if (nextClassroomId) {
      const room = await ClassroomRepository.verifyClassroomInOrg(orgId, nextClassroomId);
      if (!room || !room.is_active) {
        throw new ClassroomValidationError('Selected classroom is inactive or invalid.');
      }
    }

    const nextLessonPlanId =
      payload.lesson_plan_id !== undefined ? payload.lesson_plan_id : existing.lesson_plan_id;
    if (nextLessonPlanId) {
      const lp = await ClassroomRepository.verifyLessonPlanOwnedByStaff(
        teacher.staff_id,
        nextLessonPlanId,
      );
      if (!lp) {
        throw new ClassroomForbiddenError('Selected lesson plan does not belong to this teacher.');
      }
    }

    const conflict = await ClassroomRepository.checkSessionConflicts({
      orgId,
      staffId: teacher.staff_id,
      sectionId: existing.section_id,
      classroomId: nextClassroomId,
      sessionDate: nextDate,
      startTime: nextStart,
      endTime: nextEnd,
      excludeSessionId: sessionId,
    });
    if (conflict) {
      throw new ClassroomConflictError(
        `Update conflicts with another ${conflict.conflictType} session at the same time.`,
        'SESSION_SCHEDULE_CONFLICT',
        {
          conflicting_session_id: conflict.conflictingSessionId,
          conflict_type: conflict.conflictType,
        },
      );
    }

    try {
      await ClassroomRepository.updateSessionMetadata({
        orgId,
        sessionId,
        actorUserId: userId,
        sessionDate: nextDate,
        scheduledStartTime: nextStart,
        scheduledEndTime: nextEnd,
        deliveryMode: nextMode,
        teachingApproach: nextApproach,
        classroomId: nextClassroomId,
        meetingUrl: nextMeetingUrl,
        lessonPlanId: nextLessonPlanId,
        topicsCovered:
          payload.topics_covered !== undefined ? payload.topics_covered : existing.topics_covered,
        teacherRemarks:
          payload.teacher_remarks !== undefined
            ? payload.teacher_remarks
            : existing.teacher_remarks,
      });
    } catch (err) {
      translatePgClassroomError(err);
    }

    const updated = await ClassroomRepository.getSessionDtoById(orgId, sessionId, true);
    if (updated) {
      await dispatchClassroomRealtimeAndNotifications({
        orgId,
        eventType: ClassroomEventType.SESSION_UPDATED,
        session: updated,
      });
    }
    return updated!;
  }

  static async transitionTeacherSessionStatus(
    orgId: string,
    userId: string,
    sessionId: string,
    targetStatus: ClassroomSessionStatus,
    details?: {
      topics_covered?: string | null;
      teacher_remarks?: string | null;
      not_conducted_reason?: string | null;
    },
  ) {
    const teacher = await this.resolveTeacherOrThrow(orgId, userId);
    const existing = await ClassroomRepository.findRawSessionOwnedByTeacher(
      orgId,
      teacher.staff_id,
      sessionId,
    );
    if (!existing) {
      const existsInOrg = await ClassroomRepository.findSessionByIdInOrg(orgId, sessionId);
      if (existsInOrg) {
        throw new ClassroomForbiddenError('You cannot change status of another teacher session.');
      }
      throw new ClassroomNotFoundError('Classroom session not found.');
    }

    // Idempotent handling when already in requested state
    if (existing.session_status === targetStatus) {
      const current = await ClassroomRepository.getSessionDtoById(orgId, sessionId, true);
      return { session: current!, already_in_state: true };
    }

    const allowedTargetsByFrom: Record<string, ClassroomSessionStatus[]> = {
      scheduled: ['in_progress', 'cancelled', 'not_conducted'],
      in_progress: ['completed'],
      completed: [],
      cancelled: [],
      not_conducted: [],
    };

    const allowed = allowedTargetsByFrom[existing.session_status] || [];
    if (!allowed.includes(targetStatus)) {
      throw new ClassroomConflictError(
        `Invalid status transition from '${existing.session_status}' to '${targetStatus}'.`,
        'INVALID_STATUS_TRANSITION',
      );
    }

    if (
      targetStatus === 'not_conducted' &&
      (!details?.not_conducted_reason || !details.not_conducted_reason.trim())
    ) {
      throw new ClassroomValidationError(
        'A reason is required to mark a session as not conducted.',
      );
    }

    try {
      await ClassroomRepository.transitionSessionStatus({
        orgId,
        sessionId,
        actorUserId: userId,
        toStatus: targetStatus,
        topicsCovered: details?.topics_covered,
        teacherRemarks: details?.teacher_remarks,
        notConductedReason: details?.not_conducted_reason?.trim() || null,
      });
    } catch (err) {
      translatePgClassroomError(err);
    }

    const updated = await ClassroomRepository.getSessionDtoById(orgId, sessionId, true);
    const eventMap: Record<string, ClassroomEventName> = {
      in_progress: ClassroomEventType.SESSION_STARTED,
      completed: ClassroomEventType.SESSION_COMPLETED,
      cancelled: ClassroomEventType.SESSION_CANCELLED,
      not_conducted: ClassroomEventType.SESSION_NOT_CONDUCTED,
    };

    if (updated && eventMap[targetStatus]) {
      await dispatchClassroomRealtimeAndNotifications({
        orgId,
        eventType: eventMap[targetStatus],
        session: updated,
      });
    }

    return { session: updated!, already_in_state: false };
  }

  static async markTeacherAttendance(
    orgId: string,
    userId: string,
    sessionId: string,
    records: Array<{
      student_id: string;
      enrollment_id?: string;
      attendance_status: 'present' | 'absent' | 'late' | 'excused';
      participation_mode?: 'physical' | 'online' | null;
      remarks?: string | null;
    }>,
  ) {
    const teacher = await this.resolveTeacherOrThrow(orgId, userId);
    const existing = await ClassroomRepository.findRawSessionOwnedByTeacher(
      orgId,
      teacher.staff_id,
      sessionId,
    );
    if (!existing) {
      const existsInOrg = await ClassroomRepository.findSessionByIdInOrg(orgId, sessionId);
      if (existsInOrg) {
        throw new ClassroomForbiddenError('Only the assigned teacher can mark attendance.');
      }
      throw new ClassroomNotFoundError('Classroom session not found.');
    }

    if (existing.session_status !== 'in_progress') {
      throw new ClassroomConflictError(
        `Attendance can only be marked or updated while the session is 'in_progress' (current status: '${existing.session_status}').`,
        'ATTENDANCE_SESSION_NOT_LIVE',
      );
    }

    const roster = await ClassroomRepository.getSessionRosterWithAttendance(
      orgId,
      sessionId,
      existing.section_id,
      existing.academic_year_grade_id,
      existing.session_date,
    );
    const rosterByStudent = new Map(roster.map((r) => [r.student_id, r]));

    const normalizedRecords = records.map((rec) => {
      const rosterRow = rosterByStudent.get(rec.student_id);
      if (!rosterRow) {
        throw new ClassroomValidationError(
          `Student '${rec.student_id}' is not actively enrolled in this section for ${existing.session_date}.`,
        );
      }
      if (rec.enrollment_id && rec.enrollment_id !== rosterRow.enrollment_id) {
        throw new ClassroomValidationError(
          `Enrollment ID mismatch for student '${rec.student_id}'.`,
        );
      }

      const mode =
        rec.attendance_status === 'present' || rec.attendance_status === 'late'
          ? rec.participation_mode || null
          : null;

      if ((rec.attendance_status === 'present' || rec.attendance_status === 'late') && !mode) {
        throw new ClassroomValidationError(
          `participation_mode is required for '${rec.attendance_status}' attendance.`,
        );
      }

      if (mode && existing.delivery_mode === 'physical' && mode !== 'physical') {
        throw new ClassroomValidationError(
          'Physical classroom sessions only permit physical participation_mode.',
        );
      }
      if (mode && existing.delivery_mode === 'online' && mode !== 'online') {
        throw new ClassroomValidationError(
          'Online classroom sessions only permit online participation_mode.',
        );
      }

      return {
        student_id: rec.student_id,
        enrollment_id: rosterRow.enrollment_id,
        attendance_status: rec.attendance_status,
        participation_mode: mode,
        remarks: rec.remarks?.trim() || null,
      };
    });

    let updatedCount = 0;
    try {
      updatedCount = await ClassroomRepository.upsertAttendanceBatch({
        orgId,
        sessionId,
        actorUserId: userId,
        records: normalizedRecords,
      });
    } catch (err) {
      translatePgClassroomError(err);
    }

    const detail = await this.getTeacherSessionDetail(orgId, userId, sessionId);
    await dispatchClassroomRealtimeAndNotifications({
      orgId,
      eventType: ClassroomEventType.ATTENDANCE_UPDATED,
      session: detail.session,
      specificStudentIds: normalizedRecords.map((r) => r.student_id),
    });

    return {
      updated_count: updatedCount,
      ...detail,
    };
  }

  static async getTeacherSessionAudit(
    orgId: string,
    userId: string,
    sessionId: string,
    query: {
      entity_type?: 'classroom_session' | 'session_attendance';
      page: number;
      limit: number;
    },
  ) {
    const teacher = await this.resolveTeacherOrThrow(orgId, userId);
    const owned = await ClassroomRepository.findRawSessionOwnedByTeacher(
      orgId,
      teacher.staff_id,
      sessionId,
    );
    if (!owned) {
      const existsInOrg = await ClassroomRepository.findSessionByIdInOrg(orgId, sessionId);
      if (existsInOrg) throw new ClassroomForbiddenError('You do not own this classroom session.');
      throw new ClassroomNotFoundError('Classroom session not found.');
    }

    const result = await ClassroomRepository.listSessionAuditHistory(orgId, sessionId, query);
    return {
      ...result,
      page: query.page,
      limit: query.limit,
      total_pages: Math.max(1, Math.ceil(result.total / query.limit)),
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ADMIN OVERSIGHT & TIMETABLE GENERATION
  // ──────────────────────────────────────────────────────────────────────────

  static async generateAdminSessionsFromTimetable(
    orgId: string,
    payload: { academic_year_id: string; start_date: string; end_date: string },
  ) {
    try {
      const createdCount = await ClassroomRepository.generateSessionsFromTimetable(
        orgId,
        payload.academic_year_id,
        payload.start_date,
        payload.end_date,
      );
      if (createdCount < 0) {
        throw new ClassroomNotFoundError('Academic year not found in this institution.');
      }
      return {
        academic_year_id: payload.academic_year_id,
        start_date: payload.start_date,
        end_date: payload.end_date,
        created_count: createdCount,
      };
    } catch (err) {
      translatePgClassroomError(err);
    }
  }

  static async listAdminSessions(orgId: string, filters: SessionListFilters) {
    const result = await ClassroomRepository.listAdminSessions(orgId, filters);
    return {
      ...result,
      page: filters.page,
      limit: filters.limit,
      total_pages: Math.max(1, Math.ceil(result.total / filters.limit)),
    };
  }

  static async getAdminAcademicYears(orgId: string) {
    return ClassroomRepository.listAdminAcademicYears(orgId);
  }

  static async getAdminSessionAudit(
    orgId: string,
    sessionId: string,
    query: {
      entity_type?: 'classroom_session' | 'session_attendance';
      page: number;
      limit: number;
    },
  ) {
    const exists = await ClassroomRepository.findSessionByIdInOrg(orgId, sessionId);
    if (!exists) {
      throw new ClassroomNotFoundError('Classroom session not found in this institution.');
    }
    const result = await ClassroomRepository.listSessionAuditHistory(orgId, sessionId, query);
    return {
      ...result,
      page: query.page,
      limit: query.limit,
      total_pages: Math.max(1, Math.ceil(result.total / query.limit)),
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STUDENT OPERATIONS
  // ──────────────────────────────────────────────────────────────────────────

  static async resolveStudentOrThrow(orgId: string, userId: string): Promise<StudentContextRow> {
    const student = await ClassroomRepository.findStudentByUserId(orgId, userId);
    if (!student) {
      throw new ClassroomForbiddenError(
        'No student profile is linked to your user account in this institution.',
      );
    }
    return student;
  }

  static async getStudentOverview(orgId: string, userId: string) {
    const student = await this.resolveStudentOrThrow(orgId, userId);
    const [sessionsRes, attendanceRes, subjects] = await Promise.all([
      ClassroomRepository.listStudentOrParentSessions({
        orgId,
        studentId: student.student_id,
        filters: { view: 'upcoming', page: 1, limit: 10 },
        exposeMeetingUrlWhenJoinable: true,
      }),
      ClassroomRepository.getStudentAttendanceOverviewAndHistory(orgId, student.student_id, {
        page: 1,
        limit: 5,
      }),
      ClassroomRepository.getStudentEnrolledSubjects(orgId, student.student_id),
    ]);

    return {
      student: {
        student_id: student.student_id,
        full_name: student.full_name,
        admission_no: student.admission_no,
        grade_name: student.grade_name,
        section_id: student.section_id,
        section_name: student.section_name,
        academic_year_name: student.academic_year_name,
      },
      attendance_summary: attendanceRes.summary,
      upcoming_sessions: sessionsRes.items,
      classes: subjects,
    };
  }

  static async getStudentClasses(orgId: string, userId: string) {
    const student = await this.resolveStudentOrThrow(orgId, userId);
    return ClassroomRepository.getStudentEnrolledSubjects(orgId, student.student_id);
  }

  static async listStudentSessions(orgId: string, userId: string, filters: SessionListFilters) {
    const student = await this.resolveStudentOrThrow(orgId, userId);
    const res = await ClassroomRepository.listStudentOrParentSessions({
      orgId,
      studentId: student.student_id,
      filters,
      exposeMeetingUrlWhenJoinable: true,
    });
    return {
      ...res,
      page: filters.page,
      limit: filters.limit,
      total_pages: Math.max(1, Math.ceil(res.total / filters.limit)),
    };
  }

  static async getStudentSessionDetail(orgId: string, userId: string, sessionId: string) {
    const student = await this.resolveStudentOrThrow(orgId, userId);
    const session = await ClassroomRepository.findSessionByIdInOrg(orgId, sessionId);
    if (!session) {
      throw new ClassroomNotFoundError('Classroom session not found.');
    }

    const enrollment = await ClassroomRepository.verifyStudentEnrollmentForSession(
      orgId,
      student.student_id,
      session.section_id,
      session.academic_year_grade_id,
      session.session_date,
    );
    if (!enrollment) {
      throw new ClassroomForbiddenError('You are not actively enrolled in this class section.');
    }

    const res = await ClassroomRepository.listStudentOrParentSessions({
      orgId,
      studentId: student.student_id,
      filters: {
        view: 'all',
        page: 1,
        limit: 50,
        date_from: session.session_date,
        date_to: session.session_date,
      },
      exposeMeetingUrlWhenJoinable: true,
    });
    const matched =
      res.items.find((s) => s.session_id === sessionId) ||
      (await ClassroomRepository.getSessionDtoById(
        orgId,
        sessionId,
        session.session_status === 'in_progress' && session.delivery_mode !== 'physical',
      ));

    if (matched && matched.lesson_plan_id && !matched.flipped_preparation) {
      matched.flipped_preparation = await ClassroomRepository.getFlippedPreparation(
        orgId,
        matched.lesson_plan_id,
        matched.section_id,
        `${matched.session_date} ${matched.scheduled_start_time}`,
      );
    }

    return matched!;
  }

  static async joinStudentSession(orgId: string, userId: string, sessionId: string) {
    const student = await this.resolveStudentOrThrow(orgId, userId);
    const session = await ClassroomRepository.findSessionByIdInOrg(orgId, sessionId);
    if (!session) {
      throw new ClassroomNotFoundError('Classroom session not found.');
    }

    const enrollment = await ClassroomRepository.verifyStudentEnrollmentForSession(
      orgId,
      student.student_id,
      session.section_id,
      session.academic_year_grade_id,
      session.session_date,
    );
    if (!enrollment) {
      throw new ClassroomForbiddenError(
        'Access denied: you are not actively enrolled in this session section.',
      );
    }

    if (session.session_status !== 'in_progress') {
      throw new ClassroomConflictError(
        `Session cannot be joined when status is '${session.session_status}'.`,
        'SESSION_NOT_JOINABLE',
      );
    }

    if (session.delivery_mode === 'physical') {
      throw new ClassroomConflictError(
        'Physical classroom sessions do not have an online meeting link to join.',
        'PHYSICAL_SESSION_NO_ONLINE_JOIN',
      );
    }

    if (!session.meeting_url || !session.meeting_url.trim()) {
      throw new ClassroomConflictError(
        'This online/hybrid session does not have a valid meeting link configured yet.',
        'MISSING_MEETING_URL',
      );
    }

    if (!session.teacher_user_id) {
      throw new ClassroomConflictError(
        'Assigned teacher user account is missing for attendance verification.',
        'TEACHER_USER_UNLINKED',
      );
    }

    let joinResult: { inserted: boolean; attendance: any };
    try {
      joinResult = await ClassroomRepository.recordIdempotentOnlineStudentJoin({
        orgId,
        sessionId,
        studentId: student.student_id,
        enrollmentId: enrollment.enrollment_id,
        assignedTeacherUserId: session.teacher_user_id,
      });
    } catch (err) {
      translatePgClassroomError(err);
    }

    const dto = await ClassroomRepository.getSessionDtoById(orgId, sessionId, true);
    if (joinResult.inserted && dto) {
      await dispatchClassroomRealtimeAndNotifications({
        orgId,
        eventType: ClassroomEventType.ATTENDANCE_UPDATED,
        session: dto,
        specificStudentIds: [student.student_id],
        notifyTeacher: true,
      });
    }

    return {
      session_id: sessionId,
      meeting_url: session.meeting_url,
      attendance: joinResult.attendance,
      already_recorded: !joinResult.inserted,
    };
  }

  static async getStudentAttendance(
    orgId: string,
    userId: string,
    filters: { date_from?: string; date_to?: string; page: number; limit: number },
  ) {
    const student = await this.resolveStudentOrThrow(orgId, userId);
    const res = await ClassroomRepository.getStudentAttendanceOverviewAndHistory(
      orgId,
      student.student_id,
      filters,
    );
    return {
      ...res,
      page: filters.page,
      limit: filters.limit,
      total_pages: Math.max(1, Math.ceil(res.total / filters.limit)),
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PARENT READ-ONLY OPERATIONS
  // ──────────────────────────────────────────────────────────────────────────

  static async resolveParentChildOrThrow(
    orgId: string,
    userId: string,
    email: string | null,
    childStudentId: string,
  ): Promise<StudentContextRow> {
    const linkedChild = await ClassroomRepository.verifyParentChildOwnership(
      orgId,
      userId,
      email,
      childStudentId,
    );
    if (!linkedChild) {
      throw new ClassroomForbiddenError(
        'Forbidden: Child does not belong to this parent account or organization.',
      );
    }
    return linkedChild;
  }

  static async getParentChildOverview(
    orgId: string,
    userId: string,
    email: string | null,
    childId: string,
  ) {
    const child = await this.resolveParentChildOrThrow(orgId, userId, email, childId);
    const [sessionsRes, attendanceRes] = await Promise.all([
      ClassroomRepository.listStudentOrParentSessions({
        orgId,
        studentId: child.student_id,
        filters: { view: 'upcoming', page: 1, limit: 10 },
        exposeMeetingUrlWhenJoinable: false,
      }),
      ClassroomRepository.getStudentAttendanceOverviewAndHistory(orgId, child.student_id, {
        page: 1,
        limit: 5,
      }),
    ]);

    return {
      child: {
        student_id: child.student_id,
        full_name: child.full_name,
        admission_no: child.admission_no,
        grade_name: child.grade_name,
        section_id: child.section_id,
        section_name: child.section_name,
        academic_year_name: child.academic_year_name,
      },
      attendance_summary: attendanceRes.summary,
      upcoming_sessions: sessionsRes.items,
    };
  }

  static async listParentChildSessions(
    orgId: string,
    userId: string,
    email: string | null,
    childId: string,
    filters: SessionListFilters,
  ) {
    const child = await this.resolveParentChildOrThrow(orgId, userId, email, childId);
    const res = await ClassroomRepository.listStudentOrParentSessions({
      orgId,
      studentId: child.student_id,
      filters,
      exposeMeetingUrlWhenJoinable: false,
    });
    return {
      ...res,
      page: filters.page,
      limit: filters.limit,
      total_pages: Math.max(1, Math.ceil(res.total / filters.limit)),
    };
  }

  static async getParentChildAttendance(
    orgId: string,
    userId: string,
    email: string | null,
    childId: string,
    filters: { date_from?: string; date_to?: string; page: number; limit: number },
  ) {
    const child = await this.resolveParentChildOrThrow(orgId, userId, email, childId);
    const res = await ClassroomRepository.getStudentAttendanceOverviewAndHistory(
      orgId,
      child.student_id,
      filters,
    );
    return {
      ...res,
      page: filters.page,
      limit: filters.limit,
      total_pages: Math.max(1, Math.ceil(res.total / filters.limit)),
    };
  }

  static async getStudentFlippedPreparations(orgId: string, userId: string) {
    const student = await this.resolveStudentOrThrow(orgId, userId);
    return ClassroomRepository.listStudentFlippedSessions(orgId, student.student_id);
  }

  static async createTeacherFlippedPreparation(orgId: string, userId: string, payload: any) {
    const teacher = await this.resolveTeacherOrThrow(orgId, userId);
    const resources =
      payload.resource_ids && payload.resource_ids.length > 0
        ? payload.resource_ids
        : payload.resources || [];
    const outcomes =
      payload.outcomes && payload.outcomes.length > 0
        ? payload.outcomes
        : payload.learning_outcomes || [];
    const preparationQuestions =
      payload.preparation_questions && payload.preparation_questions.length > 0
        ? payload.preparation_questions
        : payload.questions || [];
    const inClassActivities = payload.in_class_activities || [];

    const lessonPlanId = await ClassroomRepository.createFlippedLessonPlan({
      orgId,
      curriculumUnitId: payload.curriculum_unit_id,
      teacherStaffId: teacher.staff_id,
      lessonTitle: payload.lesson_title,
      lessonSummary: payload.lesson_summary,
      prerequisiteKnowledge: payload.prerequisite_knowledge,
      plannedDate: payload.planned_date,
      durationMinutes: payload.duration_minutes,
      actorUserId: userId,
      resources,
      outcomes,
      preparationQuestions,
      inClassActivities,
    });
    return ClassroomRepository.getFlippedPreparation(orgId, lessonPlanId);
  }

  static async getTeacherFlippedPreparationDetail(
    orgId: string,
    userId: string,
    lessonPlanId: string,
  ) {
    await this.resolveTeacherOrThrow(orgId, userId);
    const prep = await ClassroomRepository.getFlippedPreparation(orgId, lessonPlanId);
    if (!prep) {
      throw new ClassroomNotFoundError('Flipped classroom preparation plan not found.');
    }
    return prep;
  }
}
