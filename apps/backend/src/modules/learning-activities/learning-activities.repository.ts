import { Prisma } from '@prisma/client';
import prisma from '../../lib/prismaClient';
import {
  CodingLabConfig,
  CollaborativeConfig,
  LearningActivityAuditDto,
  AdminLearningOverviewDto,
  LearningActivityDto,
  LearningActivityStatus,
  LearningActivitySubtype,
  LearningActivityType,
  LearningReviewDecision,
  LearningSubmissionDto,
  LearningSubmissionFileDto,
  LearningSubmissionReviewDto,
  LearningSubmissionStatus,
  PaginatedResult,
  ParentChildLearningOverviewDto,
  PeerLearningConfig,
  QuizConfig,
  StudentLearningOverviewDto,
  TeacherAssignmentOptionDto,
  TeacherLearningOverviewDto,
} from './learning-activities.types';

export type SqlClient = Pick<typeof prisma, '$queryRaw' | '$executeRaw'>;

export interface TeacherStaffRow {
  staff_id: string;
  org_id: string;
  user_id: string | null;
  full_name: string;
}

export interface FacultyAssignmentRow {
  faculty_assignment_id: string;
  section_id: string;
  academic_year_grade_subject_id: string;
  academic_year_grade_id: string;
  academic_year_id: string;
  staff_id: string;
  org_id: string;
  is_active: boolean;
  effective_from: Date;
  effective_to: Date | null;
}

export interface StudentContextRow {
  student_id: string;
  org_id: string;
  user_id: string | null;
  full_name: string;
  admission_no: string | null;
  enrollment_id: string | null;
  section_id: string | null;
  section_name: string | null;
  academic_year_grade_id: string | null;
  grade_id: string | null;
  grade_name: string | null;
  academic_year_id: string | null;
  academic_year_name: string | null;
}

export interface ActivityListFilters {
  activity_type?: LearningActivityType;
  activity_subtype?: LearningActivitySubtype;
  activity_status?: LearningActivityStatus;
  section_id?: string;
  subject_id?: string;
  academic_year_id?: string;
  submission_status?: LearningSubmissionStatus;
  view?:
    | 'all'
    | 'pending'
    | 'upcoming'
    | 'overdue'
    | 'submitted'
    | 'reviewed'
    | 'resubmission_requested';
  search?: string;
  page: number;
  limit: number;
}

export interface TeacherSubmissionFilters {
  activity_id?: string;
  submission_status?: LearningSubmissionStatus;
  is_late?: boolean;
  search?: string;
  page: number;
  limit: number;
}

function toIsoOrNull(val: unknown): string | null {
  if (!val) return null;
  const d = val instanceof Date ? val : new Date(String(val));
  return Number.isNaN(d.getTime()) ? String(val) : d.toISOString();
}

function toIso(val: unknown): string {
  return toIsoOrNull(val) || new Date().toISOString();
}

