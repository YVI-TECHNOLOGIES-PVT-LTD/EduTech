import prisma from '../../lib/prismaClient';
import { StorageService } from '../../services/storage.service';
import {
  AttendanceStatsSummary,
  ClassroomAttendanceStatus,
  ClassroomDeliveryMode,
  ClassroomParticipationMode,
  ClassroomRosterStudentDto,
  ClassroomSessionDto,
  ClassroomSessionStatus,
  ClassroomTeachingApproach,
  FlippedPreparationDto,
  FlippedPreparationResourceDto,
  FlippedPreparationOutcomeDto,
  FlippedPreparationQuestionDto,
  FlippedInClassActivityDto,
  FlippedPostClassActivityDto,
} from './classroom.types';

type SqlExecutor = Pick<typeof prisma, '$queryRawUnsafe' | '$executeRawUnsafe'>;

export interface TeacherStaffContext {
  staff_id: string;
  org_id: string;
  user_id: string | null;
  full_name: string;
}

export interface FacultyAssignmentContext {
  faculty_assignment_id: string;
  section_id: string;
  academic_year_grade_subject_id: string;
  academic_year_grade_id: string;
  academic_year_id: string;
  academic_year_start_date: string;
  academic_year_end_date: string;
  staff_id: string;
  teacher_user_id: string | null;
  org_id: string;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
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
  grade_id: string | null;
  grade_name: string | null;
  grade_code: string | null;
  academic_year_grade_id: string | null;
  academic_year_id: string | null;
  academic_year_name: string | null;
}

export interface SessionListFilters {
  status?: ClassroomSessionStatus;
  delivery_mode?: ClassroomDeliveryMode;
  teaching_approach?: ClassroomTeachingApproach;
  section_id?: string;
  subject_id?: string;
  academic_year_id?: string;
  date_from?: string;
  date_to?: string;
  view?: 'all' | 'live' | 'upcoming' | 'past' | 'today';
  search?: string;
  page: number;
  limit: number;
}

function buildSessionBaseSelect(includeMeetingUrl: boolean): string {
  const meetingSelect = includeMeetingUrl ? 'cs.meeting_url,' : 'NULL::varchar AS meeting_url,';
  return `
    SELECT
      cs.session_id,
      cs.org_id,
      cs.academic_year_id,
      ay.academic_year_name,
      cs.timetable_entry_id,
      cs.creation_method::text AS creation_method,
      cs.section_id,
      sec.section_name,
      gr.grade_id,
      gr.grade_name,
      gr.grade_code,
      cs.academic_year_grade_subject_id,
      sub.subject_id,
      sub.subject_name,
      sub.subject_code,
      cs.faculty_assignment_id,
      fa.staff_id AS teacher_staff_id,
      st.user_id AS teacher_user_id,
      COALESCE(
        NULLIF(TRIM(CONCAT(COALESCE(tu.first_name, ''), ' ', COALESCE(tu.last_name, ''))), ''),
        tu.email,
        st.employee_code,
        'Faculty'
      ) AS teacher_name,
      cs.lesson_plan_id,
      lp.lesson_title,
      cs.classroom_id,
      cr.room_name AS classroom_name,
      cr.room_code AS classroom_code,
      to_char(cs.session_date, 'YYYY-MM-DD') AS session_date,
      to_char(cs.scheduled_start_time, 'HH24:MI:SS') AS scheduled_start_time,
      to_char(cs.scheduled_end_time, 'HH24:MI:SS') AS scheduled_end_time,
      cs.actual_start_at,
      cs.actual_end_at,
      cs.delivery_mode::text AS delivery_mode,
      cs.teaching_approach::text AS teaching_approach,
      ${meetingSelect}
      (cs.meeting_url IS NOT NULL AND btrim(cs.meeting_url) <> '') AS has_meeting_url,
      cs.session_status::text AS session_status,
      cs.topics_covered,
      cs.teacher_remarks,
      cs.not_conducted_reason,
      cs.created_at,
      cs.updated_at,
      (
        SELECT COUNT(*)::int
        FROM student_enrollments se
        WHERE se.section_id = cs.section_id
          AND se.academic_year_grade_id = sec.academic_year_grade_id
          AND se.status = 'active'
          AND se.enrollment_date <= cs.session_date
          AND (se.exit_date IS NULL OR se.exit_date >= cs.session_date)
      ) AS enrolled_count,
      COUNT(att.session_attendance_id)::int AS marked_count,
      COUNT(*) FILTER (WHERE att.attendance_status = 'present')::int AS present_count,
      COUNT(*) FILTER (WHERE att.attendance_status = 'late')::int AS late_count,
      COUNT(*) FILTER (WHERE att.attendance_status = 'absent')::int AS absent_count,
      COUNT(*) FILTER (WHERE att.attendance_status = 'excused')::int AS excused_count
    FROM classroom_sessions cs
    JOIN academic_years ay ON ay.academic_year_id = cs.academic_year_id
    JOIN sections sec ON sec.section_id = cs.section_id
    JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = sec.academic_year_grade_id
    JOIN grades gr ON gr.grade_id = ayg.grade_id
    JOIN academic_year_grade_subjects aygs ON aygs.academic_year_grade_subject_id = cs.academic_year_grade_subject_id
    JOIN subjects sub ON sub.subject_id = aygs.subject_id
    JOIN section_subject_faculty_assignments fa ON fa.faculty_assignment_id = cs.faculty_assignment_id
    JOIN staff st ON st.staff_id = fa.staff_id
    LEFT JOIN users tu ON tu.user_id = st.user_id
    LEFT JOIN lesson_plans lp ON lp.lesson_plan_id = cs.lesson_plan_id
    LEFT JOIN classrooms cr ON cr.classroom_id = cs.classroom_id
    LEFT JOIN classroom_session_attendance att ON att.session_id = cs.session_id
  `;
}

const SESSION_GROUP_BY = `
  GROUP BY
    cs.session_id,
    ay.academic_year_name,
    sec.section_name,
    sec.academic_year_grade_id,
    gr.grade_id,
    gr.grade_name,
    gr.grade_code,
    sub.subject_id,
    sub.subject_name,
    sub.subject_code,
    fa.staff_id,
    st.user_id,
    tu.first_name,
    tu.last_name,
    tu.email,
    st.employee_code,
    lp.lesson_title,
    cr.room_name,
    cr.room_code
`;

function toIsoOrNull(val: any): string | null {
  if (!val) return null;
  const d = val instanceof Date ? val : new Date(val);
  return Number.isNaN(d.getTime()) ? String(val) : d.toISOString();
}

function mapSessionRow(row: any): ClassroomSessionDto {
  const enrolledCount = Number(row.enrolled_count || 0);
  const markedCount = Number(row.marked_count || 0);
  return {
    session_id: row.session_id,
    org_id: row.org_id,
    academic_year_id: row.academic_year_id,
    academic_year_name: row.academic_year_name,
    timetable_entry_id: row.timetable_entry_id || null,
    creation_method: row.creation_method,
    section_id: row.section_id,
    section_name: row.section_name,
    grade_id: row.grade_id,
    grade_name: row.grade_name,
    grade_code: row.grade_code,
    academic_year_grade_subject_id: row.academic_year_grade_subject_id,
    subject_id: row.subject_id,
    subject_name: row.subject_name,
    subject_code: row.subject_code,
    faculty_assignment_id: row.faculty_assignment_id,
    teacher_staff_id: row.teacher_staff_id,
    teacher_user_id: row.teacher_user_id || null,
    teacher_name: row.teacher_name || 'Faculty',
    lesson_plan_id: row.lesson_plan_id || null,
    lesson_title: row.lesson_title || null,
    classroom_id: row.classroom_id || null,
    classroom_name: row.classroom_name || null,
    classroom_code: row.classroom_code || null,
    session_date: String(row.session_date),
    scheduled_start_time: String(row.scheduled_start_time),
    scheduled_end_time: String(row.scheduled_end_time),
    actual_start_at: toIsoOrNull(row.actual_start_at),
    actual_end_at: toIsoOrNull(row.actual_end_at),
    delivery_mode: row.delivery_mode,
    teaching_approach: row.teaching_approach,
    meeting_url: row.meeting_url || null,
    has_meeting_url: Boolean(row.has_meeting_url),
    session_status: row.session_status,
    topics_covered: row.topics_covered || null,
    teacher_remarks: row.teacher_remarks || null,
    not_conducted_reason: row.not_conducted_reason || null,
    created_at: toIsoOrNull(row.created_at) || '',
    updated_at: toIsoOrNull(row.updated_at) || '',
    attendance_summary: {
      enrolled_count: enrolledCount,
      marked_count: markedCount,
      unmarked_count: Math.max(0, enrolledCount - markedCount),
      present_count: Number(row.present_count || 0),
      late_count: Number(row.late_count || 0),
      absent_count: Number(row.absent_count || 0),
      excused_count: Number(row.excused_count || 0),
    },
  };
}

