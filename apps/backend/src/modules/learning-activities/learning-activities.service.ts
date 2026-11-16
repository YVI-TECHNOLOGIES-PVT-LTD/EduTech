import { randomUUID } from 'crypto';
import prisma from '../../lib/prismaClient';
import { env } from '../../config/env';
import {
  MAX_SUBMISSION_FILE_BYTES,
  validateLearningActivityFileBufferSignature,
} from './learning-activities.upload';
import { StorageService } from '../../services/storage.service';
import { EventBus } from '../../workflows/event-bus.service';
import { logger } from '../../utils/logger';
import {
  notification_category,
  notification_priority,
} from '../notifications/dto/notification.dto';
import { realtimeNotificationServer } from '../notifications/realtime/notification.realtime';
import { NotificationService } from '../notifications/services/notification.service';
import {
  ActivityListFilters,
  LearningActivitiesRepository,
  TeacherSubmissionFilters,
  serializeActivityInstructions,
} from './learning-activities.repository';
import {
  LearningActivityConflictError,
  LearningActivityDto,
  LearningActivityError,
  LearningActivityEventName,
  LearningActivityForbiddenError,
  LearningActivityNotFoundError,
  LearningActivityType,
  LearningActivityValidationError,
  LearningReviewDecision,
  LearningSubmissionDto,
} from './learning-activities.types';

const DEFAULT_SUBMISSION_BUCKET = env.SUPABASE_ADMISSION_DOCUMENTS_BUCKET || 'admission-documents';
const MAX_SUBMISSION_FILES = 5;

function translatePgLearningError(err: any): never {
  if (err instanceof LearningActivityError) throw err;

  const rawMsg = String(err?.meta?.message || err?.message || '');
  const pgCode = String(err?.meta?.code || err?.code || '');

  if (pgCode === '42703' && rawMsg.includes('column s.org_id does not exist')) {
    throw new LearningActivityError(
      'Frozen PostgreSQL trigger defect in s32_validate_activity(): references non-existent column sections.org_id (must join academic_year_grades -> academic_years.org_id). DBA remediation required.',
      503,
      'DATABASE_TRIGGER_DEFECT',
      { pgCode, triggerFunction: 'public.s32_validate_activity' },
    );
  }

  if (
    rawMsg.includes('Only the assigned subject teacher') ||
    rawMsg.includes('Linked lesson plan must match') ||
    rawMsg.includes('Activity creator is inactive') ||
    rawMsg.includes('Student does not have an active enrollment')
  ) {
    throw new LearningActivityForbiddenError(rawMsg);
  }

  if (
    rawMsg.includes('Activity not found') ||
    rawMsg.includes('Submission not found') ||
    rawMsg.includes('Faculty assignment not found')
  ) {
    throw new LearningActivityNotFoundError(rawMsg);
  }

  if (
    pgCode === '23505' ||
    rawMsg.includes('uq_s32_') ||
    rawMsg.includes('Published activities cannot return to draft') ||
    rawMsg.includes('Reopening a closed activity requires') ||
    rawMsg.includes('A teacher must authorize resubmission') ||
    rawMsg.includes('Attempt number must be the next sequential attempt') ||
    rawMsg.includes('Maximum 5 files are allowed') ||
    rawMsg.includes('immutable')
  ) {
    throw new LearningActivityConflictError(rawMsg || 'Learning activity state conflict');
  }

  if (
    pgCode === '23514' ||
    rawMsg.includes('ck_s32_') ||
    rawMsg.includes('Digital submissions are only permitted for project activities') ||
    rawMsg.includes('Submission reviews are only permitted for project activities') ||
    rawMsg.includes('Submission files are only allowed for project activities') ||
    rawMsg.includes('Submission must contain text or at least one uploaded file') ||
    rawMsg.includes('Due date has passed') ||
    rawMsg.includes('Activity is closed') ||
    rawMsg.includes('Marks are disabled or exceed') ||
    rawMsg.includes('Resubmission request requires') ||
    rawMsg.includes('Faculty assignment was not effective') ||
    rawMsg.includes('Faculty assignment must be active')
  ) {
    throw new LearningActivityValidationError(rawMsg || 'Learning activity validation error');
  }

  throw err;
}