function toNumberOrNull(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function mapFileRow(row: any): LearningSubmissionFileDto {
  return {
    submission_file_id: row.submission_file_id,
    submission_id: row.submission_id,
    original_file_name: row.original_file_name,
    mime_type: row.mime_type,
    file_size_bytes: Number(row.file_size_bytes),
    created_at: toIso(row.created_at),
  };
}

function mapReviewRow(row: any): LearningSubmissionReviewDto {
  return {
    review_id: row.review_id,
    org_id: row.org_id,
    submission_id: row.submission_id,
    reviewed_by_staff_id: row.reviewed_by_staff_id,
    reviewer_name: row.reviewer_name || 'Teacher',
    review_decision: row.review_decision,
    obtained_marks: toNumberOrNull(row.obtained_marks),
    feedback: row.feedback ?? null,
    resubmission_allowed_until: toIsoOrNull(row.resubmission_allowed_until),
    reviewed_at: toIso(row.reviewed_at),
  };
}

const ACTIVITY_META_REGEX = /^<!--\s*EDUTRACK_ACTIVITY_META:([\s\S]*?)-->\s*\n?/;

export function parseActivityInstructions(rawInstructions: string): {
  instructions: string;
  activity_subtype?: LearningActivitySubtype;
  coding_lab_config?: CodingLabConfig | null;
  quiz_config?: QuizConfig | null;
  peer_learning_config?: PeerLearningConfig | null;
  collaborative_config?: CollaborativeConfig | null;
} {
  const match = (rawInstructions || '').match(ACTIVITY_META_REGEX);
  if (!match) {
    return {
      instructions: rawInstructions || '',
      activity_subtype: undefined,
      coding_lab_config: null,
      quiz_config: null,
      peer_learning_config: null,
      collaborative_config: null,
    };
  }

  try {
    const meta = JSON.parse(match[1]);
    const cleanInstructions = (rawInstructions || '').replace(ACTIVITY_META_REGEX, '').trim();
    return {
      instructions: cleanInstructions,
      activity_subtype: meta.activity_subtype,
      coding_lab_config: meta.coding_lab_config || null,
      quiz_config: meta.quiz_config || null,
      peer_learning_config: meta.peer_learning_config || null,
      collaborative_config: meta.collaborative_config || null,
    };
  } catch {
    return {
      instructions: rawInstructions || '',
      activity_subtype: undefined,
      coding_lab_config: null,
      quiz_config: null,
      peer_learning_config: null,
      collaborative_config: null,
    };
  }
}

export function serializeActivityInstructions(input: {
  instructions: string;
  activity_subtype?: LearningActivitySubtype;
  coding_lab_config?: CodingLabConfig | null;
  quiz_config?: QuizConfig | null;
  peer_learning_config?: PeerLearningConfig | null;
  collaborative_config?: CollaborativeConfig | null;
}): string {
  if (
    !input.activity_subtype &&
    !input.coding_lab_config &&
    !input.quiz_config &&
    !input.peer_learning_config &&
    !input.collaborative_config
  ) {
    return (input.instructions || '').trim();
  }

  const meta: Record<string, any> = {
    activity_subtype: input.activity_subtype,
  };
  if (input.coding_lab_config) meta.coding_lab_config = input.coding_lab_config;
  if (input.quiz_config) meta.quiz_config = input.quiz_config;
  if (input.peer_learning_config) meta.peer_learning_config = input.peer_learning_config;
  if (input.collaborative_config) meta.collaborative_config = input.collaborative_config;

  return `<!-- EDUTRACK_ACTIVITY_META:${JSON.stringify(meta)} -->\n${(input.instructions || '').trim()}`;
}

function mapActivityRow(row: any): LearningActivityDto {
  const parsed = parseActivityInstructions(row.instructions || '');
  const subtype = parsed.activity_subtype || (row.activity_type as LearningActivitySubtype);

  return {
    activity_id: row.activity_id,
    org_id: row.org_id,
    faculty_assignment_id: row.faculty_assignment_id,
    section_id: row.section_id,
    section_name: row.section_name,
    grade_id: row.grade_id,
    grade_name: row.grade_name,
    grade_code: row.grade_code,
    academic_year_id: row.academic_year_id,
    academic_year_name: row.academic_year_name,
    academic_year_grade_subject_id: row.academic_year_grade_subject_id,
    subject_id: row.subject_id,
    subject_name: row.subject_name,
    subject_code: row.subject_code,
    created_by_staff_id: row.created_by_staff_id,
    teacher_user_id: row.teacher_user_id || null,
    teacher_name: row.teacher_name || 'Teacher',
    lesson_plan_id: row.lesson_plan_id || null,
    lesson_title: row.lesson_title || null,
    activity_type: row.activity_type,
    activity_subtype: subtype,
    coding_lab_config: parsed.coding_lab_config,
    quiz_config: parsed.quiz_config,
    peer_learning_config: parsed.peer_learning_config,
    collaborative_config: parsed.collaborative_config,
    title: row.title,
    instructions: parsed.instructions,
    assigned_at: toIso(row.assigned_at),
    due_at: toIso(row.due_at),
    late_submission_authorized_until: toIsoOrNull(row.late_submission_authorized_until),
    grading_enabled: Boolean(row.grading_enabled),
    maximum_marks: toNumberOrNull(row.maximum_marks),
    activity_status: row.activity_status,
    published_at: toIsoOrNull(row.published_at),
    closed_at: toIsoOrNull(row.closed_at),
    closure_reason: row.closure_reason || null,
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
    total_enrolled_students: Number(row.total_enrolled_students || 0),
    submitted_students_count: Number(row.submitted_students_count || 0),
    reviewed_submissions_count: Number(row.reviewed_submissions_count || 0),
    pending_review_count: Number(row.pending_review_count || 0),
    late_submissions_count: Number(row.late_submissions_count || 0),
  };
}

function buildActivityBaseSelect(): Prisma.Sql {
  return Prisma.sql`
    SELECT
      la.activity_id,
      la.org_id,
      la.faculty_assignment_id,
      la.section_id,
      sec.section_name,
      gr.grade_id,
      gr.grade_name,
      gr.grade_code,
      ay.academic_year_id,
      ay.academic_year_name,
      la.academic_year_grade_subject_id,
      sub.subject_id,
      sub.subject_name,
      sub.subject_code,
      la.created_by_staff_id,
      st.user_id AS teacher_user_id,
      COALESCE(
        NULLIF(TRIM(CONCAT(COALESCE(tu.first_name, ''), ' ', COALESCE(tu.last_name, ''))), ''),
        tu.email,
        st.employee_code,
        'Teacher'
      ) AS teacher_name,
      la.lesson_plan_id,
      lp.lesson_title,
      la.activity_type::text AS activity_type,
      la.title,
      la.instructions,
      la.assigned_at,
      la.due_at,
      la.late_submission_authorized_until,
      la.grading_enabled,
      la.maximum_marks,
      la.activity_status::text AS activity_status,
      la.published_at,
      la.closed_at,
      la.closure_reason,
      la.created_at,
      la.updated_at,
      (
        SELECT COUNT(*)::int
        FROM public.student_enrollments se
        WHERE se.section_id = la.section_id
          AND se.academic_year_grade_id = sec.academic_year_grade_id
          AND se.status = 'active'
      ) AS total_enrolled_students,
      (
        SELECT COUNT(DISTINCT sub_tbl.student_id)::int
        FROM public.learning_activity_submissions sub_tbl
        WHERE sub_tbl.activity_id = la.activity_id
      ) AS submitted_students_count,
      (
        SELECT COUNT(*)::int
        FROM public.learning_activity_submissions sub_tbl
        WHERE sub_tbl.activity_id = la.activity_id
          AND sub_tbl.submission_status = 'reviewed'::public.s32_submission_status
      ) AS reviewed_submissions_count,
      (
        SELECT COUNT(*)::int
        FROM public.learning_activity_submissions sub_tbl
        WHERE sub_tbl.activity_id = la.activity_id
          AND sub_tbl.submission_status IN (
            'submitted'::public.s32_submission_status,
            'under_review'::public.s32_submission_status
          )
      ) AS pending_review_count,
      (
        SELECT COUNT(*)::int
        FROM public.learning_activity_submissions sub_tbl
        WHERE sub_tbl.activity_id = la.activity_id
          AND sub_tbl.is_late = true
      ) AS late_submissions_count
    FROM public.learning_activities la
    JOIN public.sections sec ON sec.section_id = la.section_id
    JOIN public.academic_year_grades ayg ON ayg.academic_year_grade_id = sec.academic_year_grade_id
    JOIN public.academic_years ay ON ay.academic_year_id = ayg.academic_year_id
    JOIN public.grades gr ON gr.grade_id = ayg.grade_id
    JOIN public.academic_year_grade_subjects aygs
      ON aygs.academic_year_grade_subject_id = la.academic_year_grade_subject_id
    JOIN public.subjects sub ON sub.subject_id = aygs.subject_id
    JOIN public.staff st ON st.staff_id = la.created_by_staff_id
    LEFT JOIN public.users tu ON tu.user_id = st.user_id
    LEFT JOIN public.lesson_plans lp ON lp.lesson_plan_id = la.lesson_plan_id
  `;
}

function computeCanSubmit(
  activity: LearningActivityDto,
  latestSubmission: LearningSubmissionDto | null,
): { canSubmit: boolean; reason: string | null } {
  if (activity.activity_type !== 'project') {
    return {
      canSubmit: false,
      reason: 'Homework activities are completed offline and do not accept digital submissions.',
    };
  }

  const nowMs = Date.now();
  const dueMs = Date.parse(activity.due_at);
  const lateUntilMs = activity.late_submission_authorized_until
    ? Date.parse(activity.late_submission_authorized_until)
    : null;

  if (
    activity.activity_status !== 'published' &&
    !(activity.activity_status === 'closed' && lateUntilMs !== null && nowMs <= lateUntilMs)
  ) {
    return {
      canSubmit: false,
      reason: 'Activity is closed without an active late-submission extension.',
    };
  }

  if (nowMs > dueMs && (lateUntilMs === null || nowMs > lateUntilMs)) {
    return {
      canSubmit: false,
      reason: 'Due date has passed and no late-submission authorization is active.',
    };
  }

  if (!latestSubmission) {
    return { canSubmit: true, reason: null };
  }

  const latestReview = latestSubmission.latest_review;
  if (
    latestSubmission.submission_status === 'resubmission_requested' &&
    latestReview &&
    latestReview.review_decision === 'resubmission_requested' &&
    latestReview.resubmission_allowed_until
  ) {
    if (Date.parse(latestReview.resubmission_allowed_until) >= nowMs) {
      return { canSubmit: true, reason: null };
    }
    return {
      canSubmit: false,
      reason: 'Resubmission authorization window has expired.',
    };
  }

  if (latestSubmission.submission_status === 'reviewed') {
    return { canSubmit: false, reason: 'Submission has already been reviewed.' };
  }

  return {
    canSubmit: false,
    reason: 'Your previous attempt is awaiting teacher review before any resubmission.',
  };
}

export class LearningActivitiesRepository {
  static async getTeacherStaffByUserId(
    orgId: string,
    userId: string,
  ): Promise<TeacherStaffRow | null> {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT
        st.staff_id,
        st.org_id,
        st.user_id,
        COALESCE(
          NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''),
          u.email,
          st.employee_code,
          'Teacher'
        ) AS full_name
      FROM public.staff st
      LEFT JOIN public.users u ON u.user_id = st.user_id
      WHERE st.org_id = ${orgId}::uuid
        AND st.user_id = ${userId}::uuid
        AND st.is_active = true
      LIMIT 1
    `;
    return rows[0] || null;
  }

  static async getFirstActiveTeacherStaff(orgId: string): Promise<TeacherStaffRow | null> {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT
        st.staff_id,
        st.org_id,
        st.user_id,
        COALESCE(
          NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''),
          u.email,
          st.employee_code,
          'Teacher'
        ) AS full_name
      FROM public.staff st
      LEFT JOIN public.users u ON u.user_id = st.user_id
      WHERE st.org_id = ${orgId}::uuid
        AND st.is_active = true
      ORDER BY st.created_at ASC
      LIMIT 1
    `;
    return rows[0] || null;
  }

  static async getTeacherAssignments(
    orgId: string,
    staffId: string,
  ): Promise<TeacherAssignmentOptionDto[]> {
    const assignmentRows = await prisma.$queryRaw<any[]>`
      SELECT
        fa.faculty_assignment_id,
        fa.section_id,
        sec.section_name,
        gr.grade_id,
        gr.grade_name,
        gr.grade_code,
        ay.academic_year_id,
        ay.academic_year_name,
        fa.academic_year_grade_subject_id,
        sub.subject_id,
        sub.subject_name,
        sub.subject_code,
        to_char(fa.effective_from, 'YYYY-MM-DD') AS effective_from,
        to_char(fa.effective_to, 'YYYY-MM-DD') AS effective_to
      FROM public.section_subject_faculty_assignments fa
      JOIN public.sections sec ON sec.section_id = fa.section_id
      JOIN public.academic_year_grades ayg ON ayg.academic_year_grade_id = sec.academic_year_grade_id
      JOIN public.academic_years ay ON ay.academic_year_id = ayg.academic_year_id
      JOIN public.grades gr ON gr.grade_id = ayg.grade_id
      JOIN public.academic_year_grade_subjects aygs
        ON aygs.academic_year_grade_subject_id = fa.academic_year_grade_subject_id
      JOIN public.subjects sub ON sub.subject_id = aygs.subject_id
      WHERE ay.org_id = ${orgId}::uuid
        AND fa.staff_id = ${staffId}::uuid
        AND fa.is_active = true
      ORDER BY ay.start_date DESC, gr.display_order ASC, sec.section_name ASC, sub.subject_name ASC
    `;

    const lessonRows = await prisma.$queryRaw<any[]>`
      SELECT
        lp.lesson_plan_id,
        lp.lesson_title,
        lp.teaching_approach::text AS teaching_approach,
        cp.academic_year_grade_subject_id
      FROM public.lesson_plans lp
      JOIN public.curriculum_plan_units cu ON cu.curriculum_unit_id = lp.curriculum_unit_id
      JOIN public.curriculum_plans cp ON cp.curriculum_plan_id = cu.curriculum_plan_id
      WHERE cp.org_id = ${orgId}::uuid
        AND lp.teacher_staff_id = ${staffId}::uuid
        AND lp.is_active = true
      ORDER BY lp.sequence_number ASC, lp.lesson_title ASC
    `;

    const lessonsBySubjectOffering = new Map<
      string,
      Array<{ lesson_plan_id: string; lesson_title: string; status: string }>
    >();
    for (const lp of lessonRows) {
      const list = lessonsBySubjectOffering.get(lp.academic_year_grade_subject_id) || [];
      list.push({
        lesson_plan_id: lp.lesson_plan_id,
        lesson_title: lp.lesson_title,
        status: lp.teaching_approach || 'active',
      });
      lessonsBySubjectOffering.set(lp.academic_year_grade_subject_id, list);
    }

    return assignmentRows.map((row) => ({
      faculty_assignment_id: row.faculty_assignment_id,
      section_id: row.section_id,
      section_name: row.section_name,
      grade_id: row.grade_id,
      grade_name: row.grade_name,
      grade_code: row.grade_code,
      academic_year_id: row.academic_year_id,
      academic_year_name: row.academic_year_name,
      academic_year_grade_subject_id: row.academic_year_grade_subject_id,
      subject_id: row.subject_id,
      subject_name: row.subject_name,
      subject_code: row.subject_code,
      effective_from: String(row.effective_from),
      effective_to: row.effective_to ? String(row.effective_to) : null,
      lesson_plans: lessonsBySubjectOffering.get(row.academic_year_grade_subject_id) || [],
    }));
  }

  static async getFacultyAssignmentContext(
    orgId: string,
    facultyAssignmentId: string,
    client: SqlClient = prisma,
  ): Promise<FacultyAssignmentRow | null> {
    const rows = await client.$queryRaw<any[]>`
      SELECT
        fa.faculty_assignment_id,
        fa.section_id,
        fa.academic_year_grade_subject_id,
        sec.academic_year_grade_id,
        ayg.academic_year_id,
        fa.staff_id,
        ay.org_id,
        fa.is_active,
        fa.effective_from,
        fa.effective_to
      FROM public.section_subject_faculty_assignments fa
      JOIN public.sections sec ON sec.section_id = fa.section_id
      JOIN public.academic_year_grades ayg ON ayg.academic_year_grade_id = sec.academic_year_grade_id
      JOIN public.academic_years ay ON ay.academic_year_id = ayg.academic_year_id
      WHERE fa.faculty_assignment_id = ${facultyAssignmentId}::uuid
        AND ay.org_id = ${orgId}::uuid
      LIMIT 1
    `;
    return rows[0] || null;
  }

  static async createActivityDraft(
    client: SqlClient,
    input: {
      orgId: string;
      facultyAssignmentId: string;
      sectionId: string;
      academicYearGradeSubjectId: string;
      createdByStaffId: string;
      lessonPlanId: string | null;
      activityType: LearningActivityType;
      title: string;
      instructions: string;
      assignedAt: Date;
      dueAt: Date;
      lateSubmissionAuthorizedUntil: Date | null;
      gradingEnabled: boolean;
      maximumMarks: number | null;
    },
  ): Promise<string> {
    const rows = await client.$queryRaw<{ activity_id: string }[]>`
      INSERT INTO public.learning_activities (
        org_id,
        faculty_assignment_id,
        section_id,
        academic_year_grade_subject_id,
        created_by_staff_id,
        lesson_plan_id,
        activity_type,
        title,
        instructions,
        assigned_at,
        due_at,
        late_submission_authorized_until,
        grading_enabled,
        maximum_marks,
        activity_status
      )
      VALUES (
        ${input.orgId}::uuid,
        ${input.facultyAssignmentId}::uuid,
        ${input.sectionId}::uuid,
        ${input.academicYearGradeSubjectId}::uuid,
        ${input.createdByStaffId}::uuid,
        ${input.lessonPlanId}::uuid,
        ${input.activityType}::public.s32_activity_type,
        ${input.title},
        ${input.instructions},
        ${input.assignedAt},
        ${input.dueAt},
        ${input.lateSubmissionAuthorizedUntil},
        ${input.gradingEnabled},
        ${input.maximumMarks},
        'draft'::public.s32_activity_status
      )
      RETURNING activity_id
    `;
    return rows[0].activity_id;
  }

  static async getActivityByIdScoped(
    orgId: string,
    activityId: string,
    client: SqlClient = prisma,
  ): Promise<LearningActivityDto | null> {
    const baseSelect = buildActivityBaseSelect();
    const rows = await client.$queryRaw<any[]>`
      ${baseSelect}
      WHERE la.org_id = ${orgId}::uuid
        AND la.activity_id = ${activityId}::uuid
      LIMIT 1
    `;
    return rows[0] ? mapActivityRow(rows[0]) : null;
  }

  static async updateActivityRow(
    client: SqlClient,
    input: {
      orgId: string;
      activityId: string;
      lessonPlanId: string | null;
      activityType: LearningActivityType;
      title: string;
      instructions: string;
      assignedAt: Date;
      dueAt: Date;
      lateSubmissionAuthorizedUntil: Date | null;
      gradingEnabled: boolean;
      maximumMarks: number | null;
    },
  ): Promise<void> {
    await client.$executeRaw`
      UPDATE public.learning_activities
      SET
        lesson_plan_id = ${input.lessonPlanId}::uuid,
        activity_type = ${input.activityType}::public.s32_activity_type,
        title = ${input.title},
        instructions = ${input.instructions},
        assigned_at = ${input.assignedAt},
        due_at = ${input.dueAt},
        late_submission_authorized_until = ${input.lateSubmissionAuthorizedUntil},
        grading_enabled = ${input.gradingEnabled},
        maximum_marks = ${input.maximumMarks}
      WHERE org_id = ${input.orgId}::uuid
        AND activity_id = ${input.activityId}::uuid
    `;
  }

  static async setActivityPublished(
    client: SqlClient,
    orgId: string,
    activityId: string,
  ): Promise<void> {
    await client.$executeRaw`
      UPDATE public.learning_activities
      SET
        activity_status = 'published'::public.s32_activity_status,
        published_at = COALESCE(published_at, now()),
        closed_at = NULL,
        closure_reason = NULL
      WHERE org_id = ${orgId}::uuid
        AND activity_id = ${activityId}::uuid
    `;
  }

  static async setActivityClosed(
    client: SqlClient,
    orgId: string,
    activityId: string,
    closureReason: string | null,
  ): Promise<void> {
    await client.$executeRaw`
      UPDATE public.learning_activities
      SET
        activity_status = 'closed'::public.s32_activity_status,
        closed_at = COALESCE(closed_at, now()),
        closure_reason = ${closureReason}
      WHERE org_id = ${orgId}::uuid
        AND activity_id = ${activityId}::uuid
    `;
  }

  static async setActivityLateAuthorization(
    client: SqlClient,
    orgId: string,
    activityId: string,
    lateUntil: Date | null,
  ): Promise<void> {
    await client.$executeRaw`
      UPDATE public.learning_activities
      SET late_submission_authorized_until = ${lateUntil}
      WHERE org_id = ${orgId}::uuid
        AND activity_id = ${activityId}::uuid
    `;
  }

  static async closeDueActivitiesInOrg(orgId: string, staffId?: string): Promise<number> {
    const staffClause = staffId
      ? Prisma.sql`AND created_by_staff_id = ${staffId}::uuid`
      : Prisma.empty;
    const count = await prisma.$executeRaw`
      UPDATE public.learning_activities
      SET
        activity_status = 'closed'::public.s32_activity_status,
        closed_at = COALESCE(closed_at, now()),
        closure_reason = COALESCE(closure_reason, 'Due date reached')
      WHERE org_id = ${orgId}::uuid
        AND activity_status = 'published'::public.s32_activity_status
        AND due_at <= now()
        ${staffClause}
    `;
    return Number(count || 0);
  }

  static async getActivityAuditHistory(
    orgId: string,
    activityId: string,
  ): Promise<LearningActivityAuditDto[]> {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT
        ah.audit_id,
        ah.org_id,
        ah.activity_id,
        ah.actor_staff_id,
        COALESCE(
          NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''),
          u.email,
          st.employee_code
        ) AS actor_name,
        ah.action,
        ah.old_values,
        ah.new_values,
        ah.occurred_at
      FROM public.learning_activity_audit_history ah
      LEFT JOIN public.staff st ON st.staff_id = ah.actor_staff_id
      LEFT JOIN public.users u ON u.user_id = st.user_id
      WHERE ah.org_id = ${orgId}::uuid
        AND ah.activity_id = ${activityId}::uuid
      ORDER BY ah.occurred_at DESC
    `;

    return rows.map((row) => ({
      audit_id: row.audit_id,
      org_id: row.org_id,
      activity_id: row.activity_id,
      actor_staff_id: row.actor_staff_id || null,
      actor_name: row.actor_name || null,
      action: row.action,
      old_values: row.old_values ?? null,
      new_values: row.new_values ?? null,
      occurred_at: toIso(row.occurred_at),
    }));
  }

  static async listActivities(params: {
    orgId: string;
    filters: ActivityListFilters;
    staffId?: string;
    sectionId?: string;
    onlyVisibleToStudents?: boolean;
    studentId?: string;
  }): Promise<PaginatedResult<LearningActivityDto>> {
    const { orgId, filters, staffId, sectionId, onlyVisibleToStudents, studentId } = params;
    const conditions: Prisma.Sql[] = [Prisma.sql`la.org_id = ${orgId}::uuid`];

    if (staffId) {
      conditions.push(Prisma.sql`la.created_by_staff_id = ${staffId}::uuid`);
    }
    if (sectionId) {
      conditions.push(Prisma.sql`la.section_id = ${sectionId}::uuid`);
    } else if (filters.section_id) {
      conditions.push(Prisma.sql`la.section_id = ${filters.section_id}::uuid`);
    }
    if (onlyVisibleToStudents) {
      conditions.push(
        Prisma.sql`la.activity_status IN ('published'::public.s32_activity_status, 'closed'::public.s32_activity_status)`,
      );
    }
    if (filters.activity_type) {
      conditions.push(
        Prisma.sql`la.activity_type = ${filters.activity_type}::public.s32_activity_type`,
      );
    }
    if (filters.activity_subtype) {
      if (filters.activity_subtype === 'homework') {
        conditions.push(Prisma.sql`la.activity_type = 'homework'::public.s32_activity_type`);
      } else if (filters.activity_subtype === 'project') {
        conditions.push(
          Prisma.sql`la.activity_type = 'project'::public.s32_activity_type AND (la.instructions NOT LIKE '%EDUTRACK_ACTIVITY_META%' OR la.instructions LIKE '%"activity_subtype":"project"%')`,
        );
      } else {
        const pattern = `%"activity_subtype":"${filters.activity_subtype}"%`;
        conditions.push(
          Prisma.sql`la.activity_type = 'project'::public.s32_activity_type AND la.instructions LIKE ${pattern}`,
        );
      }
    }
    if (filters.activity_status) {
      conditions.push(
        Prisma.sql`la.activity_status = ${filters.activity_status}::public.s32_activity_status`,
      );
    }
    if (filters.subject_id) {
      conditions.push(Prisma.sql`sub.subject_id = ${filters.subject_id}::uuid`);
    }
    if (filters.academic_year_id) {
      conditions.push(Prisma.sql`ay.academic_year_id = ${filters.academic_year_id}::uuid`);
    }
    if (filters.search) {
      const pattern = `%${filters.search}%`;
      conditions.push(
        Prisma.sql`(la.title ILIKE ${pattern} OR la.instructions ILIKE ${pattern} OR sub.subject_name ILIKE ${pattern})`,
      );
    }

    if (filters.view === 'upcoming') {
      conditions.push(
        Prisma.sql`la.activity_status = 'published'::public.s32_activity_status AND la.due_at > now()`,
      );
    } else if (filters.view === 'overdue') {
      conditions.push(
        Prisma.sql`la.due_at <= now() AND la.activity_status = 'published'::public.s32_activity_status`,
      );
    }

    if (studentId) {
      if (filters.submission_status) {
        conditions.push(Prisma.sql`
          (
            SELECT latest.submission_status::text
            FROM public.learning_activity_submissions latest
            WHERE latest.activity_id = la.activity_id
              AND latest.student_id = ${studentId}::uuid
            ORDER BY latest.attempt_number DESC
            LIMIT 1
          ) = ${filters.submission_status}
        `);
      }

      if (filters.view === 'pending') {
        conditions.push(Prisma.sql`
          la.activity_status = 'published'::public.s32_activity_status
          AND NOT EXISTS (
            SELECT 1 FROM public.learning_activity_submissions ls
            WHERE ls.activity_id = la.activity_id AND ls.student_id = ${studentId}::uuid
          )
        `);
      } else if (filters.view === 'submitted') {
        conditions.push(Prisma.sql`
          EXISTS (
            SELECT 1 FROM public.learning_activity_submissions ls
            WHERE ls.activity_id = la.activity_id
              AND ls.student_id = ${studentId}::uuid
              AND ls.submission_status IN ('submitted'::public.s32_submission_status, 'under_review'::public.s32_submission_status)
          )
        `);
      } else if (filters.view === 'reviewed') {
        conditions.push(Prisma.sql`
          (
            SELECT latest.submission_status::text
            FROM public.learning_activity_submissions latest
            WHERE latest.activity_id = la.activity_id
              AND latest.student_id = ${studentId}::uuid
            ORDER BY latest.attempt_number DESC
            LIMIT 1
          ) = 'reviewed'
        `);
      } else if (filters.view === 'resubmission_requested') {
        conditions.push(Prisma.sql`
          (
            SELECT latest.submission_status::text
            FROM public.learning_activity_submissions latest
            WHERE latest.activity_id = la.activity_id
              AND latest.student_id = ${studentId}::uuid
            ORDER BY latest.attempt_number DESC
            LIMIT 1
          ) = 'resubmission_requested'
        `);
      }
    }

    const whereSql = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;
    const offset = (filters.page - 1) * filters.limit;

    const countRows = await prisma.$queryRaw<{ total: number }[]>`
      SELECT COUNT(*)::int AS total
      FROM public.learning_activities la
      JOIN public.sections sec ON sec.section_id = la.section_id
      JOIN public.academic_year_grades ayg ON ayg.academic_year_grade_id = sec.academic_year_grade_id
      JOIN public.academic_years ay ON ay.academic_year_id = ayg.academic_year_id
      JOIN public.academic_year_grade_subjects aygs
        ON aygs.academic_year_grade_subject_id = la.academic_year_grade_subject_id
      JOIN public.subjects sub ON sub.subject_id = aygs.subject_id
      ${whereSql}
    `;
    const total = Number(countRows[0]?.total || 0);

    const baseSelect = buildActivityBaseSelect();
    const rows = await prisma.$queryRaw<any[]>`
      ${baseSelect}
      ${whereSql}
      ORDER BY
        CASE la.activity_status
          WHEN 'published'::public.s32_activity_status THEN 0
          WHEN 'draft'::public.s32_activity_status THEN 1
          ELSE 2
        END ASC,
        la.due_at ASC,
        la.created_at DESC
      LIMIT ${filters.limit}
      OFFSET ${offset}
    `;

    let items = rows.map(mapActivityRow);
    if (studentId && items.length > 0) {
      items = await this.enrichActivitiesWithStudentSubmissions(orgId, studentId, items);
    }

    return {
      items,
      total,
      page: filters.page,
      limit: filters.limit,
      total_pages: Math.max(1, Math.ceil(total / filters.limit)),
    };
  }

  static async enrichActivitiesWithStudentSubmissions(
    orgId: string,
    studentId: string,
    activities: LearningActivityDto[],
  ): Promise<LearningActivityDto[]> {
    const activityIds = activities.map((a) => a.activity_id);
    if (activityIds.length === 0) return activities;

    const subRows = await prisma.$queryRaw<any[]>`
      SELECT
        s.*,
        COALESCE(
          NULLIF(TRIM(CONCAT(COALESCE(stu_u.first_name, ''), ' ', COALESCE(stu_u.last_name, ''))), ''),
          TRIM(CONCAT(COALESCE(st.first_name, ''), ' ', COALESCE(st.last_name, ''))),
          st.admission_no,
          'Student'
        ) AS student_name,
        st.admission_no AS admission_no
      FROM public.learning_activity_submissions s
      JOIN public.students st ON st.student_id = s.student_id
      LEFT JOIN public.users stu_u ON stu_u.user_id = st.user_id
      WHERE s.org_id = ${orgId}::uuid
        AND s.student_id = ${studentId}::uuid
        AND s.activity_id = ANY(${activityIds}::uuid[])
      ORDER BY s.activity_id, s.attempt_number DESC
    `;

    const hydrated = await this.hydrateSubmissionsWithFilesAndReviews(orgId, subRows);
    const byActivity = new Map<string, LearningSubmissionDto[]>();
    for (const sub of hydrated) {
      const list = byActivity.get(sub.activity_id) || [];
      list.push(sub);
      byActivity.set(sub.activity_id, list);
    }

    return activities.map((activity) => {
      const list = byActivity.get(activity.activity_id) || [];
      const latest = list[0] || null;
      const { canSubmit, reason } = computeCanSubmit(activity, latest);
      return {
        ...activity,
        my_latest_submission: latest,
        my_submissions_count: list.length,
        can_submit: canSubmit,
        submission_block_reason: reason,
      };
    });
  }

  static async hydrateSubmissionsWithFilesAndReviews(
    orgId: string,
    submissionRows: any[],
  ): Promise<LearningSubmissionDto[]> {
    if (submissionRows.length === 0) return [];
    const submissionIds = submissionRows.map((r) => r.submission_id);

    const [fileRows, reviewRows] = await Promise.all([
      prisma.$queryRaw<any[]>`
        SELECT
          f.submission_file_id,
          f.submission_id,
          f.original_file_name,
          f.mime_type,
          f.file_size_bytes,
          f.created_at
        FROM public.learning_activity_submission_files f
        WHERE f.org_id = ${orgId}::uuid
          AND f.submission_id = ANY(${submissionIds}::uuid[])
        ORDER BY f.created_at ASC
      `,
      prisma.$queryRaw<any[]>`
        SELECT
          r.*,
          COALESCE(
            NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''),
            u.email,
            st.employee_code,
            'Teacher'
          ) AS reviewer_name
        FROM public.learning_activity_submission_reviews r
        JOIN public.staff st ON st.staff_id = r.reviewed_by_staff_id
        LEFT JOIN public.users u ON u.user_id = st.user_id
        WHERE r.org_id = ${orgId}::uuid
          AND r.submission_id = ANY(${submissionIds}::uuid[])
        ORDER BY r.reviewed_at DESC
      `,
    ]);

    const filesBySubmission = new Map<string, LearningSubmissionFileDto[]>();
    for (const row of fileRows) {
      const list = filesBySubmission.get(row.submission_id) || [];
      list.push(mapFileRow(row));
      filesBySubmission.set(row.submission_id, list);
    }

    const reviewsBySubmission = new Map<string, LearningSubmissionReviewDto[]>();
    for (const row of reviewRows) {
      const list = reviewsBySubmission.get(row.submission_id) || [];
      list.push(mapReviewRow(row));
      reviewsBySubmission.set(row.submission_id, list);
    }

    return submissionRows.map((row) => {
      const reviews = reviewsBySubmission.get(row.submission_id) || [];
      return {
        submission_id: row.submission_id,
        org_id: row.org_id,
        activity_id: row.activity_id,
        student_id: row.student_id,
        student_name: row.student_name || 'Student',
        admission_no: row.admission_no || null,
        enrollment_id: row.enrollment_id,
        attempt_number: Number(row.attempt_number),
        text_content: row.text_content ?? null,
        submitted_at: toIso(row.submitted_at),
        is_late: Boolean(row.is_late),
        submission_status: row.submission_status,
        created_at: toIso(row.created_at),
        files: filesBySubmission.get(row.submission_id) || [],
        reviews,
        latest_review: reviews[0] || null,
      };
    });
  }

  static async getStudentContextByUserId(
    orgId: string,
    userId: string,
  ): Promise<StudentContextRow | null> {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT
        st.student_id,
        st.org_id,
        st.user_id,
        COALESCE(
          NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''),
          TRIM(CONCAT(COALESCE(st.first_name, ''), ' ', COALESCE(st.last_name, ''))),
          st.admission_no,
          'Student'
        ) AS full_name,
        st.admission_no AS admission_no,
        se.enrollment_id,
        se.section_id,
        sec.section_name,
        se.academic_year_grade_id,
        gr.grade_id,
        gr.grade_name,
        ay.academic_year_id,
        ay.academic_year_name
      FROM public.students st
      LEFT JOIN public.users u ON u.user_id = st.user_id
      LEFT JOIN public.student_enrollments se
        ON se.student_id = st.student_id AND se.status = 'active'
      LEFT JOIN public.sections sec ON sec.section_id = se.section_id
      LEFT JOIN public.academic_year_grades ayg ON ayg.academic_year_grade_id = se.academic_year_grade_id
      LEFT JOIN public.grades gr ON gr.grade_id = ayg.grade_id
      LEFT JOIN public.academic_years ay ON ay.academic_year_id = ayg.academic_year_id
      WHERE st.org_id = ${orgId}::uuid
        AND st.user_id = ${userId}::uuid
      ORDER BY se.enrollment_date DESC NULLS LAST
      LIMIT 1
    `;
    return rows[0] || null;
  }

  static async getParentLinkedChildContext(
    orgId: string,
    parentUserId: string,
    childStudentId: string,
  ): Promise<StudentContextRow | null> {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT
        st.student_id,
        st.org_id,
        st.user_id,
        COALESCE(
          NULLIF(TRIM(CONCAT(COALESCE(su.first_name, ''), ' ', COALESCE(su.last_name, ''))), ''),
          TRIM(CONCAT(COALESCE(st.first_name, ''), ' ', COALESCE(st.last_name, ''))),
          st.admission_no,
          'Student'
        ) AS full_name,
        st.admission_no AS admission_no,
        se.enrollment_id,
        se.section_id,
        sec.section_name,
        se.academic_year_grade_id,
        gr.grade_id,
        gr.grade_name,
        ay.academic_year_id,
        ay.academic_year_name
      FROM public.parents p
      JOIN public.student_parents sp ON sp.parent_id = p.parent_id
      JOIN public.students st ON st.student_id = sp.student_id AND st.org_id = ${orgId}::uuid
      LEFT JOIN public.users su ON su.user_id = st.user_id
      LEFT JOIN public.student_enrollments se
        ON se.student_id = st.student_id AND se.status = 'active'
      LEFT JOIN public.sections sec ON sec.section_id = se.section_id
      LEFT JOIN public.academic_year_grades ayg ON ayg.academic_year_grade_id = se.academic_year_grade_id
      LEFT JOIN public.grades gr ON gr.grade_id = ayg.grade_id
      LEFT JOIN public.academic_years ay ON ay.academic_year_id = ayg.academic_year_id
      WHERE p.org_id = ${orgId}::uuid
        AND p.user_id = ${parentUserId}::uuid
        AND st.student_id = ${childStudentId}::uuid
      ORDER BY se.enrollment_date DESC NULLS LAST
      LIMIT 1
    `;
    return rows[0] || null;
  }

  static async getStudentSubmissionsForActivity(
    orgId: string,
    activityId: string,
    studentId: string,
  ): Promise<LearningSubmissionDto[]> {
    const subRows = await prisma.$queryRaw<any[]>`
      SELECT
        s.*,
        COALESCE(
          NULLIF(TRIM(CONCAT(COALESCE(stu_u.first_name, ''), ' ', COALESCE(stu_u.last_name, ''))), ''),
          TRIM(CONCAT(COALESCE(st.first_name, ''), ' ', COALESCE(st.last_name, ''))),
          st.admission_no,
          'Student'
        ) AS student_name,
        st.admission_no AS admission_no
      FROM public.learning_activity_submissions s
      JOIN public.students st ON st.student_id = s.student_id
      LEFT JOIN public.users stu_u ON stu_u.user_id = st.user_id
      WHERE s.org_id = ${orgId}::uuid
        AND s.activity_id = ${activityId}::uuid
        AND s.student_id = ${studentId}::uuid
      ORDER BY s.attempt_number DESC
    `;
    return this.hydrateSubmissionsWithFilesAndReviews(orgId, subRows);
  }

  static async checkStudentPreSubmissionState(params: {
    orgId: string;
    activityId: string;
    studentId: string;
  }): Promise<{
    activity: LearningActivityDto | null;
    nextAttemptNumber: number;
    latestSubmission: LearningSubmissionDto | null;
  }> {
    const activity = await this.getActivityByIdScoped(params.orgId, params.activityId);
    if (!activity) {
      return { activity: null, nextAttemptNumber: 1, latestSubmission: null };
    }
    const attempts = await this.getStudentSubmissionsForActivity(
      params.orgId,
      params.activityId,
      params.studentId,
    );
    const maxAttempt = attempts[0]?.attempt_number || 0;
    return {
      activity,
      nextAttemptNumber: maxAttempt + 1,
      latestSubmission: attempts[0] || null,
    };
  }

  static async createSubmissionWithFiles(
    client: SqlClient,
    input: {
      orgId: string;
      activityId: string;
      studentId: string;
      enrollmentId: string;
      textContent: string | null;
      files: Array<{
        storageBucket: string;
        storagePath: string;
        originalFileName: string;
        mimeType: string;
        fileSizeBytes: number;
      }>;
    },
  ): Promise<string> {
    // Compute next attempt atomically inside the same transaction holding activity FOR UPDATE
    const attemptRows = await client.$queryRaw<{ next_attempt: number }[]>`
      SELECT (COALESCE(MAX(attempt_number), 0) + 1)::int AS next_attempt
      FROM public.learning_activity_submissions
      WHERE activity_id = ${input.activityId}::uuid
        AND student_id = ${input.studentId}::uuid
    `;
    const nextAttempt = Number(attemptRows[0]?.next_attempt || 1);

    const subRows = await client.$queryRaw<{ submission_id: string }[]>`
      INSERT INTO public.learning_activity_submissions (
        org_id,
        activity_id,
        student_id,
        enrollment_id,
        attempt_number,
        text_content,
        submitted_at,
        submission_status
      )
      VALUES (
        ${input.orgId}::uuid,
        ${input.activityId}::uuid,
        ${input.studentId}::uuid,
        ${input.enrollmentId}::uuid,
        ${nextAttempt},
        ${input.textContent},
        now(),
        'submitted'::public.s32_submission_status
      )
      RETURNING submission_id
    `;
    const submissionId = subRows[0].submission_id;

    for (const file of input.files) {
      await client.$executeRaw`
        INSERT INTO public.learning_activity_submission_files (
          org_id,
          submission_id,
          storage_bucket,
          storage_path,
          original_file_name,
          mime_type,
          file_size_bytes
        )
        VALUES (
          ${input.orgId}::uuid,
          ${submissionId}::uuid,
          ${file.storageBucket},
          ${file.storagePath},
          ${file.originalFileName},
          ${file.mimeType},
          ${file.fileSizeBytes}::bigint
        )
      `;
    }

    return submissionId;
  }

  static async getSubmissionByIdScoped(
    orgId: string,
    submissionId: string,
  ): Promise<
    | (LearningSubmissionDto & {
        activity_title: string;
        activity_type: LearningActivityType;
        created_by_staff_id: string;
        grading_enabled: boolean;
        maximum_marks: number | null;
        section_id: string;
        section_name: string;
        subject_name: string;
      })
    | null
  > {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT
        s.*,
        COALESCE(
          NULLIF(TRIM(CONCAT(COALESCE(stu_u.first_name, ''), ' ', COALESCE(stu_u.last_name, ''))), ''),
          TRIM(CONCAT(COALESCE(st.first_name, ''), ' ', COALESCE(st.last_name, ''))),
          st.admission_no,
          'Student'
        ) AS student_name,
        st.admission_no AS admission_no,
        la.title AS activity_title,
        la.activity_type::text AS activity_type,
        la.created_by_staff_id,
        la.grading_enabled,
        la.maximum_marks,
        la.section_id,
        sec.section_name,
        sub.subject_name
      FROM public.learning_activity_submissions s
      JOIN public.learning_activities la ON la.activity_id = s.activity_id
      JOIN public.sections sec ON sec.section_id = la.section_id
      JOIN public.academic_year_grade_subjects aygs
        ON aygs.academic_year_grade_subject_id = la.academic_year_grade_subject_id
      JOIN public.subjects sub ON sub.subject_id = aygs.subject_id
      JOIN public.students st ON st.student_id = s.student_id
      LEFT JOIN public.users stu_u ON stu_u.user_id = st.user_id
      WHERE s.org_id = ${orgId}::uuid
        AND s.submission_id = ${submissionId}::uuid
      LIMIT 1
    `;
    const row = rows[0];
    if (!row) return null;

    const [hydrated] = await this.hydrateSubmissionsWithFilesAndReviews(orgId, [row]);
    return {
      ...hydrated,
      activity_title: row.activity_title,
      activity_type: row.activity_type,
      created_by_staff_id: row.created_by_staff_id,
      grading_enabled: Boolean(row.grading_enabled),
      maximum_marks: toNumberOrNull(row.maximum_marks),
      section_id: row.section_id,
      section_name: row.section_name,
      subject_name: row.subject_name,
    };
  }

  static async listActivitySubmissionsForTeacher(params: {
    orgId: string;
    staffId: string;
    filters: TeacherSubmissionFilters;
  }): Promise<
    PaginatedResult<
      LearningSubmissionDto & {
        activity_title: string;
        subject_name: string;
        grade_name: string;
        section_name: string;
        due_at: string;
        grading_enabled: boolean;
        maximum_marks: number | null;
      }
    >
  > {
    const { orgId, staffId, filters } = params;
    const conditions: Prisma.Sql[] = [
      Prisma.sql`s.org_id = ${orgId}::uuid`,
      Prisma.sql`la.created_by_staff_id = ${staffId}::uuid`,
    ];

    if (filters.activity_id) {
      conditions.push(Prisma.sql`s.activity_id = ${filters.activity_id}::uuid`);
    }
    if (filters.submission_status) {
      conditions.push(
        Prisma.sql`s.submission_status = ${filters.submission_status}::public.s32_submission_status`,
      );
    }
    if (filters.is_late !== undefined) {
      conditions.push(Prisma.sql`s.is_late = ${filters.is_late}`);
    }
    if (filters.search) {
      const pattern = `%${filters.search}%`;
      conditions.push(
        Prisma.sql`(la.title ILIKE ${pattern} OR st.admission_no ILIKE ${pattern} OR stu_u.first_name ILIKE ${pattern} OR stu_u.last_name ILIKE ${pattern} OR st.first_name ILIKE ${pattern} OR st.last_name ILIKE ${pattern})`,
      );
    }

    const whereSql = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;
    const offset = (filters.page - 1) * filters.limit;

    const countRows = await prisma.$queryRaw<{ total: number }[]>`
      SELECT COUNT(*)::int AS total
      FROM public.learning_activity_submissions s
      JOIN public.learning_activities la ON la.activity_id = s.activity_id
      JOIN public.students st ON st.student_id = s.student_id
      LEFT JOIN public.users stu_u ON stu_u.user_id = st.user_id
      ${whereSql}
    `;
    const total = Number(countRows[0]?.total || 0);

    const rows = await prisma.$queryRaw<any[]>`
      SELECT
        s.*,
        COALESCE(
          NULLIF(TRIM(CONCAT(COALESCE(stu_u.first_name, ''), ' ', COALESCE(stu_u.last_name, ''))), ''),
          TRIM(CONCAT(COALESCE(st.first_name, ''), ' ', COALESCE(st.last_name, ''))),
          st.admission_no,
          'Student'
        ) AS student_name,
        st.admission_no AS admission_no,
        la.title AS activity_title,
        sub.subject_name,
        gr.grade_name,
        sec.section_name,
        la.due_at,
        la.grading_enabled,
        la.maximum_marks
      FROM public.learning_activity_submissions s
      JOIN public.learning_activities la ON la.activity_id = s.activity_id
      JOIN public.sections sec ON sec.section_id = la.section_id
      JOIN public.academic_year_grades ayg ON ayg.academic_year_grade_id = sec.academic_year_grade_id
      JOIN public.grades gr ON gr.grade_id = ayg.grade_id
      JOIN public.academic_year_grade_subjects aygs
        ON aygs.academic_year_grade_subject_id = la.academic_year_grade_subject_id
      JOIN public.subjects sub ON sub.subject_id = aygs.subject_id
      JOIN public.students st ON st.student_id = s.student_id
      LEFT JOIN public.users stu_u ON stu_u.user_id = st.user_id
      ${whereSql}
      ORDER BY
        CASE s.submission_status
          WHEN 'submitted'::public.s32_submission_status THEN 0
          WHEN 'under_review'::public.s32_submission_status THEN 1
          WHEN 'resubmission_requested'::public.s32_submission_status THEN 2
          ELSE 3
        END ASC,
        s.submitted_at DESC
      LIMIT ${filters.limit}
      OFFSET ${offset}
    `;

    const hydrated = await this.hydrateSubmissionsWithFilesAndReviews(orgId, rows);
    const metaById = new Map(rows.map((r) => [r.submission_id, r]));

    const items = hydrated.map((sub) => {
      const m = metaById.get(sub.submission_id);
      return {
        ...sub,
        activity_title: m.activity_title,
        subject_name: m.subject_name,
        grade_name: m.grade_name,
        section_name: m.section_name,
        due_at: toIso(m.due_at),
        grading_enabled: Boolean(m.grading_enabled),
        maximum_marks: toNumberOrNull(m.maximum_marks),
      };
    });

    return {
      items,
      total,
      page: filters.page,
      limit: filters.limit,
      total_pages: Math.max(1, Math.ceil(total / filters.limit)),
    };
  }

  static async markSubmissionUnderReview(
    client: SqlClient,
    orgId: string,
    submissionId: string,
  ): Promise<void> {
    await client.$executeRaw`
      UPDATE public.learning_activity_submissions
      SET submission_status = 'under_review'::public.s32_submission_status
      WHERE org_id = ${orgId}::uuid
        AND submission_id = ${submissionId}::uuid
        AND submission_status = 'submitted'::public.s32_submission_status
    `;
  }

  static async createSubmissionReview(
    client: SqlClient,
    input: {
      orgId: string;
      submissionId: string;
      reviewedByStaffId: string;
      reviewDecision: LearningReviewDecision;
      obtainedMarks: number | null;
      feedback: string | null;
      resubmissionAllowedUntil: Date | null;
    },
  ): Promise<string> {
    const rows = await client.$queryRaw<{ review_id: string }[]>`
      INSERT INTO public.learning_activity_submission_reviews (
        org_id,
        submission_id,
        reviewed_by_staff_id,
        review_decision,
        obtained_marks,
        feedback,
        resubmission_allowed_until,
        reviewed_at
      )
      VALUES (
        ${input.orgId}::uuid,
        ${input.submissionId}::uuid,
        ${input.reviewedByStaffId}::uuid,
        ${input.reviewDecision}::public.s32_review_decision,
        ${input.obtainedMarks},
        ${input.feedback},
        ${input.resubmissionAllowedUntil},
        now()
      )
      RETURNING review_id
    `;
    return rows[0].review_id;
  }

  static async getSubmissionFileForDownload(
    orgId: string,
    fileId: string,
  ): Promise<{
    submission_file_id: string;
    org_id: string;
    submission_id: string;
    activity_id: string;
    student_id: string;
    created_by_staff_id: string;
    storage_bucket: string;
    storage_path: string;
    original_file_name: string;
    mime_type: string;
    file_size_bytes: number;
  } | null> {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT
        f.submission_file_id,
        f.org_id,
        f.submission_id,
        s.activity_id,
        s.student_id,
        la.created_by_staff_id,
        f.storage_bucket,
        f.storage_path,
        f.original_file_name,
        f.mime_type,
        f.file_size_bytes
      FROM public.learning_activity_submission_files f
      JOIN public.learning_activity_submissions s ON s.submission_id = f.submission_id
      JOIN public.learning_activities la ON la.activity_id = s.activity_id
      WHERE f.org_id = ${orgId}::uuid
        AND f.submission_file_id = ${fileId}::uuid
      LIMIT 1
    `;
    return rows[0] || null;
  }

  static async getActivityAudienceUsers(
    orgId: string,
    activityId: string,
    specificStudentIds?: string[],
  ): Promise<{
    teacherUserId: string | null;
    studentUserIds: string[];
    parentUserIds: string[];
    title: string;
    activityType: LearningActivityType;
    subjectName: string;
    sectionName: string;
    dueAt: string;
  } | null> {
    const metaRows = await prisma.$queryRaw<any[]>`
      SELECT
        st.user_id AS teacher_user_id,
        la.section_id,
        sec.academic_year_grade_id,
        la.title,
        la.activity_type::text AS activity_type,
        la.due_at,
        sec.section_name,
        sub.subject_name
      FROM public.learning_activities la
      JOIN public.sections sec ON sec.section_id = la.section_id
      JOIN public.academic_year_grade_subjects aygs
        ON aygs.academic_year_grade_subject_id = la.academic_year_grade_subject_id
      JOIN public.subjects sub ON sub.subject_id = aygs.subject_id
      JOIN public.staff st ON st.staff_id = la.created_by_staff_id
      WHERE la.org_id = ${orgId}::uuid
        AND la.activity_id = ${activityId}::uuid
      LIMIT 1
    `;
    const meta = metaRows[0];
    if (!meta) return null;

    const studentFilter =
      specificStudentIds && specificStudentIds.length > 0
        ? Prisma.sql`AND s.student_id = ANY(${specificStudentIds}::uuid[])`
        : Prisma.empty;

    const audienceRows = await prisma.$queryRaw<any[]>`
      SELECT DISTINCT
        s.user_id AS student_user_id,
        p.user_id AS parent_user_id
      FROM public.student_enrollments se
      JOIN public.students s ON s.student_id = se.student_id
      LEFT JOIN public.student_parents sp ON sp.student_id = s.student_id
      LEFT JOIN public.parents p ON p.parent_id = sp.parent_id AND p.org_id = ${orgId}::uuid
      WHERE s.org_id = ${orgId}::uuid
        AND se.section_id = ${meta.section_id}::uuid
        AND se.academic_year_grade_id = ${meta.academic_year_grade_id}::uuid
        AND se.status = 'active'
        ${studentFilter}
    `;

    const studentUserSet = new Set<string>();
    const parentUserSet = new Set<string>();
    for (const row of audienceRows) {
      if (row.student_user_id) studentUserSet.add(row.student_user_id);
      if (row.parent_user_id) parentUserSet.add(row.parent_user_id);
    }

    return {
      teacherUserId: meta.teacher_user_id || null,
      studentUserIds: Array.from(studentUserSet),
      parentUserIds: Array.from(parentUserSet),
      title: meta.title,
      activityType: meta.activity_type,
      subjectName: meta.subject_name,
      sectionName: meta.section_name,
      dueAt: toIso(meta.due_at),
    };
  }

  static async getTeacherOverview(
    orgId: string,
    staffId: string,
  ): Promise<TeacherLearningOverviewDto> {
    const [countsRows, pendingSubs, recent] = await Promise.all([
      prisma.$queryRaw<any[]>`
        SELECT
          COUNT(*)::int AS total_activities,
          COUNT(*) FILTER (WHERE activity_status = 'draft')::int AS draft_count,
          COUNT(*) FILTER (WHERE activity_status = 'published')::int AS published_count,
          COUNT(*) FILTER (WHERE activity_status = 'closed')::int AS closed_count,
          COUNT(*) FILTER (WHERE activity_type = 'homework')::int AS homework_count,
          COUNT(*) FILTER (WHERE activity_type = 'project')::int AS project_count,
          (
            SELECT COUNT(*)::int
            FROM public.learning_activity_submissions s
            JOIN public.learning_activities la2 ON la2.activity_id = s.activity_id
            WHERE la2.org_id = ${orgId}::uuid
              AND la2.created_by_staff_id = ${staffId}::uuid
              AND s.submission_status IN ('submitted', 'under_review')
          ) AS pending_reviews_count,
          (
            SELECT COUNT(*)::int
            FROM public.learning_activity_submissions s
            JOIN public.learning_activities la2 ON la2.activity_id = s.activity_id
            WHERE la2.org_id = ${orgId}::uuid
              AND la2.created_by_staff_id = ${staffId}::uuid
              AND s.submission_status = 'resubmission_requested'
          ) AS resubmissions_requested_count
        FROM public.learning_activities
        WHERE org_id = ${orgId}::uuid
          AND created_by_staff_id = ${staffId}::uuid
      `,
      this.listActivitySubmissionsForTeacher({
        orgId,
        staffId,
        filters: { page: 1, limit: 8 },
      }),
      this.listActivities({
        orgId,
        staffId,
        filters: { page: 1, limit: 6 },
      }),
    ]);

    const c = countsRows[0] || {};
    return {
      staff_id: staffId,
      total_activities: Number(c.total_activities || 0),
      draft_count: Number(c.draft_count || 0),
      published_count: Number(c.published_count || 0),
      closed_count: Number(c.closed_count || 0),
      homework_count: Number(c.homework_count || 0),
      project_count: Number(c.project_count || 0),
      pending_reviews_count: Number(c.pending_reviews_count || 0),
      resubmissions_requested_count: Number(c.resubmissions_requested_count || 0),
      recent_activities: recent.items,
      pending_submissions: pendingSubs.items.filter(
        (s) => s.submission_status === 'submitted' || s.submission_status === 'under_review',
      ),
    };
  }

  static async getStudentOverview(
    orgId: string,
    student: StudentContextRow,
  ): Promise<StudentLearningOverviewDto> {
    if (!student.section_id) {
      return {
        student_id: student.student_id,
        student_name: student.full_name,
        grade_name: student.grade_name,
        section_name: student.section_name,
        total_assigned: 0,
        homework_count: 0,
        project_count: 0,
        pending_projects_count: 0,
        submitted_count: 0,
        under_review_count: 0,
        resubmission_requested_count: 0,
        reviewed_count: 0,
        overdue_count: 0,
        upcoming_activities: [],
      };
    }

    const [statsRows, upcoming] = await Promise.all([
      prisma.$queryRaw<any[]>`
        WITH section_acts AS (
          SELECT
            la.activity_id,
            la.activity_type::text AS activity_type,
            la.activity_status::text AS activity_status,
            la.due_at,
            (
              SELECT ls.submission_status::text
              FROM public.learning_activity_submissions ls
              WHERE ls.activity_id = la.activity_id
                AND ls.student_id = ${student.student_id}::uuid
              ORDER BY ls.attempt_number DESC
              LIMIT 1
            ) AS latest_status
          FROM public.learning_activities la
          WHERE la.org_id = ${orgId}::uuid
            AND la.section_id = ${student.section_id}::uuid
            AND la.activity_status IN ('published'::public.s32_activity_status, 'closed'::public.s32_activity_status)
        )
        SELECT
          COUNT(*)::int AS total_assigned,
          COUNT(*) FILTER (WHERE activity_type = 'homework')::int AS homework_count,
          COUNT(*) FILTER (WHERE activity_type = 'project')::int AS project_count,
          COUNT(*) FILTER (
            WHERE activity_type = 'project'
              AND activity_status = 'published'
              AND (latest_status IS NULL OR latest_status = 'resubmission_requested')
          )::int AS pending_projects_count,
          COUNT(*) FILTER (WHERE latest_status = 'submitted')::int AS submitted_count,
          COUNT(*) FILTER (WHERE latest_status = 'under_review')::int AS under_review_count,
          COUNT(*) FILTER (WHERE latest_status = 'resubmission_requested')::int AS resubmission_requested_count,
          COUNT(*) FILTER (WHERE latest_status = 'reviewed')::int AS reviewed_count,
          COUNT(*) FILTER (
            WHERE activity_type = 'project'
              AND activity_status = 'published'
              AND due_at <= now()
              AND latest_status IS NULL
          )::int AS overdue_count
        FROM section_acts
      `,
      this.listActivities({
        orgId,
        sectionId: student.section_id,
        studentId: student.student_id,
        onlyVisibleToStudents: true,
        filters: { page: 1, limit: 8 },
      }),
    ]);

    const s = statsRows[0] || {};
    return {
      student_id: student.student_id,
      student_name: student.full_name,
      grade_name: student.grade_name,
      section_name: student.section_name,
      total_assigned: Number(s.total_assigned || 0),
      homework_count: Number(s.homework_count || 0),
      project_count: Number(s.project_count || 0),
      pending_projects_count: Number(s.pending_projects_count || 0),
      submitted_count: Number(s.submitted_count || 0),
      under_review_count: Number(s.under_review_count || 0),
      resubmission_requested_count: Number(s.resubmission_requested_count || 0),
      reviewed_count: Number(s.reviewed_count || 0),
      overdue_count: Number(s.overdue_count || 0),
      upcoming_activities: upcoming.items,
    };
  }

  static async getParentChildOverview(
    orgId: string,
    child: StudentContextRow,
  ): Promise<ParentChildLearningOverviewDto> {
    const stuOverview = await this.getStudentOverview(orgId, child);
    return {
      child: {
        student_id: child.student_id,
        full_name: child.full_name,
        admission_no: child.admission_no,
        grade_name: child.grade_name,
        section_name: child.section_name,
        academic_year_name: child.academic_year_name,
      },
      total_assigned: stuOverview.total_assigned,
      homework_count: stuOverview.homework_count,
      project_count: stuOverview.project_count,
      pending_projects_count: stuOverview.pending_projects_count,
      submitted_count: stuOverview.submitted_count,
      resubmission_requested_count: stuOverview.resubmission_requested_count,
      reviewed_count: stuOverview.reviewed_count,
      overdue_count: stuOverview.overdue_count,
      recent_activities: stuOverview.upcoming_activities,
    };
  }

  static async getAdminOverview(orgId: string): Promise<AdminLearningOverviewDto> {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT
        COUNT(*)::int AS total_activities,
        COUNT(*) FILTER (WHERE activity_status = 'draft')::int AS draft_count,
        COUNT(*) FILTER (WHERE activity_status = 'published')::int AS published_count,
        COUNT(*) FILTER (WHERE activity_status = 'closed')::int AS closed_count,
        COUNT(*) FILTER (WHERE activity_status = 'published' AND due_at <= now())::int AS overdue_published_count,
        COUNT(*) FILTER (WHERE activity_type = 'homework')::int AS homework_count,
        COUNT(*) FILTER (WHERE activity_type = 'project')::int AS project_count,
        (
          SELECT COUNT(*)::int
          FROM public.learning_activity_submissions s
          WHERE s.org_id = ${orgId}::uuid
        ) AS total_submissions,
        (
          SELECT COUNT(*)::int
          FROM public.learning_activity_submissions s
          WHERE s.org_id = ${orgId}::uuid
            AND s.submission_status IN ('submitted', 'under_review')
        ) AS pending_reviews_count,
        (
          SELECT COUNT(*)::int
          FROM public.learning_activity_submissions s
          WHERE s.org_id = ${orgId}::uuid
            AND s.submission_status = 'resubmission_requested'
        ) AS resubmission_requested_count,
        (
          SELECT COUNT(*)::int
          FROM public.learning_activity_submissions s
          WHERE s.org_id = ${orgId}::uuid
            AND s.submission_status = 'reviewed'
        ) AS reviewed_count,
        (
          SELECT COUNT(*)::int
          FROM public.learning_activity_submissions s
          WHERE s.org_id = ${orgId}::uuid
            AND s.is_late = true
        ) AS late_submissions_count
      FROM public.learning_activities
      WHERE org_id = ${orgId}::uuid
    `;
    const r = rows[0] || {};
    return {
      org_id: orgId,
      total_activities: Number(r.total_activities || 0),
      draft_count: Number(r.draft_count || 0),
      published_count: Number(r.published_count || 0),
      closed_count: Number(r.closed_count || 0),
      overdue_published_count: Number(r.overdue_published_count || 0),
      homework_count: Number(r.homework_count || 0),
      project_count: Number(r.project_count || 0),
      total_submissions: Number(r.total_submissions || 0),
      pending_reviews_count: Number(r.pending_reviews_count || 0),
      resubmission_requested_count: Number(r.resubmission_requested_count || 0),
      reviewed_count: Number(r.reviewed_count || 0),
      late_submissions_count: Number(r.late_submissions_count || 0),
    };
  }

  static async getAdminFilterOptions(orgId: string) {
    const [years, sections] = await Promise.all([
      prisma.$queryRaw<any[]>`
        SELECT academic_year_id, academic_year_name, status::text AS status
        FROM public.academic_years
        WHERE org_id = ${orgId}::uuid
        ORDER BY start_date DESC
      `,
      prisma.$queryRaw<any[]>`
        SELECT
          sec.section_id,
          sec.section_name,
          gr.grade_name,
          ayg.academic_year_id
        FROM public.sections sec
        JOIN public.academic_year_grades ayg ON ayg.academic_year_grade_id = sec.academic_year_grade_id
        JOIN public.academic_years ay ON ay.academic_year_id = ayg.academic_year_id
        JOIN public.grades gr ON gr.grade_id = ayg.grade_id
        WHERE ay.org_id = ${orgId}::uuid
        ORDER BY gr.display_order ASC, sec.section_name ASC
      `,
    ]);
    return { academic_years: years, sections };
  }
}