function buildFilterClauses(
  filters: SessionListFilters,
  params: any[],
  options: { alias?: string } = {},
): string[] {
  const alias = options.alias || 'cs';
  const clauses: string[] = [];

  if (filters.status) {
    params.push(filters.status);
    clauses.push(`${alias}.session_status = $${params.length}::classroom_session_status`);
  }
  if (filters.delivery_mode) {
    params.push(filters.delivery_mode);
    clauses.push(`${alias}.delivery_mode = $${params.length}::classroom_delivery_mode`);
  }
  if (filters.teaching_approach) {
    params.push(filters.teaching_approach);
    clauses.push(`${alias}.teaching_approach = $${params.length}::classroom_teaching_approach`);
  }
  if (filters.section_id) {
    params.push(filters.section_id);
    clauses.push(`${alias}.section_id = $${params.length}::uuid`);
  }
  if (filters.subject_id) {
    params.push(filters.subject_id);
    clauses.push(`sub.subject_id = $${params.length}::uuid`);
  }
  if (filters.academic_year_id) {
    params.push(filters.academic_year_id);
    clauses.push(`${alias}.academic_year_id = $${params.length}::uuid`);
  }
  if (filters.date_from) {
    params.push(filters.date_from);
    clauses.push(`${alias}.session_date >= $${params.length}::date`);
  }
  if (filters.date_to) {
    params.push(filters.date_to);
    clauses.push(`${alias}.session_date <= $${params.length}::date`);
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    const idx = `$${params.length}`;
    clauses.push(
      `(sub.subject_name ILIKE ${idx} OR sub.subject_code ILIKE ${idx} OR sec.section_name ILIKE ${idx} OR gr.grade_name ILIKE ${idx} OR COALESCE(${alias}.topics_covered, '') ILIKE ${idx} OR COALESCE(lp.lesson_title, '') ILIKE ${idx})`,
    );
  }

  switch (filters.view) {
    case 'live':
      clauses.push(`${alias}.session_status = 'in_progress'::classroom_session_status`);
      break;
    case 'upcoming':
      clauses.push(
        `(${alias}.session_status = 'in_progress'::classroom_session_status OR (${alias}.session_status = 'scheduled'::classroom_session_status AND ${alias}.session_date >= CURRENT_DATE))`,
      );
      break;
    case 'today':
      clauses.push(`${alias}.session_date = CURRENT_DATE`);
      break;
    case 'past':
      clauses.push(
        `(${alias}.session_status IN ('completed'::classroom_session_status, 'cancelled'::classroom_session_status, 'not_conducted'::classroom_session_status) OR (${alias}.session_status = 'scheduled'::classroom_session_status AND ${alias}.session_date < CURRENT_DATE))`,
      );
      break;
    default:
      break;
  }

  return clauses;
}

export class ClassroomRepository {
  static async findTeacherStaffByUserId(
    orgId: string,
    userId: string,
  ): Promise<TeacherStaffContext | null> {
    const rows: any[] = await prisma.$queryRawUnsafe(
      `
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
      FROM staff st
      LEFT JOIN users u ON u.user_id = st.user_id
      WHERE st.org_id = $1::uuid
        AND st.user_id = $2::uuid
        AND st.is_active = true
      LIMIT 1
      `,
      orgId,
      userId,
    );
    return rows[0] || null;
  }

  static async findStudentByUserId(
    orgId: string,
    userId: string,
  ): Promise<StudentContextRow | null> {
    const rows: any[] = await prisma.$queryRawUnsafe(
      `
      SELECT
        s.student_id,
        s.org_id,
        s.user_id,
        COALESCE(
          NULLIF(TRIM(CONCAT(COALESCE(s.first_name, ''), ' ', COALESCE(s.last_name, ''))), ''),
          s.admission_no,
          'Student'
        ) AS full_name,
        s.admission_no,
        se.enrollment_id,
        se.section_id,
        sec.section_name,
        gr.grade_id,
        gr.grade_name,
        gr.grade_code,
        ayg.academic_year_grade_id,
        ay.academic_year_id,
        ay.academic_year_name
      FROM students s
      LEFT JOIN student_enrollments se
        ON se.student_id = s.student_id
        AND se.status = 'active'
      LEFT JOIN sections sec ON sec.section_id = se.section_id
      LEFT JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = se.academic_year_grade_id
      LEFT JOIN grades gr ON gr.grade_id = ayg.grade_id
      LEFT JOIN academic_years ay ON ay.academic_year_id = ayg.academic_year_id
      WHERE s.org_id = $1::uuid
        AND s.user_id = $2::uuid
      ORDER BY
        (CASE WHEN ay.status IN ('teaching', 'open') THEN 0 ELSE 1 END) ASC,
        se.enrollment_date DESC NULLS LAST,
        se.created_at DESC NULLS LAST
      LIMIT 1
      `,
      orgId,
      userId,
    );
    return rows[0] || null;
  }

  static async verifyStudentEnrollmentForSession(
    orgId: string,
    studentId: string,
    sectionId: string,
    academicYearGradeId: string,
    sessionDate: string,
  ): Promise<{ enrollment_id: string } | null> {
    const rows: any[] = await prisma.$queryRawUnsafe(
      `
      SELECT se.enrollment_id
      FROM student_enrollments se
      JOIN students s ON s.student_id = se.student_id
      WHERE s.org_id = $1::uuid
        AND se.student_id = $2::uuid
        AND se.section_id = $3::uuid
        AND se.academic_year_grade_id = $4::uuid
        AND se.status = 'active'
        AND se.enrollment_date <= $5::date
        AND (se.exit_date IS NULL OR se.exit_date >= $5::date)
      ORDER BY se.enrollment_date DESC
      LIMIT 1
      `,
      orgId,
      studentId,
      sectionId,
      academicYearGradeId,
      sessionDate,
    );
    return rows[0] || null;
  }

  static async verifyParentChildOwnership(
    orgId: string,
    userId: string,
    email: string | null,
    childStudentId: string,
  ): Promise<StudentContextRow | null> {
    const rows: any[] = await prisma.$queryRawUnsafe(
      `
      SELECT
        s.student_id,
        s.org_id,
        s.user_id,
        COALESCE(
          NULLIF(TRIM(CONCAT(COALESCE(s.first_name, ''), ' ', COALESCE(s.last_name, ''))), ''),
          s.admission_no,
          'Student'
        ) AS full_name,
        s.admission_no,
        se.enrollment_id,
        se.section_id,
        sec.section_name,
        gr.grade_id,
        gr.grade_name,
        gr.grade_code,
        ayg.academic_year_grade_id,
        ay.academic_year_id,
        ay.academic_year_name
      FROM parents p
      JOIN student_parents sp ON sp.parent_id = p.parent_id
      JOIN students s ON s.student_id = sp.student_id
      LEFT JOIN student_enrollments se
        ON se.student_id = s.student_id
        AND se.status = 'active'
      LEFT JOIN sections sec ON sec.section_id = se.section_id
      LEFT JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = se.academic_year_grade_id
      LEFT JOIN grades gr ON gr.grade_id = ayg.grade_id
      LEFT JOIN academic_years ay ON ay.academic_year_id = ayg.academic_year_id
      WHERE p.org_id = $1::uuid
        AND s.org_id = $1::uuid
        AND s.student_id = $4::uuid
        AND (
          p.user_id = $2::uuid
          OR ($3::text IS NOT NULL AND LOWER(COALESCE(p.email, '')) = LOWER($3::text))
        )
      ORDER BY
        (CASE WHEN ay.status IN ('teaching', 'open') THEN 0 ELSE 1 END) ASC,
        se.enrollment_date DESC NULLS LAST,
        se.created_at DESC NULLS LAST
      LIMIT 1
      `,
      orgId,
      userId,
      email || null,
      childStudentId,
    );
    return rows[0] || null;
  }

  static async findFacultyAssignmentOwnedByStaff(
    orgId: string,
    staffId: string,
    facultyAssignmentId: string,
  ): Promise<FacultyAssignmentContext | null> {
    const rows: any[] = await prisma.$queryRawUnsafe(
      `
      SELECT
        fa.faculty_assignment_id,
        fa.section_id,
        fa.academic_year_grade_subject_id,
        ayg.academic_year_grade_id,
        ayg.academic_year_id,
        to_char(ay.start_date, 'YYYY-MM-DD') AS academic_year_start_date,
        to_char(ay.end_date, 'YYYY-MM-DD') AS academic_year_end_date,
        fa.staff_id,
        st.user_id AS teacher_user_id,
        st.org_id,
        to_char(fa.effective_from, 'YYYY-MM-DD') AS effective_from,
        CASE WHEN fa.effective_to IS NULL THEN NULL ELSE to_char(fa.effective_to, 'YYYY-MM-DD') END AS effective_to,
        fa.is_active
      FROM section_subject_faculty_assignments fa
      JOIN staff st ON st.staff_id = fa.staff_id
      JOIN sections sec ON sec.section_id = fa.section_id
      JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = sec.academic_year_grade_id
      JOIN academic_years ay ON ay.academic_year_id = ayg.academic_year_id
      WHERE fa.faculty_assignment_id = $1::uuid
        AND st.org_id = $2::uuid
        AND ay.org_id = $2::uuid
        AND fa.staff_id = $3::uuid
      LIMIT 1
      `,
      facultyAssignmentId,
      orgId,
      staffId,
    );
    return rows[0] || null;
  }

  static async verifyClassroomInOrg(
    orgId: string,
    classroomId: string,
  ): Promise<{ classroom_id: string; is_active: boolean } | null> {
    const rows: any[] = await prisma.$queryRawUnsafe(
      `
      SELECT classroom_id, is_active
      FROM classrooms
      WHERE org_id = $1::uuid
        AND classroom_id = $2::uuid
      LIMIT 1
      `,
      orgId,
      classroomId,
    );
    return rows[0] || null;
  }

  static async verifyLessonPlanOwnedByStaff(
    staffId: string,
    lessonPlanId: string,
  ): Promise<{ lesson_plan_id: string; teacher_staff_id: string } | null> {
    const rows: any[] = await prisma.$queryRawUnsafe(
      `
      SELECT lesson_plan_id, teacher_staff_id
      FROM lesson_plans
      WHERE lesson_plan_id = $1::uuid
        AND teacher_staff_id = $2::uuid
      LIMIT 1
      `,
      lessonPlanId,
      staffId,
    );
    return rows[0] || null;
  }

  static async checkSessionConflicts(input: {
    orgId: string;
    staffId: string;
    sectionId: string;
    classroomId?: string | null;
    sessionDate: string;
    startTime: string;
    endTime: string;
    excludeSessionId?: string | null;
  }): Promise<{
    conflictType: 'teacher' | 'section' | 'classroom';
    conflictingSessionId: string;
  } | null> {
    const rows: any[] = await prisma.$queryRawUnsafe(
      `
      SELECT
        cs.session_id,
        CASE
          WHEN fa.staff_id = $2::uuid THEN 'teacher'
          WHEN cs.section_id = $3::uuid THEN 'section'
          WHEN $4::uuid IS NOT NULL AND cs.classroom_id = $4::uuid THEN 'classroom'
        END AS conflict_type
      FROM classroom_sessions cs
      JOIN section_subject_faculty_assignments fa ON fa.faculty_assignment_id = cs.faculty_assignment_id
      WHERE cs.org_id = $1::uuid
        AND cs.session_date = $5::date
        AND cs.session_status NOT IN ('cancelled'::classroom_session_status, 'not_conducted'::classroom_session_status)
        AND cs.scheduled_start_time < $7::time
        AND cs.scheduled_end_time > $6::time
        AND ($8::uuid IS NULL OR cs.session_id <> $8::uuid)
        AND (
          fa.staff_id = $2::uuid
          OR cs.section_id = $3::uuid
          OR ($4::uuid IS NOT NULL AND cs.classroom_id = $4::uuid)
        )
      ORDER BY
        CASE
          WHEN fa.staff_id = $2::uuid THEN 1
          WHEN cs.section_id = $3::uuid THEN 2
          ELSE 3
        END
      LIMIT 1
      `,
      input.orgId,
      input.staffId,
      input.sectionId,
      input.classroomId || null,
      input.sessionDate,
      input.startTime,
      input.endTime,
      input.excludeSessionId || null,
    );

    if (!rows[0]) return null;
    return {
      conflictType: rows[0].conflict_type,
      conflictingSessionId: rows[0].session_id,
    };
  }