function buildNotificationDescriptor(
  eventType: LearningActivityEventName,
  title: string,
  subjectName: string,
  sectionName: string,
  extra?: {
    activityType?: LearningActivityType;
    dueAt?: string;
    studentName?: string;
    obtainedMarks?: number | null;
    maximumMarks?: number | null;
  },
): {
  category: notification_category;
  priority: notification_priority;
  title: string;
  message: string;
} {
  switch (eventType) {
    case 'learning_activity.published':
      return {
        category: notification_category.SYSTEM,
        priority: notification_priority.NORMAL,
        title: `New ${extra?.activityType === 'project' ? 'Project' : 'Homework'}: ${title}`,
        message: `${subjectName} (${sectionName}) published "${title}". Due ${extra?.dueAt ? new Date(extra.dueAt).toLocaleString() : 'soon'}.`,
      };
    case 'learning_activity.updated':
      return {
        category: notification_category.SYSTEM,
        priority: notification_priority.NORMAL,
        title: `Activity Updated: ${title}`,
        message: `Details or deadline for "${title}" in ${subjectName} (${sectionName}) have been updated.`,
      };
    case 'learning_activity.closed':
      return {
        category: notification_category.SYSTEM,
        priority: notification_priority.LOW,
        title: `Activity Closed: ${title}`,
        message: `"${title}" in ${subjectName} (${sectionName}) is now closed.`,
      };
    case 'learning_submission.created':
      return {
        category: notification_category.SYSTEM,
        priority: notification_priority.NORMAL,
        title: `Project Submission Received`,
        message: `${extra?.studentName || 'A student'} submitted "${title}" in ${subjectName} (${sectionName}).`,
      };
    case 'learning_submission.resubmission_requested':
      return {
        category: notification_category.SYSTEM,
        priority: notification_priority.HIGH,
        title: `Resubmission Requested: ${title}`,
        message: `Your teacher requested a resubmission for "${title}" in ${subjectName}.`,
      };
    case 'learning_submission.reviewed':
      return {
        category: notification_category.EXAM,
        priority: notification_priority.NORMAL,
        title: `Submission Reviewed: ${title}`,
        message:
          extra?.obtainedMarks !== null && extra?.obtainedMarks !== undefined
            ? `Teacher reviewed "${title}" (${subjectName}) — Score: ${extra.obtainedMarks}${extra.maximumMarks ? `/${extra.maximumMarks}` : ''}.`
            : `Teacher reviewed "${title}" in ${subjectName}.`,
      };
  }
}

async function dispatchLearningActivityNotifications(input: {
  orgId: string;
  eventType: LearningActivityEventName;
  activityId: string;
  submissionId?: string;
  specificStudentIds?: string[];
  notifyTeacher?: boolean;
  notifyStudentsAndParents?: boolean;
  extra?: {
    studentName?: string;
    submissionStatus?: string;
    reviewDecision?: LearningReviewDecision;
    obtainedMarks?: number | null;
    maximumMarks?: number | null;
  };
}) {
  try {
    const audience = await LearningActivitiesRepository.getActivityAudienceUsers(
      input.orgId,
      input.activityId,
      input.specificStudentIds,
    );
    if (!audience) return;

    // Redacted payload: NEVER expose storage_path, bucket, or signed URLs in notifications/WS
    const redactedPayload = {
      activity_id: input.activityId,
      submission_id: input.submissionId || null,
      activity_type: audience.activityType,
      title: audience.title,
      subject_name: audience.subjectName,
      section_name: audience.sectionName,
      due_at: audience.dueAt,
      submission_status: input.extra?.submissionStatus || null,
      review_decision: input.extra?.reviewDecision || null,
      obtained_marks: input.extra?.obtainedMarks ?? null,
    };

    try {
      await EventBus.publish(input.eventType, {
        orgId: input.orgId,
        ...redactedPayload,
      });
    } catch (busErr: any) {
      logger.warn(`[LearningActivities] EventBus publish warning: ${busErr?.message || busErr}`);
    }

    const wsUserIds = new Set<string>();
    if (input.notifyStudentsAndParents) {
      audience.studentUserIds.forEach((id) => wsUserIds.add(id));
      audience.parentUserIds.forEach((id) => wsUserIds.add(id));
    }
    if (input.notifyTeacher && audience.teacherUserId) {
      wsUserIds.add(audience.teacherUserId);
    }

    for (const userId of wsUserIds) {
      try {
        realtimeNotificationServer.sendToUser(input.orgId, userId, {
          type: input.eventType,
          data: redactedPayload,
        });
      } catch (wsErr: any) {
        logger.warn(`[LearningActivities] WebSocket dispatch warning: ${wsErr?.message || wsErr}`);
      }
    }

    const descriptor = buildNotificationDescriptor(
      input.eventType,
      audience.title,
      audience.subjectName,
      audience.sectionName,
      {
        activityType: audience.activityType,
        dueAt: audience.dueAt,
        studentName: input.extra?.studentName,
        obtainedMarks: input.extra?.obtainedMarks,
        maximumMarks: input.extra?.maximumMarks,
      },
    );

    const bulkDtos: any[] = [];
    if (input.notifyStudentsAndParents) {
      for (const studentUserId of audience.studentUserIds) {
        bulkDtos.push({
          recipient_user_id: studentUserId,
          category: descriptor.category,
          type: input.eventType,
          priority: descriptor.priority,
          title: descriptor.title,
          message: descriptor.message,
          entity_type: input.submissionId ? 'learning_activity_submission' : 'learning_activity',
          entity_id: input.submissionId || input.activityId,
          action_url: '/app/student/learning-activities',
          metadata: redactedPayload,
        });
      }
      for (const parentUserId of audience.parentUserIds) {
        bulkDtos.push({
          recipient_user_id: parentUserId,
          category: descriptor.category,
          type: input.eventType,
          priority: descriptor.priority,
          title: descriptor.title,
          message: descriptor.message,
          entity_type: input.submissionId ? 'learning_activity_submission' : 'learning_activity',
          entity_id: input.submissionId || input.activityId,
          action_url: '/app/parent/learning-activities',
          metadata: redactedPayload,
        });
      }
    }

    if (input.notifyTeacher && audience.teacherUserId) {
      bulkDtos.push({
        recipient_user_id: audience.teacherUserId,
        category: descriptor.category,
        type: input.eventType,
        priority: descriptor.priority,
        title: descriptor.title,
        message: descriptor.message,
        entity_type: input.submissionId ? 'learning_activity_submission' : 'learning_activity',
        entity_id: input.submissionId || input.activityId,
        action_url: '/app/teacher/learning-activities',
        metadata: redactedPayload,
      });
    }

    if (bulkDtos.length > 0) {
      await NotificationService.sendBulkNotifications(input.orgId, bulkDtos);
    }
  } catch (err: any) {
    logger.warn(`[LearningActivities] Non-blocking notification error: ${err?.message || err}`);
  }
}

export class LearningActivitiesService {
  // ─── TEACHER WORKSPACE ───────────────────────────────────────────────────

  private static async requireTeacherStaff(orgId: string, userId: string) {
    const staff = await LearningActivitiesRepository.getTeacherStaffByUserId(orgId, userId);
    if (!staff) {
      throw new LearningActivityForbiddenError(
        'No active teacher/staff profile found for this account in the current organization.',
      );
    }
    return staff;
  }

  static async getTeacherOverview(orgId: string, userId: string) {
    const staff = await this.requireTeacherStaff(orgId, userId);
    return LearningActivitiesRepository.getTeacherOverview(orgId, staff.staff_id);
  }

  static async getTeacherAssignments(orgId: string, userId: string) {
    const staff = await this.requireTeacherStaff(orgId, userId);
    return LearningActivitiesRepository.getTeacherAssignments(orgId, staff.staff_id);
  }

  static async listTeacherActivities(orgId: string, userId: string, filters: ActivityListFilters) {
    const staff = await this.requireTeacherStaff(orgId, userId);
    return LearningActivitiesRepository.listActivities({
      orgId,
      staffId: staff.staff_id,
      filters,
    });
  }

  static async createTeacherActivity(
    orgId: string,
    userId: string,
    input: {
      faculty_assignment_id: string;
      lesson_plan_id?: string | null;
      activity_type: LearningActivityType;
      title: string;
      instructions: string;
      assigned_at?: string;
      due_at: string;
      late_submission_authorized_until?: string | null;
      grading_enabled: boolean;
      maximum_marks?: number | null;
      publish_immediately?: boolean;
    },
  ): Promise<LearningActivityDto> {
    const staff = await this.requireTeacherStaff(orgId, userId);
    const assignment = await LearningActivitiesRepository.getFacultyAssignmentContext(
      orgId,
      input.faculty_assignment_id,
    );
    if (!assignment) {
      throw new LearningActivityNotFoundError('Faculty assignment not found in this organization.');
    }
    if (assignment.staff_id !== staff.staff_id) {
      throw new LearningActivityForbiddenError(
        'Only the assigned subject teacher can create activities for this section.',
      );
    }
    if (!assignment.is_active) {
      throw new LearningActivityValidationError(
        'Selected faculty assignment is inactive and cannot receive new activities.',
      );
    }

    const assignedAt = input.assigned_at ? new Date(input.assigned_at) : new Date();
    const dueAt = new Date(input.due_at);
    const lateUntil = input.late_submission_authorized_until
      ? new Date(input.late_submission_authorized_until)
      : null;

    const instructions = serializeActivityInstructions({
      instructions: input.instructions,
      activity_subtype: (input as any).activity_subtype,
      coding_lab_config: (input as any).coding_lab_config,
      quiz_config: (input as any).quiz_config,
      peer_learning_config: (input as any).peer_learning_config,
      collaborative_config: (input as any).collaborative_config,
    });

    let activityId: string;
    try {
      activityId = await prisma.$transaction(async (tx) => {
        const createdId = await LearningActivitiesRepository.createActivityDraft(tx, {
          orgId,
          facultyAssignmentId: assignment.faculty_assignment_id,
          sectionId: assignment.section_id,
          academicYearGradeSubjectId: assignment.academic_year_grade_subject_id,
          createdByStaffId: staff.staff_id,
          lessonPlanId: input.lesson_plan_id ?? null,
          activityType: input.activity_type,
          title: input.title,
          instructions,
          assignedAt,
          dueAt,
          lateSubmissionAuthorizedUntil: lateUntil,
          gradingEnabled: input.grading_enabled,
          maximumMarks: input.grading_enabled ? Number(input.maximum_marks) : null,
        });

        if (input.publish_immediately) {
          await LearningActivitiesRepository.setActivityPublished(tx, orgId, createdId);
        }

        return createdId;
      });
    } catch (err) {
      translatePgLearningError(err);
    }

    const created = await LearningActivitiesRepository.getActivityByIdScoped(orgId, activityId);
    if (!created) {
      throw new LearningActivityNotFoundError('Created activity could not be reloaded.');
    }

    if (created.activity_status === 'published') {
      await dispatchLearningActivityNotifications({
        orgId,
        eventType: 'learning_activity.published',
        activityId: created.activity_id,
        notifyStudentsAndParents: true,
      });
    }

    return created;
  }