  static async createManualSession(
    input: {
      orgId: string;
      academicYearId: string;
      sectionId: string;
      academicYearGradeSubjectId: string;
      facultyAssignmentId: string;
      lessonPlanId: string | null;
      classroomId: string | null;
      sessionDate: string;
      scheduledStartTime: string;
      scheduledEndTime: string;
      deliveryMode: ClassroomDeliveryMode;
      teachingApproach: ClassroomTeachingApproach;
      meetingUrl: string | null;
      topicsCovered: string | null;
      teacherRemarks: string | null;
      actorUserId: string;
    },
    executor: SqlExecutor = prisma,
  ): Promise<string> {
    const rows: any[] = await executor.$queryRawUnsafe(
      `
      INSERT INTO classroom_sessions (
        org_id,
        academic_year_id,
        timetable_entry_id,
        creation_method,
        section_id,
        academic_year_grade_subject_id,
        faculty_assignment_id,
        lesson_plan_id,
        classroom_id,
        session_date,
        scheduled_start_time,
        scheduled_end_time,
        delivery_mode,
        teaching_approach,
        meeting_url,
        session_status,
        topics_covered,
        teacher_remarks,
        created_by,
        updated_by
      ) VALUES (
        $1::uuid,
        $2::uuid,
        NULL,
        'manual'::classroom_session_creation_method,
        $3::uuid,
        $4::uuid,
        $5::uuid,
        $6::uuid,
        $7::uuid,
        $8::date,
        $9::time,
        $10::time,
        $11::classroom_delivery_mode,
        $12::classroom_teaching_approach,
        $13::varchar,
        'scheduled'::classroom_session_status,
        $14::text,
        $15::text,
        $16::uuid,
        $16::uuid
      )
      RETURNING session_id
      `,
      input.orgId,
      input.academicYearId,
      input.sectionId,
      input.academicYearGradeSubjectId,
      input.facultyAssignmentId,
      input.lessonPlanId,
      input.classroomId,
      input.sessionDate,
      input.scheduledStartTime,
      input.scheduledEndTime,
      input.deliveryMode,
      input.teachingApproach,
      input.meetingUrl,
      input.topicsCovered,
      input.teacherRemarks,
      input.actorUserId,
    );
    return rows[0].session_id;
  }

  static async findRawSessionOwnedByTeacher(
    orgId: string,
    staffId: string,
    sessionId: string,
  ): Promise<any | null> {
    const rows: any[] = await prisma.$queryRawUnsafe(
      `
      SELECT
        cs.session_id,
        cs.org_id,
        cs.academic_year_id,
        cs.section_id,
        sec.academic_year_grade_id,
        cs.academic_year_grade_subject_id,
        cs.faculty_assignment_id,
        fa.staff_id,
        st.user_id AS teacher_user_id,
        cs.lesson_plan_id,
        cs.classroom_id,
        to_char(cs.session_date, 'YYYY-MM-DD') AS session_date,
        to_char(cs.scheduled_start_time, 'HH24:MI:SS') AS scheduled_start_time,
        to_char(cs.scheduled_end_time, 'HH24:MI:SS') AS scheduled_end_time,
        cs.actual_start_at,
        cs.actual_end_at,
        cs.delivery_mode::text AS delivery_mode,
        cs.teaching_approach::text AS teaching_approach,
        cs.meeting_url,
        cs.session_status::text AS session_status,
        cs.topics_covered,
        cs.teacher_remarks,
        cs.not_conducted_reason
      FROM classroom_sessions cs
      JOIN sections sec ON sec.section_id = cs.section_id
      JOIN section_subject_faculty_assignments fa ON fa.faculty_assignment_id = cs.faculty_assignment_id
      JOIN staff st ON st.staff_id = fa.staff_id
      WHERE cs.org_id = $1::uuid
        AND cs.session_id = $2::uuid
        AND fa.staff_id = $3::uuid
      LIMIT 1
      `,
      orgId,
      sessionId,
      staffId,
    );
    return rows[0] || null;
  }

  static async findSessionByIdInOrg(orgId: string, sessionId: string): Promise<any | null> {
    const rows: any[] = await prisma.$queryRawUnsafe(
      `
      SELECT
        cs.session_id,
        cs.org_id,
        cs.section_id,
        sec.academic_year_grade_id,
        cs.faculty_assignment_id,
        fa.staff_id,
        st.user_id AS teacher_user_id,
        to_char(cs.session_date, 'YYYY-MM-DD') AS session_date,
        to_char(cs.scheduled_start_time, 'HH24:MI:SS') AS scheduled_start_time,
        to_char(cs.scheduled_end_time, 'HH24:MI:SS') AS scheduled_end_time,
        cs.delivery_mode::text AS delivery_mode,
        cs.session_status::text AS session_status,
        cs.meeting_url
      FROM classroom_sessions cs
      JOIN sections sec ON sec.section_id = cs.section_id
      JOIN section_subject_faculty_assignments fa ON fa.faculty_assignment_id = cs.faculty_assignment_id
      JOIN staff st ON st.staff_id = fa.staff_id
      WHERE cs.org_id = $1::uuid
        AND cs.session_id = $2::uuid
      LIMIT 1
      `,
      orgId,
      sessionId,
    );
    return rows[0] || null;
  }

  static async getSessionDtoById(
    orgId: string,
    sessionId: string,
    includeMeetingUrl = true,
    includeFlippedPrep = false,
  ): Promise<ClassroomSessionDto | null> {
    const sql = `
      ${buildSessionBaseSelect(includeMeetingUrl)}
      WHERE cs.org_id = $1::uuid
        AND cs.session_id = $2::uuid
      ${SESSION_GROUP_BY}
      LIMIT 1
    `;
    const rows: any[] = await prisma.$queryRawUnsafe(sql, orgId, sessionId);
    if (!rows[0]) return null;
    const dto = mapSessionRow(rows[0]);
    if (includeFlippedPrep && dto.lesson_plan_id) {
      dto.flipped_preparation = await this.getFlippedPreparation(
        orgId,
        dto.lesson_plan_id,
        dto.section_id,
        `${dto.session_date} ${dto.scheduled_start_time}`,
      );
    }
    return dto;
  }

  static async updateSessionMetadata(input: {
    orgId: string;
    sessionId: string;
    actorUserId: string;
    sessionDate: string;
    scheduledStartTime: string;
    scheduledEndTime: string;
    deliveryMode: ClassroomDeliveryMode;
    teachingApproach: ClassroomTeachingApproach;
    classroomId: string | null;
    meetingUrl: string | null;
    lessonPlanId: string | null;
    topicsCovered: string | null;
    teacherRemarks: string | null;
  }): Promise<void> {
    await prisma.$executeRawUnsafe(
      `
      UPDATE classroom_sessions
      SET
        session_date = $3::date,
        scheduled_start_time = $4::time,
        scheduled_end_time = $5::time,
        delivery_mode = $6::classroom_delivery_mode,
        teaching_approach = $7::classroom_teaching_approach,
        classroom_id = $8::uuid,
        meeting_url = $9::varchar,
        lesson_plan_id = $10::uuid,
        topics_covered = $11::text,
        teacher_remarks = $12::text,
        updated_by = $13::uuid
      WHERE org_id = $1::uuid
        AND session_id = $2::uuid
      `,
      input.orgId,
      input.sessionId,
      input.sessionDate,
      input.scheduledStartTime,
      input.scheduledEndTime,
      input.deliveryMode,
      input.teachingApproach,
      input.classroomId,
      input.meetingUrl,
      input.lessonPlanId,
      input.topicsCovered,
      input.teacherRemarks,
      input.actorUserId,
    );
  }

  static async transitionSessionStatus(input: {
    orgId: string;
    sessionId: string;
    actorUserId: string;
    toStatus: ClassroomSessionStatus;
    topicsCovered?: string | null;
    teacherRemarks?: string | null;
    notConductedReason?: string | null;
  }): Promise<void> {
    await prisma.$executeRawUnsafe(
      `
      UPDATE classroom_sessions
      SET
        session_status = $3::classroom_session_status,
        actual_start_at = CASE
          WHEN $3::text = 'in_progress' THEN COALESCE(actual_start_at, NOW())
          WHEN $3::text IN ('cancelled', 'not_conducted') THEN NULL
          ELSE actual_start_at
        END,
        actual_end_at = CASE
          WHEN $3::text = 'completed' THEN GREATEST(NOW(), COALESCE(actual_start_at, NOW()) + interval '1 millisecond')
          WHEN $3::text IN ('cancelled', 'not_conducted') THEN NULL
          ELSE actual_end_at
        END,
        topics_covered = COALESCE($4::text, topics_covered),
        teacher_remarks = COALESCE($5::text, teacher_remarks),
        not_conducted_reason = CASE
          WHEN $3::text = 'not_conducted' THEN $6::text
          ELSE not_conducted_reason
        END,
        updated_by = $7::uuid
      WHERE org_id = $1::uuid
        AND session_id = $2::uuid
      `,
      input.orgId,
      input.sessionId,
      input.toStatus,
      input.topicsCovered !== undefined ? input.topicsCovered : null,
      input.teacherRemarks !== undefined ? input.teacherRemarks : null,
      input.notConductedReason !== undefined ? input.notConductedReason : null,
      input.actorUserId,
    );
  }