  private static async requireOwnedTeacherActivity(
    orgId: string,
    userId: string,
    activityId: string,
  ) {
    const staff = await this.requireTeacherStaff(orgId, userId);
    const activity = await LearningActivitiesRepository.getActivityByIdScoped(orgId, activityId);
    if (!activity) {
      throw new LearningActivityNotFoundError('Learning activity not found in this organization.');
    }
    if (activity.created_by_staff_id !== staff.staff_id) {
      throw new LearningActivityForbiddenError(
        'Only the assigned subject teacher who created this activity may manage it.',
      );
    }
    return { staff, activity };
  }

  static async getTeacherActivityDetail(orgId: string, userId: string, activityId: string) {
    const { activity } = await this.requireOwnedTeacherActivity(orgId, userId, activityId);
    const submissions = await LearningActivitiesRepository.listActivitySubmissionsForTeacher({
      orgId,
      staffId: activity.created_by_staff_id,
      filters: { activity_id: activityId, page: 1, limit: 100 },
    });
    return { activity, submissions: submissions.items };
  }

  static async updateTeacherActivity(
    orgId: string,
    userId: string,
    activityId: string,
    patch: {
      lesson_plan_id?: string | null;
      activity_type?: LearningActivityType;
      title?: string;
      instructions?: string;
      assigned_at?: string;
      due_at?: string;
      late_submission_authorized_until?: string | null;
      grading_enabled?: boolean;
      maximum_marks?: number | null;
    },
  ): Promise<LearningActivityDto> {
    const { activity } = await this.requireOwnedTeacherActivity(orgId, userId, activityId);

    if (
      patch.activity_type &&
      patch.activity_type !== activity.activity_type &&
      activity.submitted_students_count > 0
    ) {
      throw new LearningActivityConflictError(
        'Cannot change activity type after students have submitted attempts.',
      );
    }

    const nextAssignedAt = patch.assigned_at
      ? new Date(patch.assigned_at)
      : new Date(activity.assigned_at);
    const nextDueAt = patch.due_at ? new Date(patch.due_at) : new Date(activity.due_at);
    if (nextDueAt.getTime() <= nextAssignedAt.getTime()) {
      throw new LearningActivityValidationError(
        'Due date & time must be strictly after assigned date & time.',
      );
    }

    const nextLateUntil =
      patch.late_submission_authorized_until !== undefined
        ? patch.late_submission_authorized_until
          ? new Date(patch.late_submission_authorized_until)
          : null
        : activity.late_submission_authorized_until
          ? new Date(activity.late_submission_authorized_until)
          : null;

    if (nextLateUntil && nextLateUntil.getTime() <= nextDueAt.getTime()) {
      throw new LearningActivityValidationError(
        'Late submission authorization deadline must be strictly after due_at.',
      );
    }

    const nextGrading =
      patch.grading_enabled !== undefined ? patch.grading_enabled : activity.grading_enabled;
    const nextMaxMarks = nextGrading
      ? patch.maximum_marks !== undefined
        ? Number(patch.maximum_marks)
        : activity.maximum_marks
      : null;

    if (nextGrading && (!nextMaxMarks || nextMaxMarks <= 0)) {
      throw new LearningActivityValidationError(
        'Maximum marks (> 0) is required when grading is enabled.',
      );
    }

    try {
      await prisma.$transaction(async (tx) => {
        await LearningActivitiesRepository.updateActivityRow(tx, {
          orgId,
          activityId,
          lessonPlanId:
            patch.lesson_plan_id !== undefined ? patch.lesson_plan_id : activity.lesson_plan_id,
          activityType: patch.activity_type ?? activity.activity_type,
          title: patch.title ?? activity.title,
          instructions: patch.instructions ?? activity.instructions,
          assignedAt: nextAssignedAt,
          dueAt: nextDueAt,
          lateSubmissionAuthorizedUntil: nextLateUntil,
          gradingEnabled: nextGrading,
          maximumMarks: nextMaxMarks,
        });
      });
    } catch (err) {
      translatePgLearningError(err);
    }

    const updated = await LearningActivitiesRepository.getActivityByIdScoped(orgId, activityId);
    if (!updated) throw new LearningActivityNotFoundError('Activity not found.');

    if (updated.activity_status === 'published') {
      await dispatchLearningActivityNotifications({
        orgId,
        eventType: 'learning_activity.updated',
        activityId,
        notifyStudentsAndParents: true,
      });
    }

    return updated;
  }

  static async publishTeacherActivity(orgId: string, userId: string, activityId: string) {
    const { activity } = await this.requireOwnedTeacherActivity(orgId, userId, activityId);
    if (activity.activity_status === 'published') {
      return activity;
    }

    try {
      await prisma.$transaction(async (tx) => {
        await LearningActivitiesRepository.setActivityPublished(tx, orgId, activityId);
      });
    } catch (err) {
      translatePgLearningError(err);
    }

    const updated = await LearningActivitiesRepository.getActivityByIdScoped(orgId, activityId);
    if (!updated) throw new LearningActivityNotFoundError('Activity not found.');

    await dispatchLearningActivityNotifications({
      orgId,
      eventType: 'learning_activity.published',
      activityId,
      notifyStudentsAndParents: true,
    });

    return updated;
  }

  static async closeTeacherActivity(
    orgId: string,
    userId: string,
    activityId: string,
    closureReason?: string | null,
  ) {
    const { activity } = await this.requireOwnedTeacherActivity(orgId, userId, activityId);
    if (activity.activity_status === 'draft') {
      throw new LearningActivityConflictError('Draft activities must be published before closing.');
    }

    try {
      await prisma.$transaction(async (tx) => {
        await LearningActivitiesRepository.setActivityClosed(
          tx,
          orgId,
          activityId,
          closureReason || null,
        );
      });
    } catch (err) {
      translatePgLearningError(err);
    }

    const updated = await LearningActivitiesRepository.getActivityByIdScoped(orgId, activityId);
    if (!updated) throw new LearningActivityNotFoundError('Activity not found.');

    await dispatchLearningActivityNotifications({
      orgId,
      eventType: 'learning_activity.closed',
      activityId,
      notifyStudentsAndParents: true,
    });

    return updated;
  }

  static async extendTeacherLateSubmission(
    orgId: string,
    userId: string,
    activityId: string,
    lateUntilIso: string | null,
  ) {
    const { activity } = await this.requireOwnedTeacherActivity(orgId, userId, activityId);
    const lateUntil = lateUntilIso ? new Date(lateUntilIso) : null;
    if (lateUntil && lateUntil.getTime() <= Date.parse(activity.due_at)) {
      throw new LearningActivityValidationError(
        'Late submission authorization deadline must be after due_at.',
      );
    }

    try {
      await prisma.$transaction(async (tx) => {
        await LearningActivitiesRepository.setActivityLateAuthorization(
          tx,
          orgId,
          activityId,
          lateUntil,
        );
      });
    } catch (err) {
      translatePgLearningError(err);
    }

    const updated = await LearningActivitiesRepository.getActivityByIdScoped(orgId, activityId);
    if (!updated) throw new LearningActivityNotFoundError('Activity not found.');

    if (updated.activity_status !== 'draft') {
      await dispatchLearningActivityNotifications({
        orgId,
        eventType: 'learning_activity.updated',
        activityId,
        notifyStudentsAndParents: true,
      });
    }

    return updated;
  }

  static async closeDueActivitiesForTeacher(orgId: string, userId: string) {
    const staff = await this.requireTeacherStaff(orgId, userId);
    const closedCount = await LearningActivitiesRepository.closeDueActivitiesInOrg(
      orgId,
      staff.staff_id,
    );
    return { closed_count: closedCount };
  }

  static async getTeacherActivityAudit(orgId: string, userId: string, activityId: string) {
    await this.requireOwnedTeacherActivity(orgId, userId, activityId);
    return LearningActivitiesRepository.getActivityAuditHistory(orgId, activityId);
  }

  static async listTeacherSubmissions(
    orgId: string,
    userId: string,
    filters: TeacherSubmissionFilters,
  ) {
    const staff = await this.requireTeacherStaff(orgId, userId);
    return LearningActivitiesRepository.listActivitySubmissionsForTeacher({
      orgId,
      staffId: staff.staff_id,
      filters,
    });
  }

  static async startSubmissionReview(orgId: string, userId: string, submissionId: string) {
    const staff = await this.requireTeacherStaff(orgId, userId);
    const submission = await LearningActivitiesRepository.getSubmissionByIdScoped(
      orgId,
      submissionId,
    );
    if (!submission) {
      throw new LearningActivityNotFoundError('Submission not found in this organization.');
    }
    if (submission.created_by_staff_id !== staff.staff_id) {
      throw new LearningActivityForbiddenError(
        'Only the assigned subject teacher can evaluate this submission.',
      );
    }

    try {
      await prisma.$transaction(async (tx) => {
        await LearningActivitiesRepository.markSubmissionUnderReview(tx, orgId, submissionId);
      });
    } catch (err) {
      translatePgLearningError(err);
    }

    return LearningActivitiesRepository.getSubmissionByIdScoped(orgId, submissionId);
  }