  static async getSessionRosterWithAttendance(
    orgId: string,
    sessionId: string,
    sectionId: string,
    academicYearGradeId: string,
    sessionDate: string,
  ): Promise<ClassroomRosterStudentDto[]> {
    const rows: any[] = await prisma.$queryRawUnsafe(
      `
      SELECT
        s.student_id,
        se.enrollment_id,
        s.admission_no,
        se.roll_number,
        COALESCE(
          NULLIF(TRIM(CONCAT(COALESCE(s.first_name, ''), ' ', COALESCE(s.last_name, ''))), ''),
          s.admission_no,
          'Student'
        ) AS full_name,
        att.session_attendance_id,
        att.attendance_status::text AS attendance_status,
        att.participation_mode::text AS participation_mode,
        att.recorded_at,
        att.recorded_by,
        att.remarks
      FROM student_enrollments se
      JOIN students s ON s.student_id = se.student_id
      LEFT JOIN classroom_session_attendance att
        ON att.session_id = $2::uuid
        AND att.student_id = s.student_id
      WHERE s.org_id = $1::uuid
        AND se.section_id = $3::uuid
        AND se.academic_year_grade_id = $4::uuid
        AND se.status = 'active'
        AND se.enrollment_date <= $5::date
        AND (se.exit_date IS NULL OR se.exit_date >= $5::date)
      ORDER BY
        NULLIF(regexp_replace(COALESCE(se.roll_number, ''), '[^0-9]', '', 'g'), '')::int NULLS LAST,
        se.roll_number NULLS LAST,
        s.first_name ASC,
        s.last_name ASC
      `,
      orgId,
      sessionId,
      sectionId,
      academicYearGradeId,
      sessionDate,
    );

    return rows.map((r) => ({
      student_id: r.student_id,
      enrollment_id: r.enrollment_id,
      admission_no: r.admission_no || null,
      roll_number: r.roll_number || null,
      full_name: r.full_name,
      session_attendance_id: r.session_attendance_id || null,
      attendance_status: r.attendance_status || null,
      participation_mode: r.participation_mode || null,
      recorded_at: toIsoOrNull(r.recorded_at),
      recorded_by: r.recorded_by || null,
      remarks: r.remarks || null,
    }));
  }

  static async upsertAttendanceBatch(input: {
    orgId: string;
    sessionId: string;
    actorUserId: string;
    records: Array<{
      student_id: string;
      enrollment_id: string;
      attendance_status: ClassroomAttendanceStatus;
      participation_mode: ClassroomParticipationMode | null;
      remarks: string | null;
    }>;
  }): Promise<number> {
    return prisma.$transaction(async (tx) => {
      let count = 0;
      for (const rec of input.records) {
        await tx.$executeRawUnsafe(
          `
          INSERT INTO classroom_session_attendance (
            org_id,
            session_id,
            student_id,
            enrollment_id,
            attendance_status,
            participation_mode,
            recorded_by,
            recorded_at,
            remarks
          ) VALUES (
            $1::uuid,
            $2::uuid,
            $3::uuid,
            $4::uuid,
            $5::classroom_attendance_status,
            $6::classroom_participation_mode,
            $7::uuid,
            NOW(),
            $8::text
          )
          ON CONFLICT (session_id, student_id) DO UPDATE SET
            enrollment_id = EXCLUDED.enrollment_id,
            attendance_status = EXCLUDED.attendance_status,
            participation_mode = EXCLUDED.participation_mode,
            recorded_by = EXCLUDED.recorded_by,
            recorded_at = NOW(),
            remarks = EXCLUDED.remarks
          `,
          input.orgId,
          input.sessionId,
          rec.student_id,
          rec.enrollment_id,
          rec.attendance_status,
          rec.participation_mode,
          input.actorUserId,
          rec.remarks,
        );
        count += 1;
      }
      return count;
    });
  }

  static async recordIdempotentOnlineStudentJoin(input: {
    orgId: string;
    sessionId: string;
    studentId: string;
    enrollmentId: string;
    assignedTeacherUserId: string;
  }): Promise<{ inserted: boolean; attendance: any }> {
    return prisma.$transaction(async (tx) => {
      const insertedRows: any[] = await tx.$queryRawUnsafe(
        `
        INSERT INTO classroom_session_attendance (
          org_id,
          session_id,
          student_id,
          enrollment_id,
          attendance_status,
          participation_mode,
          recorded_by,
          recorded_at,
          remarks
        ) VALUES (
          $1::uuid,
          $2::uuid,
          $3::uuid,
          $4::uuid,
          'present'::classroom_attendance_status,
          'online'::classroom_participation_mode,
          $5::uuid,
          NOW(),
          'Verified online join via Student Portal'
        )
        ON CONFLICT (session_id, student_id) DO NOTHING
        RETURNING
          session_attendance_id,
          attendance_status::text AS attendance_status,
          participation_mode::text AS participation_mode,
          recorded_at,
          remarks
        `,
        input.orgId,
        input.sessionId,
        input.studentId,
        input.enrollmentId,
        input.assignedTeacherUserId,
      );

      if (insertedRows[0]) {
        return {
          inserted: true,
          attendance: {
            ...insertedRows[0],
            recorded_at: toIsoOrNull(insertedRows[0].recorded_at),
          },
        };
      }

      const existingRows: any[] = await tx.$queryRawUnsafe(
        `
        SELECT
          session_attendance_id,
          attendance_status::text AS attendance_status,
          participation_mode::text AS participation_mode,
          recorded_at,
          remarks
        FROM classroom_session_attendance
        WHERE org_id = $1::uuid
          AND session_id = $2::uuid
          AND student_id = $3::uuid
        LIMIT 1
        `,
        input.orgId,
        input.sessionId,
        input.studentId,
      );

      return {
        inserted: false,
        attendance: existingRows[0]
          ? {
              ...existingRows[0],
              recorded_at: toIsoOrNull(existingRows[0].recorded_at),
            }
          : null,
      };
    });
  }