  static async reviewSubmission(
    orgId: string,
    userId: string,
    submissionId: string,
    input: {
      review_decision: LearningReviewDecision;
      obtained_marks?: number | null;
      feedback?: string | null;
      resubmission_allowed_until?: string | null;
    },
  ) {
    const staff = await this.requireTeacherStaff(orgId, userId);
    const submission = await LearningActivitiesRepository.getSubmissionByIdScoped(
      orgId,
      submissionId,
    );
    if (!submission) {
      throw new LearningActivityNotFoundError('Submission not found in this organization.');
    }
    if (submission.created_by_staff_id !== staff.staff_id) {
      throw new LearningActivityForbiddenError(
        'Only the assigned subject teacher can review this submission.',
      );
    }
    if (submission.activity_type !== 'project') {
      throw new LearningActivityValidationError(
        'Submission reviews are only permitted for project activities.',
      );
    }

    const obtainedMarks =
      input.obtained_marks !== undefined && input.obtained_marks !== null
        ? Number(input.obtained_marks)
        : null;

    if (obtainedMarks !== null) {
      if (!submission.grading_enabled) {
        throw new LearningActivityValidationError(
          'Marks cannot be recorded when grading is disabled on this activity.',
        );
      }
      if (submission.maximum_marks !== null && obtainedMarks > Number(submission.maximum_marks)) {
        throw new LearningActivityValidationError(
          `Obtained marks (${obtainedMarks}) exceed activity maximum marks (${submission.maximum_marks}).`,
        );
      }
    }

    const resubmitUntil = input.resubmission_allowed_until
      ? new Date(input.resubmission_allowed_until)
      : null;

    try {
      await prisma.$transaction(async (tx) => {
        await LearningActivitiesRepository.createSubmissionReview(tx, {
          orgId,
          submissionId,
          reviewedByStaffId: staff.staff_id,
          reviewDecision: input.review_decision,
          obtainedMarks,
          feedback: input.feedback ?? null,
          resubmissionAllowedUntil: resubmitUntil,
        });
      });
    } catch (err) {
      translatePgLearningError(err);
    }

    const updated = await LearningActivitiesRepository.getSubmissionByIdScoped(orgId, submissionId);
    if (!updated) throw new LearningActivityNotFoundError('Submission not found after review.');

    const eventType: LearningActivityEventName =
      input.review_decision === 'resubmission_requested'
        ? 'learning_submission.resubmission_requested'
        : 'learning_submission.reviewed';

    await dispatchLearningActivityNotifications({
      orgId,
      eventType,
      activityId: updated.activity_id,
      submissionId: updated.submission_id,
      specificStudentIds: [updated.student_id],
      notifyStudentsAndParents: true,
      extra: {
        submissionStatus: updated.submission_status,
        reviewDecision: input.review_decision,
        obtainedMarks: updated.latest_review?.obtained_marks ?? null,
        maximumMarks: updated.maximum_marks,
      },
    });

    return updated;
  }

  // ─── STUDENT WORKSPACE ───────────────────────────────────────────────────

  private static async requireStudentContext(orgId: string, userId: string) {
    const student = await LearningActivitiesRepository.getStudentContextByUserId(orgId, userId);
    if (!student) {
      throw new LearningActivityForbiddenError(
        'No student profile found for this account in the current organization.',
      );
    }
    return student;
  }

  static async getStudentOverview(orgId: string, userId: string) {
    const student = await this.requireStudentContext(orgId, userId);
    return LearningActivitiesRepository.getStudentOverview(orgId, student);
  }

  static async listStudentActivities(orgId: string, userId: string, filters: ActivityListFilters) {
    const student = await this.requireStudentContext(orgId, userId);
    if (!student.section_id) {
      return { items: [], total: 0, page: filters.page, limit: filters.limit, total_pages: 1 };
    }
    return LearningActivitiesRepository.listActivities({
      orgId,
      sectionId: student.section_id,
      studentId: student.student_id,
      onlyVisibleToStudents: true,
      filters,
    });
  }

  static async getStudentActivityDetail(orgId: string, userId: string, activityId: string) {
    const student = await this.requireStudentContext(orgId, userId);
    const activity = await LearningActivitiesRepository.getActivityByIdScoped(orgId, activityId);
    if (!activity || !student.section_id || activity.section_id !== student.section_id) {
      throw new LearningActivityNotFoundError('Learning activity not found for your section.');
    }
    if (activity.activity_status === 'draft') {
      throw new LearningActivityForbiddenError('Draft activities are not visible to students.');
    }

    const [enriched] = await LearningActivitiesRepository.enrichActivitiesWithStudentSubmissions(
      orgId,
      student.student_id,
      [activity],
    );
    const attempts = await LearningActivitiesRepository.getStudentSubmissionsForActivity(
      orgId,
      activityId,
      student.student_id,
    );

    const isReviewed = attempts.some((a) => a.submission_status === 'reviewed');
    if (enriched.quiz_config && !isReviewed) {
      enriched.quiz_config = {
        ...enriched.quiz_config,
        questions: enriched.quiz_config.questions.map((q) => {
          const { correct_key, explanation, ...rest } = q;
          return rest as any;
        }),
      };
    }

    return { activity: enriched, attempts };
  }

  static async submitStudentProjectAttempt(
    orgId: string,
    userId: string,
    activityId: string,
    textContent: string | null,
    files: Express.Multer.File[],
  ) {
    const student = await this.requireStudentContext(orgId, userId);
    if (!student.enrollment_id || !student.section_id) {
      throw new LearningActivityForbiddenError(
        'Active section enrollment is required before submitting activities.',
      );
    }

    const trimmedText = textContent && textContent.trim().length > 0 ? textContent.trim() : null;
    if (!trimmedText && (!files || files.length === 0)) {
      throw new LearningActivityValidationError(
        'Submission must include written notes or at least one attachment file.',
      );
    }

    if (files.length > MAX_SUBMISSION_FILES) {
      throw new LearningActivityValidationError(
        `Maximum ${MAX_SUBMISSION_FILES} files are allowed per submission attempt.`,
      );
    }

    // Validate buffer signatures & file size bounds BEFORE pre-upload checks
    for (const file of files) {
      if (file.size <= 0 || file.size > MAX_SUBMISSION_FILE_BYTES) {
        throw new LearningActivityValidationError(
          `File "${file.originalname}" exceeds valid size bounds (1B - 10MB).`,
        );
      }
      try {
        validateLearningActivityFileBufferSignature(file);
      } catch (err: any) {
        throw new LearningActivityValidationError(err?.message || 'Invalid file signature.');
      }
    }

    // Pre-flight eligibility check before touching storage so rejected submissions don't leak objects
    const state = await LearningActivitiesRepository.checkStudentPreSubmissionState({
      orgId,
      activityId,
      studentId: student.student_id,
    });
    if (!state.activity || state.activity.section_id !== student.section_id) {
      throw new LearningActivityNotFoundError('Learning activity not found for your section.');
    }
    if (state.activity.activity_status === 'draft') {
      throw new LearningActivityForbiddenError('Draft activities cannot receive submissions.');
    }
    if (state.activity.activity_type !== 'project') {
      throw new LearningActivityValidationError(
        'Digital submissions are only permitted for project activities; homework is completed offline without digital submissions.',
      );
    }
    if (state.activity.can_submit === false && state.activity.submission_block_reason) {
      throw new LearningActivityConflictError(state.activity.submission_block_reason);
    }
    // Re-check compute rules explicitly using fetched latestSubmission
    const enrichedList = await LearningActivitiesRepository.enrichActivitiesWithStudentSubmissions(
      orgId,
      student.student_id,
      [state.activity],
    );
    if (!enrichedList[0].can_submit) {
      throw new LearningActivityConflictError(
        enrichedList[0].submission_block_reason || 'Submission window or attempt gate blocked.',
      );
    }

    const uploadedObjects: Array<{
      storageBucket: string;
      storagePath: string;
      originalFileName: string;
      mimeType: string;
      fileSizeBytes: number;
    }> = [];

    try {
      for (const file of files) {
        const safeName = (file.originalname || 'attachment').replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `learning-activities/${orgId}/${activityId}/${student.student_id}/attempt-${state.nextAttemptNumber}/${randomUUID()}-${safeName}`;
        await StorageService.uploadFile({
          bucket: DEFAULT_SUBMISSION_BUCKET,
          path: storagePath,
          buffer: file.buffer,
          mimeType: file.mimetype,
        });
        uploadedObjects.push({
          storageBucket: DEFAULT_SUBMISSION_BUCKET,
          storagePath,
          originalFileName: file.originalname,
          mimeType: file.mimetype,
          fileSizeBytes: file.size,
        });
      }

      const submissionId = await prisma.$transaction(async (tx) => {
        return LearningActivitiesRepository.createSubmissionWithFiles(tx, {
          orgId,
          activityId,
          studentId: student.student_id,
          enrollmentId: student.enrollment_id!,
          textContent: trimmedText,
          files: uploadedObjects,
        });
      });

      const created = await LearningActivitiesRepository.getSubmissionByIdScoped(
        orgId,
        submissionId,
      );
      if (!created) {
        throw new LearningActivityNotFoundError('Created submission could not be reloaded.');
      }

      await dispatchLearningActivityNotifications({
        orgId,
        eventType: 'learning_submission.created',
        activityId,
        submissionId,
        notifyTeacher: true,
        extra: {
          studentName: student.full_name,
          submissionStatus: created.submission_status,
        },
      });

      return created;
    } catch (err) {
      if (uploadedObjects.length > 0) {
        await Promise.allSettled(
          uploadedObjects.map((obj) =>
            StorageService.deleteFile(obj.storagePath, obj.storageBucket),
          ),
        );
      }
      translatePgLearningError(err);
    }
  }

  // ─── PARENT READ-ONLY WORKSPACE ──────────────────────────────────────────

  private static async requireLinkedChild(orgId: string, parentUserId: string, childId: string) {
    const child = await LearningActivitiesRepository.getParentLinkedChildContext(
      orgId,
      parentUserId,
      childId,
    );
    if (!child) {
      throw new LearningActivityForbiddenError(
        'Forbidden: Child does not exist in this organization or is not linked to this parent account.',
      );
    }
    return child;
  }

  static async getParentChildOverview(orgId: string, parentUserId: string, childId: string) {
    const child = await this.requireLinkedChild(orgId, parentUserId, childId);
    return LearningActivitiesRepository.getParentChildOverview(orgId, child);
  }