  static async listTeacherSessions(
    orgId: string,
    staffId: string,
    filters: SessionListFilters,
  ): Promise<{ items: ClassroomSessionDto[]; total: number }> {
    const params: any[] = [orgId, staffId];
    const clauses = [
      'cs.org_id = $1::uuid',
      'fa.staff_id = $2::uuid',
      ...buildFilterClauses(filters, params),
    ];
    const whereSql = `WHERE ${clauses.join(' AND ')}`;

    const countSql = `
      SELECT COUNT(DISTINCT cs.session_id)::int AS total
      FROM classroom_sessions cs
      JOIN sections sec ON sec.section_id = cs.section_id
      JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = sec.academic_year_grade_id
      JOIN grades gr ON gr.grade_id = ayg.grade_id
      JOIN academic_year_grade_subjects aygs ON aygs.academic_year_grade_subject_id = cs.academic_year_grade_subject_id
      JOIN subjects sub ON sub.subject_id = aygs.subject_id
      JOIN section_subject_faculty_assignments fa ON fa.faculty_assignment_id = cs.faculty_assignment_id
      LEFT JOIN lesson_plans lp ON lp.lesson_plan_id = cs.lesson_plan_id
      ${whereSql}
    `;

    const offset = (filters.page - 1) * filters.limit;
    const dataParams = [...params, filters.limit, offset];
    const dataSql = `
      ${buildSessionBaseSelect(true)}
      ${whereSql}
      ${SESSION_GROUP_BY}
      ORDER BY cs.session_date DESC, cs.scheduled_start_time DESC
      LIMIT $${dataParams.length - 1}::int OFFSET $${dataParams.length}::int
    `;

    const [countRows, rows] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(countSql, ...params),
      prisma.$queryRawUnsafe<any[]>(dataSql, ...dataParams),
    ]);

    return {
      items: rows.map(mapSessionRow),
      total: Number(countRows[0]?.total || 0),
    };
  }

  static async listAdminSessions(
    orgId: string,
    filters: SessionListFilters,
  ): Promise<{ items: ClassroomSessionDto[]; total: number }> {
    const params: any[] = [orgId];
    const clauses = ['cs.org_id = $1::uuid', ...buildFilterClauses(filters, params)];
    const whereSql = `WHERE ${clauses.join(' AND ')}`;

    const countSql = `
      SELECT COUNT(DISTINCT cs.session_id)::int AS total
      FROM classroom_sessions cs
      JOIN sections sec ON sec.section_id = cs.section_id
      JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = sec.academic_year_grade_id
      JOIN grades gr ON gr.grade_id = ayg.grade_id
      JOIN academic_year_grade_subjects aygs ON aygs.academic_year_grade_subject_id = cs.academic_year_grade_subject_id
      JOIN subjects sub ON sub.subject_id = aygs.subject_id
      JOIN section_subject_faculty_assignments fa ON fa.faculty_assignment_id = cs.faculty_assignment_id
      LEFT JOIN lesson_plans lp ON lp.lesson_plan_id = cs.lesson_plan_id
      ${whereSql}
    `;

    const offset = (filters.page - 1) * filters.limit;
    const dataParams = [...params, filters.limit, offset];
    const dataSql = `
      ${buildSessionBaseSelect(true)}
      ${whereSql}
      ${SESSION_GROUP_BY}
      ORDER BY cs.session_date DESC, cs.scheduled_start_time DESC
      LIMIT $${dataParams.length - 1}::int OFFSET $${dataParams.length}::int
    `;

    const [countRows, rows] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(countSql, ...params),
      prisma.$queryRawUnsafe<any[]>(dataSql, ...dataParams),
    ]);

    return {
      items: rows.map(mapSessionRow),
      total: Number(countRows[0]?.total || 0),
    };
  }

  static async getTeacherOverviewAndRefs(orgId: string, staffId: string) {
    const [kpiRows, assignmentRows, classroomRows, lessonPlanRows, yearRows] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(
        `
        SELECT
          COUNT(*) FILTER (WHERE cs.session_status = 'in_progress')::int AS live_count,
          COUNT(*) FILTER (WHERE cs.session_date = CURRENT_DATE AND cs.session_status IN ('scheduled', 'in_progress'))::int AS today_count,
          COUNT(*) FILTER (WHERE cs.session_date >= CURRENT_DATE AND cs.session_status = 'scheduled')::int AS upcoming_count,
          COUNT(*) FILTER (WHERE cs.session_status = 'completed')::int AS completed_count
        FROM classroom_sessions cs
        JOIN section_subject_faculty_assignments fa ON fa.faculty_assignment_id = cs.faculty_assignment_id
        WHERE cs.org_id = $1::uuid
          AND fa.staff_id = $2::uuid
        `,
        orgId,
        staffId,
      ),
      prisma.$queryRawUnsafe<any[]>(
        `
        SELECT
          fa.faculty_assignment_id,
          fa.assignment_role::text AS assignment_role,
          fa.section_id,
          sec.section_name,
          gr.grade_id,
          gr.grade_name,
          gr.grade_code,
          ay.academic_year_id,
          ay.academic_year_name,
          aygs.academic_year_grade_subject_id,
          sub.subject_id,
          sub.subject_name,
          sub.subject_code,
          (
            SELECT COUNT(*)::int
            FROM student_enrollments se
            WHERE se.section_id = fa.section_id
              AND se.academic_year_grade_id = sec.academic_year_grade_id
              AND se.status = 'active'
          ) AS active_students_count
        FROM section_subject_faculty_assignments fa
        JOIN sections sec ON sec.section_id = fa.section_id
        JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = sec.academic_year_grade_id
        JOIN grades gr ON gr.grade_id = ayg.grade_id
        JOIN academic_years ay ON ay.academic_year_id = ayg.academic_year_id
        JOIN academic_year_grade_subjects aygs ON aygs.academic_year_grade_subject_id = fa.academic_year_grade_subject_id
        JOIN subjects sub ON sub.subject_id = aygs.subject_id
        WHERE fa.staff_id = $2::uuid
          AND ay.org_id = $1::uuid
          AND fa.is_active = true
        ORDER BY ay.start_date DESC, gr.display_order ASC, sec.section_name ASC, sub.subject_name ASC
        `,
        orgId,
        staffId,
      ),
      prisma.$queryRawUnsafe<any[]>(
        `
        SELECT classroom_id, room_code, room_name, room_type::text AS room_type, building_name, floor_name, capacity
        FROM classrooms
        WHERE org_id = $1::uuid
          AND is_active = true
        ORDER BY room_name ASC, room_code ASC
        `,
        orgId,
      ),
      prisma.$queryRawUnsafe<any[]>(
        `
        SELECT
          lp.lesson_plan_id,
          lp.lesson_title,
          lp.teaching_approach::text AS teaching_approach,
          cu.curriculum_unit_id,
          cu.unit_title,
          cp.academic_year_grade_subject_id
        FROM lesson_plans lp
        JOIN curriculum_plan_units cu ON cu.curriculum_unit_id = lp.curriculum_unit_id
        JOIN curriculum_plans cp ON cp.curriculum_plan_id = cu.curriculum_plan_id
        WHERE cp.org_id = $1::uuid
          AND lp.teacher_staff_id = $2::uuid
          AND lp.is_active = true
        ORDER BY lp.sequence_number ASC, lp.lesson_title ASC
        LIMIT 100
        `,
        orgId,
        staffId,
      ),
      prisma.$queryRawUnsafe<any[]>(
        `
        SELECT academic_year_id, academic_year_name, status::text AS status,
          to_char(start_date, 'YYYY-MM-DD') AS start_date,
          to_char(end_date, 'YYYY-MM-DD') AS end_date
        FROM academic_years
        WHERE org_id = $1::uuid
        ORDER BY start_date DESC
        `,
        orgId,
      ),
    ]);

    return {
      kpis: {
        assigned_classes_count: assignmentRows.length,
        live_sessions_count: Number(kpiRows[0]?.live_count || 0),
        today_sessions_count: Number(kpiRows[0]?.today_count || 0),
        upcoming_sessions_count: Number(kpiRows[0]?.upcoming_count || 0),
        completed_sessions_count: Number(kpiRows[0]?.completed_count || 0),
      },
      assignments: assignmentRows,
      classrooms: classroomRows,
      lesson_plans: lessonPlanRows,
      academic_years: yearRows,
    };
  }

  static async generateSessionsFromTimetable(
    orgId: string,
    academicYearId: string,
    startDate: string,
    endDate: string,
  ): Promise<number> {
    const yearRows: any[] = await prisma.$queryRawUnsafe(
      `
      SELECT academic_year_id
      FROM academic_years
      WHERE org_id = $1::uuid
        AND academic_year_id = $2::uuid
      LIMIT 1
      `,
      orgId,
      academicYearId,
    );
    if (!yearRows[0]) {
      return -1;
    }

    const res: any[] = await prisma.$queryRawUnsafe(
      `
      SELECT public.s31_generate_classroom_sessions_for_date_range(
        $1::uuid,
        $2::uuid,
        $3::date,
        $4::date
      )::int AS created_count
      `,
      orgId,
      academicYearId,
      startDate,
      endDate,
    );
    return Number(res[0]?.created_count || 0);
  }

  static async listAdminAcademicYears(orgId: string) {
    return prisma.$queryRawUnsafe(
      `
      SELECT
        ay.academic_year_id,
        ay.academic_year_name,
        ay.status::text AS status,
        to_char(ay.start_date, 'YYYY-MM-DD') AS start_date,
        to_char(ay.end_date, 'YYYY-MM-DD') AS end_date,
        EXISTS (
          SELECT 1
          FROM timetable_versions tv
          WHERE tv.academic_year_id = ay.academic_year_id
            AND tv.status = 'published'
        ) AS has_published_timetable
      FROM academic_years ay
      WHERE ay.org_id = $1::uuid
      ORDER BY ay.start_date DESC
      `,
      orgId,
    );
  }

  static async listSessionAuditHistory(
    orgId: string,
    sessionId: string,
    query: {
      entity_type?: 'classroom_session' | 'session_attendance';
      page: number;
      limit: number;
    },
  ) {
    const params: any[] = [orgId, sessionId];
    let entityFilter = '';
    if (query.entity_type === 'classroom_session') {
      entityFilter = `AND ah.entity_type = 'classroom_session' AND ah.entity_id = $2::uuid`;
    } else if (query.entity_type === 'session_attendance') {
      entityFilter = `
        AND ah.entity_type = 'session_attendance'
        AND (
          ah.new_values->>'session_id' = $2::text
          OR ah.old_values->>'session_id' = $2::text
        )
      `;
    } else {
      entityFilter = `
        AND (
          (ah.entity_type = 'classroom_session' AND ah.entity_id = $2::uuid)
          OR (
            ah.entity_type = 'session_attendance'
            AND (ah.new_values->>'session_id' = $2::text OR ah.old_values->>'session_id' = $2::text)
          )
        )
      `;
    }

    const offset = (query.page - 1) * query.limit;
    const countRows: any[] = await prisma.$queryRawUnsafe(
      `
      SELECT COUNT(*)::int AS total
      FROM classroom_session_audit_history ah
      WHERE ah.org_id = $1::uuid
        ${entityFilter}
      `,
      ...params,
    );

    const rows: any[] = await prisma.$queryRawUnsafe(
      `
      SELECT
        ah.audit_id,
        ah.entity_type::text AS entity_type,
        ah.entity_id,
        ah.action::text AS action,
        ah.old_values,
        ah.new_values,
        ah.actor_user_id,
        COALESCE(
          NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''),
          u.email,
          'System'
        ) AS actor_name,
        ah.occurred_at
      FROM classroom_session_audit_history ah
      LEFT JOIN users u ON u.user_id = ah.actor_user_id
      WHERE ah.org_id = $1::uuid
        ${entityFilter}
      ORDER BY ah.occurred_at DESC
      LIMIT $3::int OFFSET $4::int
      `,
      ...params,
      query.limit,
      offset,
    );

    return {
      items: rows.map((r) => ({
        ...r,
        occurred_at: toIsoOrNull(r.occurred_at),
      })),
      total: Number(countRows[0]?.total || 0),
    };
  }

  static async listStudentOrParentSessions(input: {
    orgId: string;
    studentId: string;
    filters: SessionListFilters;
    exposeMeetingUrlWhenJoinable: boolean;
  }): Promise<{
    items: Array<
      ClassroomSessionDto & {
        student_attendance: any;
        can_join: boolean;
        join_reason: string | null;
      }
    >;
    total: number;
  }> {
    const params: any[] = [input.orgId, input.studentId];
    const clauses = ['cs.org_id = $1::uuid', ...buildFilterClauses(input.filters, params)];
    const whereSql = `WHERE ${clauses.join(' AND ')}`;

    const enrollmentJoin = `
      JOIN student_enrollments se_stu
        ON se_stu.student_id = $2::uuid
        AND se_stu.section_id = cs.section_id
        AND se_stu.academic_year_grade_id = sec.academic_year_grade_id
        AND se_stu.status = 'active'
        AND se_stu.enrollment_date <= cs.session_date
        AND (se_stu.exit_date IS NULL OR se_stu.exit_date >= cs.session_date)
    `;

    const countRows: any[] = await prisma.$queryRawUnsafe(
      `
      SELECT COUNT(DISTINCT cs.session_id)::int AS total
      FROM classroom_sessions cs
      JOIN sections sec ON sec.section_id = cs.section_id
      JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = sec.academic_year_grade_id
      JOIN grades gr ON gr.grade_id = ayg.grade_id
      JOIN academic_year_grade_subjects aygs ON aygs.academic_year_grade_subject_id = cs.academic_year_grade_subject_id
      JOIN subjects sub ON sub.subject_id = aygs.subject_id
      LEFT JOIN lesson_plans lp ON lp.lesson_plan_id = cs.lesson_plan_id
      ${enrollmentJoin}
      ${whereSql}
      `,
      ...params,
    );

    const offset = (input.filters.page - 1) * input.filters.limit;
    const dataParams = [...params, input.filters.limit, offset];
    const meetingUrlSql = input.exposeMeetingUrlWhenJoinable
      ? `CASE
           WHEN cs.session_status = 'in_progress'::classroom_session_status
             AND cs.delivery_mode IN ('online'::classroom_delivery_mode, 'hybrid'::classroom_delivery_mode)
           THEN cs.meeting_url
           ELSE NULL
         END AS meeting_url,`
      : `NULL::varchar AS meeting_url,`;

    const rows: any[] = await prisma.$queryRawUnsafe(
      `
      SELECT
        cs.session_id,
        cs.org_id,
        cs.academic_year_id,
        ay.academic_year_name,
        cs.timetable_entry_id,
        cs.creation_method::text AS creation_method,
        cs.section_id,
        sec.section_name,
        gr.grade_id,
        gr.grade_name,
        gr.grade_code,
        cs.academic_year_grade_subject_id,
        sub.subject_id,
        sub.subject_name,
        sub.subject_code,
        cs.faculty_assignment_id,
        fa.staff_id AS teacher_staff_id,
        st.user_id AS teacher_user_id,
        COALESCE(
          NULLIF(TRIM(CONCAT(COALESCE(tu.first_name, ''), ' ', COALESCE(tu.last_name, ''))), ''),
          tu.email,
          st.employee_code,
          'Faculty'
        ) AS teacher_name,
        cs.lesson_plan_id,
        lp.lesson_title,
        cs.classroom_id,
        cr.room_name AS classroom_name,
        cr.room_code AS classroom_code,
        to_char(cs.session_date, 'YYYY-MM-DD') AS session_date,
        to_char(cs.scheduled_start_time, 'HH24:MI:SS') AS scheduled_start_time,
        to_char(cs.scheduled_end_time, 'HH24:MI:SS') AS scheduled_end_time,
        cs.actual_start_at,
        cs.actual_end_at,
        cs.delivery_mode::text AS delivery_mode,
        cs.teaching_approach::text AS teaching_approach,
        ${meetingUrlSql}
        (cs.meeting_url IS NOT NULL AND btrim(cs.meeting_url) <> '') AS has_meeting_url,
        cs.session_status::text AS session_status,
        cs.topics_covered,
        cs.teacher_remarks,
        cs.not_conducted_reason,
        cs.created_at,
        cs.updated_at,
        att.session_attendance_id,
        att.attendance_status::text AS student_attendance_status,
        att.participation_mode::text AS student_participation_mode,
        att.recorded_at AS student_recorded_at,
        att.remarks AS student_attendance_remarks
      FROM classroom_sessions cs
      JOIN academic_years ay ON ay.academic_year_id = cs.academic_year_id
      JOIN sections sec ON sec.section_id = cs.section_id
      JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = sec.academic_year_grade_id
      JOIN grades gr ON gr.grade_id = ayg.grade_id
      JOIN academic_year_grade_subjects aygs ON aygs.academic_year_grade_subject_id = cs.academic_year_grade_subject_id
      JOIN subjects sub ON sub.subject_id = aygs.subject_id
      JOIN section_subject_faculty_assignments fa ON fa.faculty_assignment_id = cs.faculty_assignment_id
      JOIN staff st ON st.staff_id = fa.staff_id
      LEFT JOIN users tu ON tu.user_id = st.user_id
      LEFT JOIN lesson_plans lp ON lp.lesson_plan_id = cs.lesson_plan_id
      LEFT JOIN classrooms cr ON cr.classroom_id = cs.classroom_id
      ${enrollmentJoin}
      LEFT JOIN classroom_session_attendance att
        ON att.session_id = cs.session_id
        AND att.student_id = $2::uuid
      ${whereSql}
      ORDER BY
        (CASE WHEN cs.session_status = 'in_progress' THEN 0 WHEN cs.session_status = 'scheduled' AND cs.session_date >= CURRENT_DATE THEN 1 ELSE 2 END) ASC,
        cs.session_date DESC,
        cs.scheduled_start_time DESC
      LIMIT $${dataParams.length - 1}::int OFFSET $${dataParams.length}::int
      `,
      ...dataParams,
    );

    const items = rows.map((row) => {
      const dto = mapSessionRow(row);
      delete dto.attendance_summary;

      let canJoin = false;
      let joinReason: string | null = null;

      if (!input.exposeMeetingUrlWhenJoinable) {
        canJoin = false;
        joinReason = 'Read-only parent view';
      } else if (row.session_status !== 'in_progress') {
        joinReason =
          row.session_status === 'scheduled'
            ? 'Session has not started yet'
            : `Session is ${row.session_status.replace('_', ' ')}`;
      } else if (row.delivery_mode === 'physical') {
        joinReason = 'Physical classroom session';
      } else if (!row.has_meeting_url) {
        joinReason = 'Meeting link not configured by teacher';
      } else {
        canJoin = true;
      }

      return {
        ...dto,
        can_join: canJoin,
        join_reason: joinReason,
        student_attendance: row.session_attendance_id
          ? {
              session_attendance_id: row.session_attendance_id,
              attendance_status: row.student_attendance_status,
              participation_mode: row.student_participation_mode,
              recorded_at: toIsoOrNull(row.student_recorded_at),
              remarks: row.student_attendance_remarks || null,
            }
          : null,
      };
    });

    return {
      items,
      total: Number(countRows[0]?.total || 0),
    };
  }

  static async getStudentAttendanceOverviewAndHistory(
    orgId: string,
    studentId: string,
    filters: { date_from?: string; date_to?: string; page: number; limit: number },
  ): Promise<{ summary: AttendanceStatsSummary; items: any[]; total: number }> {
    const summaryRows: any[] = await prisma.$queryRawUnsafe(
      `
      SELECT
        COUNT(DISTINCT cs.session_id)::int AS total_sessions,
        COUNT(DISTINCT cs.session_id) FILTER (WHERE cs.session_status IN ('in_progress', 'completed'))::int AS conducted_sessions,
        COUNT(att.session_attendance_id)::int AS marked_sessions,
        COUNT(att.session_attendance_id) FILTER (WHERE att.attendance_status = 'present')::int AS present_count,
        COUNT(att.session_attendance_id) FILTER (WHERE att.attendance_status = 'late')::int AS late_count,
        COUNT(att.session_attendance_id) FILTER (WHERE att.attendance_status = 'absent')::int AS absent_count,
        COUNT(att.session_attendance_id) FILTER (WHERE att.attendance_status = 'excused')::int AS excused_count
      FROM classroom_sessions cs
      JOIN sections sec ON sec.section_id = cs.section_id
      JOIN student_enrollments se
        ON se.student_id = $2::uuid
        AND se.section_id = cs.section_id
        AND se.academic_year_grade_id = sec.academic_year_grade_id
        AND se.status = 'active'
        AND se.enrollment_date <= cs.session_date
        AND (se.exit_date IS NULL OR se.exit_date >= cs.session_date)
      LEFT JOIN classroom_session_attendance att
        ON att.session_id = cs.session_id
        AND att.student_id = $2::uuid
      WHERE cs.org_id = $1::uuid
        AND ($3::date IS NULL OR cs.session_date >= $3::date)
        AND ($4::date IS NULL OR cs.session_date <= $4::date)
      `,
      orgId,
      studentId,
      filters.date_from || null,
      filters.date_to || null,
    );

    const s = summaryRows[0] || {};
    const marked = Number(s.marked_sessions || 0);
    const present = Number(s.present_count || 0);
    const late = Number(s.late_count || 0);
    const attended = present + late;
    const attendancePercentage = marked > 0 ? Math.round((attended / marked) * 1000) / 10 : 0;

    const offset = (filters.page - 1) * filters.limit;
    const historyRows: any[] = await prisma.$queryRawUnsafe(
      `
      SELECT
        att.session_attendance_id,
        cs.session_id,
        to_char(cs.session_date, 'YYYY-MM-DD') AS session_date,
        to_char(cs.scheduled_start_time, 'HH24:MI:SS') AS scheduled_start_time,
        to_char(cs.scheduled_end_time, 'HH24:MI:SS') AS scheduled_end_time,
        cs.delivery_mode::text AS delivery_mode,
        cs.session_status::text AS session_status,
        sub.subject_name,
        sub.subject_code,
        COALESCE(
          NULLIF(TRIM(CONCAT(COALESCE(tu.first_name, ''), ' ', COALESCE(tu.last_name, ''))), ''),
          tu.email,
          'Faculty'
        ) AS teacher_name,
        att.attendance_status::text AS attendance_status,
        att.participation_mode::text AS participation_mode,
        att.recorded_at,
        att.remarks
      FROM classroom_session_attendance att
      JOIN classroom_sessions cs ON cs.session_id = att.session_id
      JOIN academic_year_grade_subjects aygs ON aygs.academic_year_grade_subject_id = cs.academic_year_grade_subject_id
      JOIN subjects sub ON sub.subject_id = aygs.subject_id
      JOIN section_subject_faculty_assignments fa ON fa.faculty_assignment_id = cs.faculty_assignment_id
      JOIN staff st ON st.staff_id = fa.staff_id
      LEFT JOIN users tu ON tu.user_id = st.user_id
      WHERE att.org_id = $1::uuid
        AND att.student_id = $2::uuid
        AND ($3::date IS NULL OR cs.session_date >= $3::date)
        AND ($4::date IS NULL OR cs.session_date <= $4::date)
      ORDER BY cs.session_date DESC, cs.scheduled_start_time DESC, att.recorded_at DESC
      LIMIT $5::int OFFSET $6::int
      `,
      orgId,
      studentId,
      filters.date_from || null,
      filters.date_to || null,
      filters.limit,
      offset,
    );

    const historyCountRows: any[] = await prisma.$queryRawUnsafe(
      `
      SELECT COUNT(*)::int AS total
      FROM classroom_session_attendance att
      JOIN classroom_sessions cs ON cs.session_id = att.session_id
      WHERE att.org_id = $1::uuid
        AND att.student_id = $2::uuid
        AND ($3::date IS NULL OR cs.session_date >= $3::date)
        AND ($4::date IS NULL OR cs.session_date <= $4::date)
      `,
      orgId,
      studentId,
      filters.date_from || null,
      filters.date_to || null,
    );

    return {
      summary: {
        total_sessions: Number(s.total_sessions || 0),
        conducted_sessions: Number(s.conducted_sessions || 0),
        marked_sessions: marked,
        present_count: present,
        late_count: late,
        absent_count: Number(s.absent_count || 0),
        excused_count: Number(s.excused_count || 0),
        attended_count: attended,
        attendance_percentage: attendancePercentage,
      },
      items: historyRows.map((r) => ({
        ...r,
        recorded_at: toIsoOrNull(r.recorded_at),
      })),
      total: Number(historyCountRows[0]?.total || 0),
    };
  }

  static async getStudentEnrolledSubjects(orgId: string, studentId: string): Promise<any[]> {
    return prisma.$queryRawUnsafe(
      `
      SELECT DISTINCT
        sub.subject_id,
        sub.subject_name,
        sub.subject_code,
        aygs.academic_year_grade_subject_id,
        sec.section_id,
        sec.section_name,
        gr.grade_name,
        COALESCE(
          NULLIF(TRIM(CONCAT(COALESCE(tu.first_name, ''), ' ', COALESCE(tu.last_name, ''))), ''),
          tu.email,
          st.employee_code,
          'Faculty'
        ) AS teacher_name
      FROM student_enrollments se
      JOIN sections sec ON sec.section_id = se.section_id
      JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = se.academic_year_grade_id
      JOIN grades gr ON gr.grade_id = ayg.grade_id
      JOIN academic_year_grade_subjects aygs ON aygs.academic_year_grade_id = ayg.academic_year_grade_id
      JOIN subjects sub ON sub.subject_id = aygs.subject_id
      LEFT JOIN section_subject_faculty_assignments fa
        ON fa.section_id = sec.section_id
        AND fa.academic_year_grade_subject_id = aygs.academic_year_grade_subject_id
        AND fa.is_active = true
      LEFT JOIN staff st ON st.staff_id = fa.staff_id
      LEFT JOIN users tu ON tu.user_id = st.user_id
      WHERE se.student_id = $2::uuid
        AND ayg.academic_year_id IN (SELECT academic_year_id FROM academic_years WHERE org_id = $1::uuid)
        AND se.status = 'active'
        AND aygs.is_active = true
      ORDER BY sub.subject_name ASC
      `,
      orgId,
      studentId,
    );
  }

  static async getSessionAudienceUsers(
    orgId: string,
    sessionId: string,
    specificStudentIds?: string[],
  ): Promise<{
    teacherUserId: string | null;
    studentUserIds: string[];
    parentUserIds: string[];
    subjectName: string;
    sectionName: string;
    sessionDate: string;
    scheduledStartTime: string;
  } | null> {
    const metaRows: any[] = await prisma.$queryRawUnsafe(
      `
      SELECT
        st.user_id AS teacher_user_id,
        cs.section_id,
        sec.academic_year_grade_id,
        sec.section_name,
        sub.subject_name,
        to_char(cs.session_date, 'YYYY-MM-DD') AS session_date,
        to_char(cs.scheduled_start_time, 'HH24:MI') AS scheduled_start_time
      FROM classroom_sessions cs
      JOIN sections sec ON sec.section_id = cs.section_id
      JOIN academic_year_grade_subjects aygs ON aygs.academic_year_grade_subject_id = cs.academic_year_grade_subject_id
      JOIN subjects sub ON sub.subject_id = aygs.subject_id
      JOIN section_subject_faculty_assignments fa ON fa.faculty_assignment_id = cs.faculty_assignment_id
      JOIN staff st ON st.staff_id = fa.staff_id
      WHERE cs.org_id = $1::uuid
        AND cs.session_id = $2::uuid
      LIMIT 1
      `,
      orgId,
      sessionId,
    );

    const meta = metaRows[0];
    if (!meta) return null;

    const studentFilterSql =
      specificStudentIds && specificStudentIds.length > 0
        ? `AND s.student_id = ANY($5::uuid[])`
        : '';
    const params: any[] = [orgId, meta.section_id, meta.academic_year_grade_id, meta.session_date];
    if (specificStudentIds && specificStudentIds.length > 0) {
      params.push(specificStudentIds);
    }

    const audienceRows: any[] = await prisma.$queryRawUnsafe(
      `
      SELECT DISTINCT
        s.user_id AS student_user_id,
        p.user_id AS parent_user_id
      FROM student_enrollments se
      JOIN students s ON s.student_id = se.student_id
      LEFT JOIN student_parents sp ON sp.student_id = s.student_id
      LEFT JOIN parents p ON p.parent_id = sp.parent_id AND p.org_id = $1::uuid
      WHERE s.org_id = $1::uuid
        AND se.section_id = $2::uuid
        AND se.academic_year_grade_id = $3::uuid
        AND se.status = 'active'
        AND se.enrollment_date <= $4::date
        AND (se.exit_date IS NULL OR se.exit_date >= $4::date)
        ${studentFilterSql}
      `,
      ...params,
    );

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
      subjectName: meta.subject_name,
      sectionName: meta.section_name,
      sessionDate: String(meta.session_date),
      scheduledStartTime: String(meta.scheduled_start_time),
    };
  }

  static async getFlippedPreparation(
    orgId: string,
    lessonPlanId: string,
    sectionId?: string,
    sessionDeadline?: string,
  ): Promise<FlippedPreparationDto | null> {
    const planRows = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT
        lp.lesson_plan_id,
        lp.curriculum_unit_id,
        cpu.unit_title,
        cpu.unit_code,
        lp.lesson_title,
        lp.lesson_summary,
        lp.prerequisite_knowledge,
        to_char(lp.planned_date, 'YYYY-MM-DD') AS planned_date,
        lp.duration_minutes,
        lp.teaching_approach
      FROM lesson_plans lp
      JOIN curriculum_plan_units cpu ON cpu.curriculum_unit_id = lp.curriculum_unit_id
      JOIN curriculum_plans cp ON cp.curriculum_plan_id = cpu.curriculum_plan_id
      WHERE lp.lesson_plan_id = $1::uuid
        AND cp.org_id = $2::uuid
      LIMIT 1
      `,
      lessonPlanId,
      orgId,
    );

    if (!planRows[0]) return null;
    const plan = planRows[0];

    const [resourceRows, outcomeRows, ticketRows, activityRows, postClassRows] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(
        `
          SELECT
            lpr.resource_id,
            lr.title,
            lr.description,
            lr.resource_type::text AS resource_type,
            lr.mime_type,
            lr.file_name,
            lr.file_size_bytes,
            lr.external_url,
            lr.storage_bucket,
            lr.storage_path,
            lpr.usage_notes,
            lpr.sequence_number
          FROM lesson_plan_resources lpr
          JOIN learning_resources lr ON lr.resource_id = lpr.resource_id AND lr.org_id = $2::uuid
          WHERE lpr.lesson_plan_id = $1::uuid
          ORDER BY lpr.sequence_number ASC
          `,
        lessonPlanId,
        orgId,
      ),
      prisma.$queryRawUnsafe<any[]>(
        `
          SELECT
            lpo.learning_outcome_id,
            clo.outcome_code,
            clo.outcome_statement,
            clo.bloom_level::text AS bloom_level,
            lpo.coverage_notes
          FROM lesson_plan_outcomes lpo
          JOIN curriculum_learning_outcomes clo ON clo.learning_outcome_id = lpo.learning_outcome_id
          WHERE lpo.lesson_plan_id = $1::uuid
          ORDER BY clo.sequence_number ASC
          `,
        lessonPlanId,
      ),
      prisma.$queryRawUnsafe<any[]>(
        `
          SELECT
            exit_ticket_id,
            prompt,
            expected_response_or_criteria,
            sequence_number
          FROM lesson_exit_tickets
          WHERE lesson_plan_id = $1::uuid
          ORDER BY sequence_number ASC
          `,
        lessonPlanId,
      ),
      prisma.$queryRawUnsafe<any[]>(
        `
          SELECT
            lesson_activity_id,
            activity_type::text AS activity_type,
            activity_title,
            activity_description,
            duration_minutes,
            sequence_number,
            materials_required
          FROM lesson_activities
          WHERE lesson_plan_id = $1::uuid
          ORDER BY sequence_number ASC
          `,
        lessonPlanId,
      ),
      sectionId
        ? prisma.$queryRawUnsafe<any[]>(
            `
              SELECT
                activity_id,
                title,
                instructions,
                activity_type::text AS activity_type,
                to_char(due_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS due_at,
                grading_enabled,
                maximum_marks,
                activity_status::text AS activity_status
              FROM learning_activities
              WHERE lesson_plan_id = $1::uuid
                AND section_id = $2::uuid
                AND org_id = $3::uuid
              ORDER BY due_at ASC
              `,
            lessonPlanId,
            sectionId,
            orgId,
          )
        : Promise.resolve([]),
    ]);

    // Generate safe short-lived preview/download URLs without exposing raw storage_path or storage_bucket
    const safeResources: FlippedPreparationResourceDto[] = await Promise.all(
      resourceRows.map(async (r) => {
        let preview_url: string | null = null;
        let download_url: string | null = null;

        if (r.external_url) {
          preview_url = r.external_url;
          download_url = r.external_url;
        } else if (r.storage_path) {
          try {
            const previewSigned = await StorageService.getSignedUrl({
              bucket: r.storage_bucket,
              path: r.storage_path,
              expiresInSeconds: 600,
            });
            preview_url = previewSigned.signedUrl;

            const downloadSigned = await StorageService.getSignedUrl({
              bucket: r.storage_bucket,
              path: r.storage_path,
              expiresInSeconds: 3600,
            });
            download_url = downloadSigned.signedUrl;
          } catch {
            // Non-blocking fallback if storage adapter is offline
          }
        }

        return {
          resource_id: r.resource_id,
          title: r.title,
          description: r.description || null,
          resource_type: r.resource_type,
          mime_type: r.mime_type || null,
          file_name: r.file_name || null,
          file_size_bytes: r.file_size_bytes !== null ? Number(r.file_size_bytes) : null,
          external_url: r.external_url || null,
          preview_url,
          download_url,
          access_url: preview_url || download_url || r.external_url || null,
          usage_notes: r.usage_notes || null,
          sequence_number: Number(r.sequence_number || 1),
        };
      }),
    );

    return {
      lesson_plan_id: plan.lesson_plan_id,
      curriculum_unit_id: plan.curriculum_unit_id,
      unit_title: plan.unit_title || null,
      unit_code: plan.unit_code || null,
      lesson_title: plan.lesson_title,
      lesson_summary: plan.lesson_summary || null,
      prerequisite_knowledge: plan.prerequisite_knowledge || null,
      planned_date: plan.planned_date || null,
      duration_minutes: plan.duration_minutes !== null ? Number(plan.duration_minutes) : null,
      teaching_approach: plan.teaching_approach || 'flipped',
      preparation_deadline: sessionDeadline || plan.planned_date || null,
      resources: safeResources,
      outcomes: outcomeRows.map((o) => ({
        learning_outcome_id: o.learning_outcome_id,
        outcome_code: o.outcome_code,
        outcome_statement: o.outcome_statement,
        bloom_level: o.bloom_level || null,
        coverage_notes: o.coverage_notes || null,
      })),
      preparation_questions: ticketRows.map((t) => ({
        exit_ticket_id: t.exit_ticket_id,
        prompt: t.prompt,
        expected_response_or_criteria: t.expected_response_or_criteria || null,
        sequence_number: Number(t.sequence_number || 1),
      })),
      in_class_activities: activityRows.map((a) => ({
        lesson_activity_id: a.lesson_activity_id,
        activity_type: a.activity_type,
        activity_title: a.activity_title,
        activity_description: a.activity_description || null,
        duration_minutes: a.duration_minutes !== null ? Number(a.duration_minutes) : null,
        sequence_number: Number(a.sequence_number || 1),
        materials_required: a.materials_required || null,
      })),
      post_class_activities: postClassRows.map((p) => ({
        activity_id: p.activity_id,
        title: p.title,
        instructions: p.instructions,
        activity_type: p.activity_type,
        due_at: p.due_at,
        grading_enabled: Boolean(p.grading_enabled),
        maximum_marks: p.maximum_marks !== null ? Number(p.maximum_marks) : null,
        activity_status: p.activity_status,
      })),
    };
  }

  static async createFlippedLessonPlan(input: {
    orgId: string;
    curriculumUnitId: string;
    teacherStaffId: string;
    lessonTitle: string;
    lessonSummary?: string | null;
    prerequisiteKnowledge?: string | null;
    plannedDate?: string | null;
    durationMinutes?: number | null;
    actorUserId: string;
    resources?: Array<{
      resource_id: string;
      usage_notes?: string | null;
      sequence_number?: number;
    }>;
    outcomes?: Array<{ learning_outcome_id: string; coverage_notes?: string | null }>;
    preparationQuestions?: Array<{
      prompt: string;
      expected_response?: string | null;
      sequence_number?: number;
    }>;
    inClassActivities?: Array<{
      activity_type: string;
      activity_title: string;
      activity_description?: string | null;
      duration_minutes?: number | null;
      materials_required?: string | null;
      sequence_number?: number;
    }>;
  }): Promise<string> {
    return prisma.$transaction(async (tx) => {
      // 1. Verify curriculum unit belongs to this org
      const unitCheck: any[] = await tx.$queryRawUnsafe(
        `
        SELECT cpu.curriculum_unit_id
        FROM curriculum_plan_units cpu
        JOIN curriculum_plans cp ON cp.curriculum_plan_id = cpu.curriculum_plan_id
        WHERE cpu.curriculum_unit_id = $1::uuid
          AND cp.org_id = $2::uuid
        LIMIT 1
        `,
        input.curriculumUnitId,
        input.orgId,
      );
      if (!unitCheck[0]) {
        throw new Error('Curriculum unit not found or belongs to another organization');
      }

      // 2. Next sequence number for this curriculum unit
      const seqRows: any[] = await tx.$queryRawUnsafe(
        `
        SELECT COALESCE(MAX(sequence_number), 0) + 1 AS next_seq
        FROM lesson_plans
        WHERE curriculum_unit_id = $1::uuid
        `,
        input.curriculumUnitId,
      );
      const nextSeq = Number(seqRows[0]?.next_seq || 1);

      // 3. Insert into lesson_plans
      const planInsert: any[] = await tx.$queryRawUnsafe(
        `
        INSERT INTO lesson_plans (
          curriculum_unit_id,
          teacher_staff_id,
          lesson_title,
          lesson_summary,
          sequence_number,
          planned_date,
          duration_minutes,
          teaching_approach,
          prerequisite_knowledge,
          is_active,
          created_by,
          updated_by
        ) VALUES (
          $1::uuid,
          $2::uuid,
          $3::text,
          $4::text,
          $5::int,
          $6::date,
          $7::smallint,
          'flipped'::text,
          $8::text,
          true,
          $9::uuid,
          $9::uuid
        )
        RETURNING lesson_plan_id
        `,
        input.curriculumUnitId,
        input.teacherStaffId,
        input.lessonTitle.trim(),
        input.lessonSummary ? input.lessonSummary.trim() : null,
        nextSeq,
        input.plannedDate || null,
        input.durationMinutes || 45,
        input.prerequisiteKnowledge ? input.prerequisiteKnowledge.trim() : null,
        input.actorUserId,
      );

      const lessonPlanId = planInsert[0].lesson_plan_id;

      // 4. Attach pre-class resources
      if (input.resources && input.resources.length > 0) {
        let rSeq = 1;
        for (const res of input.resources) {
          await tx.$queryRawUnsafe(
            `
            INSERT INTO lesson_plan_resources (
              lesson_plan_id,
              resource_id,
              org_id,
              usage_notes,
              sequence_number,
              created_by
            ) VALUES (
              $1::uuid,
              $2::uuid,
              $3::uuid,
              $4::text,
              $5::int,
              $6::uuid
            )
            ON CONFLICT (lesson_plan_id, resource_id) DO UPDATE SET
              usage_notes = EXCLUDED.usage_notes,
              sequence_number = EXCLUDED.sequence_number
            `,
            lessonPlanId,
            res.resource_id,
            input.orgId,
            res.usage_notes || (res as any).access_instructions || 'Pre-class review material',
            res.sequence_number || rSeq++,
            input.actorUserId,
          );
        }
      }

      // 5. Attach expected learning outcomes
      if (input.outcomes && input.outcomes.length > 0) {
        for (const out of input.outcomes) {
          await tx.$queryRawUnsafe(
            `
            INSERT INTO lesson_plan_outcomes (
              lesson_plan_id,
              learning_outcome_id,
              coverage_notes,
              created_by
            ) VALUES (
              $1::uuid,
              $2::uuid,
              $3::text,
              $4::uuid
            )
            ON CONFLICT (lesson_plan_id, learning_outcome_id) DO UPDATE SET
              coverage_notes = EXCLUDED.coverage_notes
            `,
            lessonPlanId,
            out.learning_outcome_id,
            out.coverage_notes || null,
            input.actorUserId,
          );
        }
      }

      // 6. Attach preparation questions (exit tickets)
      if (input.preparationQuestions && input.preparationQuestions.length > 0) {
        let qSeq = 1;
        for (const q of input.preparationQuestions) {
          await tx.$queryRawUnsafe(
            `
            INSERT INTO lesson_exit_tickets (
              lesson_plan_id,
              prompt,
              expected_response_or_criteria,
              sequence_number,
              created_by,
              updated_by
            ) VALUES (
              $1::uuid,
              $2::text,
              $3::text,
              $4::int,
              $5::uuid,
              $5::uuid
            )
            `,
            lessonPlanId,
            q.prompt.trim(),
            q.expected_response ? q.expected_response.trim() : null,
            q.sequence_number || qSeq++,
            input.actorUserId,
          );
        }
      }

      // 7. Attach in-class activities
      if (input.inClassActivities && input.inClassActivities.length > 0) {
        let aSeq = 1;
        for (const act of input.inClassActivities) {
          await tx.$queryRawUnsafe(
            `
            INSERT INTO lesson_activities (
              lesson_plan_id,
              activity_type,
              activity_title,
              activity_description,
              duration_minutes,
              sequence_number,
              materials_required,
              created_by,
              updated_by
            ) VALUES (
              $1::uuid,
              $2::lesson_activity_type,
              $3::text,
              $4::text,
              $5::smallint,
              $6::int,
              $7::text,
              $8::uuid,
              $8::uuid
            )
            `,
            lessonPlanId,
            act.activity_type || 'discussion',
            act.activity_title.trim(),
            act.activity_description ? act.activity_description.trim() : null,
            act.duration_minutes || null,
            act.sequence_number || aSeq++,
            act.materials_required ? act.materials_required.trim() : null,
            input.actorUserId,
          );
        }
      }

      return lessonPlanId;
    });
  }

  static async listStudentFlippedSessions(
    orgId: string,
    studentId: string,
  ): Promise<ClassroomSessionDto[]> {
    const activeEnrollmentRows: any[] = await prisma.$queryRawUnsafe(
      `
      SELECT section_id
      FROM student_enrollments
      WHERE org_id = $1::uuid
        AND student_id = $2::uuid
        AND status = 'active'
        AND enrollment_date <= CURRENT_DATE
        AND (exit_date IS NULL OR exit_date >= CURRENT_DATE)
      `,
      orgId,
      studentId,
    );

    if (activeEnrollmentRows.length === 0) return [];
    const sectionIds = activeEnrollmentRows.map((r) => r.section_id);

    const placeholders = sectionIds.map((_, i) => `$${i + 2}::uuid`).join(', ');
    const sql = `
      ${buildSessionBaseSelect(false)}
      WHERE cs.org_id = $1::uuid
        AND cs.section_id IN (${placeholders})
        AND cs.teaching_approach = 'flipped'::classroom_teaching_approach
        AND cs.session_status IN ('scheduled'::classroom_session_status, 'in_progress'::classroom_session_status)
        AND cs.session_date >= CURRENT_DATE - INTERVAL '1 day'
      ${SESSION_GROUP_BY}
      ORDER BY cs.session_date ASC, cs.scheduled_start_time ASC
      LIMIT 20
    `;

    const rows: any[] = await prisma.$queryRawUnsafe(sql, orgId, ...sectionIds);
    const dtos = rows.map(mapSessionRow);

    // Enrich each flipped session with its preparation payload
    for (const s of dtos) {
      if (s.lesson_plan_id) {
        s.flipped_preparation = await this.getFlippedPreparation(
          orgId,
          s.lesson_plan_id,
          s.section_id,
          `${s.session_date} ${s.scheduled_start_time}`,
        );
      }
    }

    return dtos;
  }
}