  static async listParentChildActivities(
    orgId: string,
    parentUserId: string,
    childId: string,
    filters: ActivityListFilters,
  ) {
    const child = await this.requireLinkedChild(orgId, parentUserId, childId);
    if (!child.section_id) {
      return { items: [], total: 0, page: filters.page, limit: filters.limit, total_pages: 1 };
    }
    return LearningActivitiesRepository.listActivities({
      orgId,
      sectionId: child.section_id,
      studentId: child.student_id,
      onlyVisibleToStudents: true,
      filters,
    });
  }

  static async getParentChildActivityDetail(
    orgId: string,
    parentUserId: string,
    childId: string,
    activityId: string,
  ) {
    const child = await this.requireLinkedChild(orgId, parentUserId, childId);
    const activity = await LearningActivitiesRepository.getActivityByIdScoped(orgId, activityId);
    if (!activity || !child.section_id || activity.section_id !== child.section_id) {
      throw new LearningActivityNotFoundError('Learning activity not found for this child.');
    }
    if (activity.activity_status === 'draft') {
      throw new LearningActivityForbiddenError(
        'Draft activities are not visible in Parent Portal.',
      );
    }

    const [enriched] = await LearningActivitiesRepository.enrichActivitiesWithStudentSubmissions(
      orgId,
      child.student_id,
      [activity],
    );
    const attempts = await LearningActivitiesRepository.getStudentSubmissionsForActivity(
      orgId,
      activityId,
      child.student_id,
    );
    return {
      activity: {
        ...enriched,
        can_submit: false,
        submission_block_reason: 'Parent portal is read-only.',
      },
      attempts,
    };
  }

  // ─── ADMIN INSTITUTIONAL OVERSIGHT ───────────────────────────────────────

  static async getAdminOverview(orgId: string) {
    return LearningActivitiesRepository.getAdminOverview(orgId);
  }

  static async getAdminFilters(orgId: string) {
    return LearningActivitiesRepository.getAdminFilterOptions(orgId);
  }

  static async listAdminActivities(orgId: string, filters: ActivityListFilters) {
    return LearningActivitiesRepository.listActivities({
      orgId,
      filters,
    });
  }

  static async getAdminActivityDetail(orgId: string, activityId: string) {
    const activity = await LearningActivitiesRepository.getActivityByIdScoped(orgId, activityId);
    if (!activity) {
      throw new LearningActivityNotFoundError('Learning activity not found in this organization.');
    }
    const submissions = await LearningActivitiesRepository.listActivitySubmissionsForTeacher({
      orgId,
      staffId: activity.created_by_staff_id,
      filters: { activity_id: activityId, page: 1, limit: 100 },
    });
    const audit = await LearningActivitiesRepository.getActivityAuditHistory(orgId, activityId);
    return { activity, submissions: submissions.items, audit };
  }

  static async closeDueActivitiesForAdmin(orgId: string) {
    const closedCount = await LearningActivitiesRepository.closeDueActivitiesInOrg(orgId);
    return { closed_count: closedCount };
  }

  // ─── AUTHORIZED FILE DOWNLOAD URLs ───────────────────────────────────────

  static async getSubmissionFileDownloadUrl(params: {
    orgId: string;
    roleScope: 'teacher' | 'student' | 'parent' | 'admin';
    userId: string;
    fileId: string;
    childId?: string;
  }) {
    const file = await LearningActivitiesRepository.getSubmissionFileForDownload(
      params.orgId,
      params.fileId,
    );
    if (!file) {
      throw new LearningActivityNotFoundError('Submission file not found in this organization.');
    }

    if (params.roleScope === 'teacher') {
      const staff = await this.requireTeacherStaff(params.orgId, params.userId);
      if (file.created_by_staff_id !== staff.staff_id) {
        throw new LearningActivityForbiddenError(
          'Forbidden: Only the assigned subject teacher may download this submission file.',
        );
      }
    } else if (params.roleScope === 'student') {
      const student = await this.requireStudentContext(params.orgId, params.userId);
      if (file.student_id !== student.student_id) {
        throw new LearningActivityForbiddenError(
          'Forbidden: Students may only download their own submission files.',
        );
      }
    } else if (params.roleScope === 'parent') {
      if (!params.childId) {
        throw new LearningActivityForbiddenError('Child identifier is required.');
      }
      const child = await this.requireLinkedChild(params.orgId, params.userId, params.childId);
      if (file.student_id !== child.student_id) {
        throw new LearningActivityForbiddenError(
          'Forbidden: File does not belong to the linked child.',
        );
      }
    }

    const signed = await StorageService.getSignedUrl({
      bucket: file.storage_bucket,
      path: file.storage_path,
      expiresInSeconds: 600,
    });

    return {
      submission_file_id: file.submission_file_id,
      original_file_name: file.original_file_name,
      mime_type: file.mime_type,
      file_size_bytes: Number(file.file_size_bytes),
      download_url: signed.signedUrl,
      expires_at: signed.expiresAt,
    };
  }
}
