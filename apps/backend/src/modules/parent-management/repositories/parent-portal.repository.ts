import prisma from '../../../lib/prismaClient';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string | null | undefined): value is string {
  return Boolean(value && UUID_REGEX.test(value.trim()));
}

export interface ParentRecordSummary {
  parent_id: string;
  user_id: string | null;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
}

export interface OrganizationMetaRecord {
  org_id: string;
  org_name: string;
  board_affiliation: string | null;
}

export interface AcademicYearMetaRecord {
  academic_year_id: string;
  academic_year_name: string;
  start_date: string;
  end_date: string;
  status: string;
}

export interface RawChildEnrollment {
  enrollment_id: string;
  academic_year_grade_id: string;
  academic_year_id: string;
  academic_year_name: string;
  academic_year_status: string;
  grade_id: string;
  grade_code: string;
  grade_name: string;
  grade_board: string | null;
  section_id: string | null;
  section_name: string | null;
  section_room_no: string | null;
  class_teacher_staff_id: string | null;
  class_teacher_name: string | null;
  class_teacher_email: string | null;
  class_teacher_designation: string | null;
  roll_number: string | null;
  enrollment_status: string;
  enrollment_date: string;
  created_at: string;
}

export interface RawLinkedChild {
  student_id: string;
  org_id: string;
  application_id: string | null;
  user_id: string | null;
  avatar_url: string | null;
  admission_no: string | null;
  first_name: string;
  last_name: string | null;
  full_name: string;
  dob: string | null;
  gender: string | null;
  admission_date: string | null;
  student_status: string;
  relationship: string | null;
  is_primary_contact: boolean;
  enrollments: RawChildEnrollment[];
}

export interface RawTimetableEntryRow {
  timetable_entry_id: string;
  timetable_version_id: string;
  section_id: string;
  academic_year_grade_subject_id: string;
  faculty_assignment_id: string;
  weekday: number;
  bell_schedule_period_id: string;
  period_number: number;
  period_name: string;
  period_type: string;
  start_time: string;
  end_time: string;
  subject_id: string;
  subject_code: string;
  subject_name: string;
  staff_id: string;
  teacher_name: string;
  teacher_email: string | null;
  classroom_id: string | null;
  room_code: string | null;
  room_name: string | null;
  building_name: string | null;
  floor_name: string | null;
  notes: string | null;
}

export interface RawBellPeriodRow {
  bell_schedule_id: string;
  schedule_name: string;
  bell_schedule_period_id: string;
  period_number: number;
  period_name: string;
  period_type: string;
  start_time: string;
  end_time: string;
}

export class ParentPortalRepository {
  /**
   * Resolves parent records owned by the authenticated user within the tenant.
   * Email matching is strictly permitted ONLY for unclaimed parent records (user_id IS NULL).
   */
  static async resolveAuthorizedParentRecords(
    orgId: string,
    userId: string,
    userEmail?: string | null,
  ): Promise<ParentRecordSummary[]> {
    if (!isValidUuid(orgId) || !isValidUuid(userId)) {
      return [];
    }

    const cleanEmail = userEmail?.trim() || null;
    const rows = await prisma.parents.findMany({
      where: {
        org_id: orgId,
        OR: [
          { user_id: userId },
          ...(cleanEmail
            ? [{ user_id: null, email: { equals: cleanEmail, mode: 'insensitive' as const } }]
            : []),
        ],
      },
      select: {
        parent_id: true,
        user_id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
      },
    });

    return rows;
  }

  static async getOrganizationMeta(orgId: string): Promise<OrganizationMetaRecord | null> {
    if (!isValidUuid(orgId)) return null;
    const rows = await prisma.$queryRawUnsafe<OrganizationMetaRecord[]>(
      `
      SELECT org_id, org_name, board_affiliation
      FROM organizations
      WHERE org_id = $1::uuid
      LIMIT 1
      `,
      orgId,
    );
    return rows[0] || null;
  }

  static async getCurrentAcademicYear(orgId: string): Promise<AcademicYearMetaRecord | null> {
    if (!isValidUuid(orgId)) return null;
    const rows = await prisma.$queryRawUnsafe<AcademicYearMetaRecord[]>(
      `
      SELECT
        academic_year_id,
        academic_year_name,
        start_date::text as start_date,
        end_date::text as end_date,
        status::text as status
      FROM academic_years
      WHERE org_id = $1::uuid
      ORDER BY
        CASE WHEN status IN ('teaching', 'open') THEN 0 ELSE 1 END ASC,
        start_date DESC
      LIMIT 1
      `,
      orgId,
    );
    return rows[0] || null;
  }

  static async studentExistsInOrg(orgId: string, studentId: string): Promise<boolean> {
    if (!isValidUuid(orgId) || !isValidUuid(studentId)) return false;
    const student = await prisma.students.findFirst({
      where: { student_id: studentId, org_id: orgId },
      select: { student_id: true },
    });
    return Boolean(student);
  }

  /**
   * Lists all students in `orgId` linked to the authorized parent records.
   */
  static async findAuthorizedChildren(
    orgId: string,
    parentIds: string[],
    targetChildId?: string,
  ): Promise<RawLinkedChild[]> {
    if (!isValidUuid(orgId) || parentIds.length === 0) return [];
    if (targetChildId !== undefined && !isValidUuid(targetChildId)) return [];

    const sql = `
      SELECT
        sp.student_id,
        sp.relationship,
        sp.is_primary_contact,
        st.org_id,
        st.application_id,
        st.user_id,
        u_stu.avatar_url,
        st.admission_no,
        st.first_name,
        st.last_name,
        st.dob::text as dob,
        st.gender::text as gender,
        st.admission_date::text as admission_date,
        st.status::text as student_status
      FROM student_parents sp
      JOIN students st ON st.student_id = sp.student_id
      LEFT JOIN users u_stu ON u_stu.user_id = st.user_id
      WHERE sp.parent_id = ANY($1::uuid[])
        AND st.org_id = $2::uuid
        ${targetChildId ? 'AND st.student_id = $3::uuid' : ''}
      ORDER BY sp.is_primary_contact DESC, st.first_name ASC, st.last_name ASC
    `;

    const params: any[] = targetChildId ? [parentIds, orgId, targetChildId] : [parentIds, orgId];
    const studentRows = await prisma.$queryRawUnsafe<any[]>(sql, ...params);

    if (studentRows.length === 0) return [];

    // Deduplicate students if linked through multiple matching parent records
    const dedupedMap = new Map<string, any>();
    for (const row of studentRows) {
      const existing = dedupedMap.get(row.student_id);
      if (!existing || (!existing.is_primary_contact && row.is_primary_contact)) {
        dedupedMap.set(row.student_id, row);
      }
    }

    const studentIds = Array.from(dedupedMap.keys());
    const enrollmentRows = await prisma.$queryRawUnsafe<
      (RawChildEnrollment & { student_id: string })[]
    >(
      `
      SELECT
        se.student_id,
        se.enrollment_id,
        se.academic_year_grade_id,
        ay.academic_year_id,
        ay.academic_year_name,
        ay.status::text as academic_year_status,
        g.grade_id,
        g.grade_code,
        g.grade_name,
        g.board as grade_board,
        sec.section_id,
        sec.section_name,
        sec.room_no as section_room_no,
        sec.class_teacher_id as class_teacher_staff_id,
        NULLIF(TRIM(CONCAT(COALESCE(ct_user.first_name, ''), ' ', COALESCE(ct_user.last_name, ''))), '') as class_teacher_name,
        ct_user.email as class_teacher_email,
        ct_des.designation_name as class_teacher_designation,
        se.roll_number,
        se.status::text as enrollment_status,
        se.enrollment_date::text as enrollment_date,
        se.created_at::text as created_at
      FROM student_enrollments se
      JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = se.academic_year_grade_id
      JOIN academic_years ay ON ay.academic_year_id = ayg.academic_year_id
      JOIN grades g ON g.grade_id = ayg.grade_id
      LEFT JOIN sections sec ON sec.section_id = se.section_id
      LEFT JOIN staff ct_staff ON ct_staff.staff_id = sec.class_teacher_id
      LEFT JOIN users ct_user ON ct_user.user_id = ct_staff.user_id
      LEFT JOIN designations ct_des ON ct_des.designation_id = ct_staff.designation_id
      WHERE se.student_id = ANY($1::uuid[])
        AND ay.org_id = $2::uuid
      ORDER BY
        CASE WHEN se.status::text = 'active' THEN 0 ELSE 1 END ASC,
        CASE WHEN ay.status::text IN ('teaching', 'open') THEN 0 ELSE 1 END ASC,
        se.enrollment_date DESC,
        se.created_at DESC
      `,
      studentIds,
      orgId,
    );

    const enrollmentsByStudent = new Map<string, RawChildEnrollment[]>();
    for (const enr of enrollmentRows) {
      const list = enrollmentsByStudent.get(enr.student_id) || [];
      const { student_id: _sid, ...cleanEnr } = enr;
      list.push(cleanEnr);
      enrollmentsByStudent.set(enr.student_id, list);
    }

    return Array.from(dedupedMap.values()).map((row) => ({
      student_id: row.student_id,
      org_id: row.org_id,
      application_id: row.application_id,
      user_id: row.user_id,
      avatar_url: row.avatar_url,
      admission_no: row.admission_no,
      first_name: row.first_name,
      last_name: row.last_name,
      full_name: [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || 'Student',
      dob: row.dob,
      gender: row.gender,
      admission_date: row.admission_date,
      student_status: row.student_status,
      relationship: row.relationship,
      is_primary_contact: Boolean(row.is_primary_contact),
      enrollments: enrollmentsByStudent.get(row.student_id) || [],
    }));
  }

  /**
   * Resolves section teachers (class teacher + active subject faculty assignments).
   */
  static async findSectionFaculty(orgId: string, sectionId: string) {
    if (!isValidUuid(orgId) || !isValidUuid(sectionId)) return [];
    const sql = `
      SELECT
        ssfa.faculty_assignment_id,
        ssfa.section_id,
        ssfa.academic_year_grade_subject_id,
        ssfa.assignment_role::text as assignment_role,
        st.staff_id,
        st.employee_code,
        NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), '') as teacher_name,
        u.email as teacher_email,
        des.designation_name,
        sub.subject_id,
        sub.subject_code,
        sub.subject_name
      FROM section_subject_faculty_assignments ssfa
      JOIN sections sec ON sec.section_id = ssfa.section_id
      JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = sec.academic_year_grade_id
      JOIN academic_years ay ON ay.academic_year_id = ayg.academic_year_id
      JOIN staff st ON st.staff_id = ssfa.staff_id
      JOIN users u ON u.user_id = st.user_id
      LEFT JOIN designations des ON des.designation_id = st.designation_id
      JOIN academic_year_grade_subjects aygs ON aygs.academic_year_grade_subject_id = ssfa.academic_year_grade_subject_id
      JOIN subjects sub ON sub.subject_id = aygs.subject_id
      WHERE ssfa.section_id = $1::uuid
        AND ay.org_id = $2::uuid
        AND ssfa.is_active = true
      ORDER BY sub.subject_name ASC,
        CASE WHEN ssfa.assignment_role::text = 'primary' THEN 0 ELSE 1 END ASC
    `;
    return prisma.$queryRawUnsafe<any[]>(sql, sectionId, orgId);
  }

  /**
   * Fetches published timetable version, bell schedule working days/periods, and section entries.
   */
  static async findChildTimetable(
    orgId: string,
    academicYearId: string,
    academicYearGradeId: string,
    sectionId: string,
  ): Promise<{
    publishedVersion: {
      timetable_version_id: string;
      version_number: number;
      version_name: string | null;
      published_at: string | null;
    } | null;
    bellPeriods: RawBellPeriodRow[];
    workingWeekdays: number[];
    entries: RawTimetableEntryRow[];
    coTeachersBySlotKey: Map<string, string[]>;
  }> {
    const versionRows = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT
        tv.timetable_version_id,
        tv.version_number,
        tv.version_name,
        tv.published_at::text as published_at
      FROM timetable_versions tv
      JOIN academic_years ay ON ay.academic_year_id = tv.academic_year_id
      WHERE tv.academic_year_id = $1::uuid
        AND ay.org_id = $2::uuid
        AND tv.status = 'published'::timetable_status
      ORDER BY tv.version_number DESC, tv.published_at DESC NULLS LAST
      LIMIT 1
      `,
      academicYearId,
      orgId,
    );

    const publishedVersion = versionRows[0] || null;

    const bellScheduleRows = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT bs.bell_schedule_id, bs.schedule_name
      FROM bell_schedules bs
      JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = bs.academic_year_grade_id
      JOIN academic_years ay ON ay.academic_year_id = ayg.academic_year_id
      WHERE bs.academic_year_grade_id = $1::uuid
        AND ay.org_id = $2::uuid
        AND bs.is_active = true
      ORDER BY bs.updated_at DESC
      LIMIT 1
      `,
      academicYearGradeId,
      orgId,
    );

    let bellPeriods: RawBellPeriodRow[] = [];
    let workingWeekdays: number[] = [];

    if (bellScheduleRows[0]) {
      const bellScheduleId = bellScheduleRows[0].bell_schedule_id;
      const scheduleName = bellScheduleRows[0].schedule_name;

      const [periodRows, dayRows] = await Promise.all([
        prisma.$queryRawUnsafe<any[]>(
          `
          SELECT
            bell_schedule_id,
            bell_schedule_period_id,
            period_number,
            period_name,
            period_type::text as period_type,
            to_char(start_time, 'HH24:MI') as start_time,
            to_char(end_time, 'HH24:MI') as end_time
          FROM bell_schedule_periods
          WHERE bell_schedule_id = $1::uuid AND is_active = true
          ORDER BY period_number ASC, start_time ASC
          `,
          bellScheduleId,
        ),
        prisma.$queryRawUnsafe<{ weekday: number }[]>(
          `
          SELECT weekday
          FROM bell_schedule_days
          WHERE academic_year_grade_id = $1::uuid
            AND bell_schedule_id = $2::uuid
          ORDER BY weekday ASC
          `,
          academicYearGradeId,
          bellScheduleId,
        ),
      ]);

      bellPeriods = periodRows.map((p) => ({
        ...p,
        schedule_name: scheduleName,
      }));
      workingWeekdays = dayRows.map((d) => Number(d.weekday));
    }

    let entries: RawTimetableEntryRow[] = [];
    if (publishedVersion) {
      entries = await prisma.$queryRawUnsafe<RawTimetableEntryRow[]>(
        `
        SELECT
          te.timetable_entry_id,
          te.timetable_version_id,
          te.section_id,
          te.academic_year_grade_subject_id,
          te.faculty_assignment_id,
          te.weekday,
          te.bell_schedule_period_id,
          bsp.period_number,
          bsp.period_name,
          bsp.period_type::text as period_type,
          to_char(bsp.start_time, 'HH24:MI') as start_time,
          to_char(bsp.end_time, 'HH24:MI') as end_time,
          sub.subject_id,
          sub.subject_code,
          sub.subject_name,
          st.staff_id,
          COALESCE(NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''), 'Faculty') as teacher_name,
          u.email as teacher_email,
          c.classroom_id,
          c.room_code,
          c.room_name,
          c.building_name,
          c.floor_name,
          te.notes
        FROM timetable_entries te
        JOIN timetable_versions tv ON tv.timetable_version_id = te.timetable_version_id
        JOIN academic_years ay ON ay.academic_year_id = tv.academic_year_id
        JOIN bell_schedule_periods bsp ON bsp.bell_schedule_period_id = te.bell_schedule_period_id
        JOIN academic_year_grade_subjects aygs ON aygs.academic_year_grade_subject_id = te.academic_year_grade_subject_id
        JOIN subjects sub ON sub.subject_id = aygs.subject_id
        JOIN section_subject_faculty_assignments ssfa ON ssfa.faculty_assignment_id = te.faculty_assignment_id
        JOIN staff st ON st.staff_id = ssfa.staff_id
        JOIN users u ON u.user_id = st.user_id
        LEFT JOIN classrooms c ON c.classroom_id = te.classroom_id
        WHERE te.timetable_version_id = $1::uuid
          AND te.section_id = $2::uuid
          AND ay.org_id = $3::uuid
          AND tv.status = 'published'::timetable_status
        ORDER BY te.weekday ASC, bsp.period_number ASC, bsp.start_time ASC
        `,
        publishedVersion.timetable_version_id,
        sectionId,
        orgId,
      );
    }

    // Also include active co-teachers mapped to the section & subject offering
    const coTeachersBySlotKey = new Map<string, string[]>();
    if (entries.length > 0) {
      const facultyRows = await this.findSectionFaculty(orgId, sectionId);
      for (const f of facultyRows) {
        const key = `${f.academic_year_grade_subject_id}`;
        const list = coTeachersBySlotKey.get(key) || [];
        if (f.teacher_name && !list.includes(f.teacher_name)) {
          list.push(f.teacher_name);
        }
        coTeachersBySlotKey.set(key, list);
      }
    }

    if (workingWeekdays.length === 0) {
      if (entries.length > 0) {
        workingWeekdays = Array.from(new Set(entries.map((e) => Number(e.weekday)))).sort(
          (a, b) => a - b,
        );
      } else {
        const calDays = await prisma.$queryRawUnsafe<{ weekday: number }[]>(
          `
          SELECT acwd.weekday
          FROM academic_calendar_working_days acwd
          JOIN academic_calendars ac ON ac.academic_calendar_id = acwd.academic_calendar_id
          WHERE ac.academic_year_id = $1::uuid AND ac.status = 'published'::academic_calendar_status
          ORDER BY acwd.weekday ASC
          `,
          academicYearId,
        );
        workingWeekdays = calDays.map((d) => Number(d.weekday));
      }
    }

    return {
      publishedVersion,
      bellPeriods,
      workingWeekdays,
      entries,
      coTeachersBySlotKey,
    };
  }

  /**
   * Lists grade-offered subjects for the child's academic year grade + section teachers + resource/plan counts.
   */
  static async findChildSubjects(
    orgId: string,
    studentId: string,
    gradeId: string,
    academicYearGradeId: string,
    sectionId: string | null,
  ) {
    const offerings = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT
        aygs.academic_year_grade_subject_id,
        aygs.subject_id,
        aygs.subject_requirement::text as subject_requirement,
        aygs.weekly_periods,
        aygs.theory_periods,
        aygs.practical_periods,
        aygs.display_order,
        sub.subject_code,
        sub.subject_name,
        sub.description as subject_description,
        sc.category_name,
        sc.category_code,
        ssg.subject_selection_group_id,
        ssg.group_code,
        ssg.group_name,
        ssg.min_select,
        ssg.max_select,
        (
          SELECT COUNT(*)::int
          FROM curriculum_plans cp
          WHERE cp.academic_year_grade_subject_id = aygs.academic_year_grade_subject_id
            AND cp.org_id = $2::uuid
            AND cp.status = 'published'::curriculum_plan_status
        ) as published_curriculum_count,
        (
          SELECT COUNT(DISTINCT lr.resource_id)::int
          FROM learning_resource_subjects lrs
          JOIN learning_resources lr ON lr.resource_id = lrs.resource_id
          WHERE lrs.subject_id = aygs.subject_id
            AND lr.org_id = $2::uuid
            AND lr.resource_status = 'published'::resource_status
            AND (
              (
                NOT EXISTS (
                  SELECT 1 FROM learning_resource_shares s
                  WHERE s.resource_id = lr.resource_id AND s.org_id = $2::uuid
                )
                AND EXISTS (
                  SELECT 1 FROM learning_resource_grades lrg
                  WHERE lrg.resource_id = lr.resource_id AND lrg.grade_id = $3::uuid
                )
              )
              OR EXISTS (
                SELECT 1 FROM learning_resource_shares s
                WHERE s.resource_id = lr.resource_id
                  AND s.org_id = $2::uuid
                  AND s.revoked_at IS NULL
                  AND s.available_from <= NOW()
                  AND (
                    (
                      s.audience_type = 'all_students'::resource_share_audience
                      AND (
                        NOT EXISTS (SELECT 1 FROM learning_resource_grades lrg WHERE lrg.resource_id = lr.resource_id)
                        OR EXISTS (SELECT 1 FROM learning_resource_grades lrg WHERE lrg.resource_id = lr.resource_id AND lrg.grade_id = $3::uuid)
                      )
                    )
                    OR (
                      $4::uuid IS NOT NULL
                      AND s.audience_type = 'selected_sections'::resource_share_audience
                      AND EXISTS (
                        SELECT 1 FROM learning_resource_share_sections lrss
                        WHERE lrss.share_id = s.share_id AND lrss.section_id = $4::uuid
                      )
                    )
                    OR (
                      s.audience_type = 'selected_students'::resource_share_audience
                      AND EXISTS (
                        SELECT 1 FROM learning_resource_recipients lrr
                        WHERE lrr.share_id = s.share_id AND lrr.student_id = $5::uuid
                      )
                    )
                  )
              )
            )
        ) as published_resources_count
      FROM academic_year_grade_subjects aygs
      JOIN subjects sub ON sub.subject_id = aygs.subject_id
      LEFT JOIN subject_categories sc ON sc.subject_category_id = sub.subject_category_id
      LEFT JOIN subject_selection_group_options ssgo
        ON ssgo.academic_year_grade_subject_id = aygs.academic_year_grade_subject_id
        AND ssgo.academic_year_grade_id = aygs.academic_year_grade_id
        AND ssgo.is_active = true
      LEFT JOIN subject_selection_groups ssg
        ON ssg.subject_selection_group_id = ssgo.subject_selection_group_id
        AND ssg.is_active = true
      WHERE aygs.academic_year_grade_id = $1::uuid
        AND aygs.is_active = true
        AND sub.org_id = $2::uuid
      ORDER BY aygs.display_order ASC, sub.subject_name ASC
      `,
      academicYearGradeId,
      orgId,
      gradeId,
      sectionId,
      studentId,
    );

    const facultyRows = sectionId ? await this.findSectionFaculty(orgId, sectionId) : [];
    const facultyByOffering = new Map<string, any[]>();
    for (const f of facultyRows) {
      const list = facultyByOffering.get(f.academic_year_grade_subject_id) || [];
      list.push({
        staff_id: f.staff_id,
        teacher_name: f.teacher_name,
        teacher_email: f.teacher_email,
        designation_name: f.designation_name,
        assignment_role: f.assignment_role,
      });
      facultyByOffering.set(f.academic_year_grade_subject_id, list);
    }

    return offerings.map((row) => ({
      ...row,
      teachers: facultyByOffering.get(row.academic_year_grade_subject_id) || [],
    }));
  }

  /**
   * Lists strictly published curriculum plans, units, learning outcomes, and board/framework context.
   */
  static async findChildCurriculum(
    orgId: string,
    academicYearGradeId: string,
    subjectIdFilter?: string,
  ) {
    if (subjectIdFilter && !isValidUuid(subjectIdFilter)) {
      return [];
    }

    const planRows = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT
        cp.curriculum_plan_id,
        cp.academic_year_grade_subject_id,
        cp.version_number,
        cp.plan_title,
        cp.plan_description,
        cp.status::text as status,
        cp.planned_start_date::text as planned_start_date,
        cp.planned_end_date::text as planned_end_date,
        cp.published_at::text as published_at,
        aygs.subject_id,
        sub.subject_code,
        sub.subject_name,
        cf.framework_code,
        cf.framework_name,
        cf.authority_name,
        cfv.version_code as framework_version_code,
        cfv.version_name as framework_version_name
      FROM curriculum_plans cp
      JOIN academic_year_grade_subjects aygs ON aygs.academic_year_grade_subject_id = cp.academic_year_grade_subject_id
      JOIN subjects sub ON sub.subject_id = aygs.subject_id
      LEFT JOIN academic_year_curriculum_mappings aycm ON aycm.academic_year_curriculum_mapping_id = cp.academic_year_curriculum_mapping_id
      LEFT JOIN curriculum_framework_versions cfv ON cfv.framework_version_id = aycm.framework_version_id
      LEFT JOIN curriculum_frameworks cf ON cf.framework_id = cfv.framework_id
      WHERE cp.org_id = $1::uuid
        AND aygs.academic_year_grade_id = $2::uuid
        AND aygs.is_active = true
        AND cp.status = 'published'::curriculum_plan_status
        ${subjectIdFilter ? 'AND aygs.subject_id = $3::uuid' : ''}
      ORDER BY aygs.display_order ASC, sub.subject_name ASC, cp.version_number DESC
      `,
      ...(subjectIdFilter
        ? [orgId, academicYearGradeId, subjectIdFilter]
        : [orgId, academicYearGradeId]),
    );

    if (planRows.length === 0) return [];

    const planIds = planRows.map((p) => p.curriculum_plan_id);
    const unitRows = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT
        cpu.curriculum_unit_id,
        cpu.curriculum_plan_id,
        cpu.unit_code,
        cpu.unit_title,
        cpu.unit_description,
        cpu.sequence_number,
        cpu.planned_duration_periods,
        cpu.planned_start_date::text as planned_start_date,
        cpu.planned_end_date::text as planned_end_date
      FROM curriculum_plan_units cpu
      WHERE cpu.curriculum_plan_id = ANY($1::uuid[])
      ORDER BY cpu.sequence_number ASC
      `,
      planIds,
    );

    const unitIds = unitRows.map((u) => u.curriculum_unit_id);
    const outcomeRows =
      unitIds.length > 0
        ? await prisma.$queryRawUnsafe<any[]>(
            `
            SELECT
              clo.learning_outcome_id,
              clo.curriculum_unit_id,
              clo.outcome_code,
              clo.outcome_statement,
              clo.bloom_level::text as bloom_level,
              clo.assessment_criteria,
              clo.sequence_number
            FROM curriculum_learning_outcomes clo
            WHERE clo.curriculum_unit_id = ANY($1::uuid[])
            ORDER BY clo.sequence_number ASC
            `,
            unitIds,
          )
        : [];

    const outcomesByUnit = new Map<string, any[]>();
    for (const o of outcomeRows) {
      const list = outcomesByUnit.get(o.curriculum_unit_id) || [];
      list.push(o);
      outcomesByUnit.set(o.curriculum_unit_id, list);
    }

    const unitsByPlan = new Map<string, any[]>();
    for (const u of unitRows) {
      const list = unitsByPlan.get(u.curriculum_plan_id) || [];
      list.push({
        ...u,
        outcomes: outcomesByUnit.get(u.curriculum_unit_id) || [],
      });
      unitsByPlan.set(u.curriculum_plan_id, list);
    }

    return planRows.map((plan) => ({
      ...plan,
      units: unitsByPlan.get(plan.curriculum_plan_id) || [],
    }));
  }

  /**
   * Queries published digital learning resources accessible to this specific child.
   */
  static async findChildResources(
    orgId: string,
    studentId: string,
    gradeId: string,
    sectionId: string | null,
    filters: {
      subjectId?: string;
      categoryId?: string;
      resourceType?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 24;
    const offset = (page - 1) * limit;

    const params: any[] = [orgId, gradeId, sectionId, studentId];
    const conditions: string[] = [
      'lr.org_id = $1::uuid',
      `lr.resource_status = 'published'::resource_status`,
      `(
        (
          NOT EXISTS (
            SELECT 1 FROM learning_resource_shares s
            WHERE s.resource_id = lr.resource_id AND s.org_id = $1::uuid
          )
          AND EXISTS (
            SELECT 1 FROM learning_resource_grades lrg
            WHERE lrg.resource_id = lr.resource_id AND lrg.grade_id = $2::uuid
          )
        )
        OR EXISTS (
          SELECT 1 FROM learning_resource_shares s
          WHERE s.resource_id = lr.resource_id
            AND s.org_id = $1::uuid
            AND s.revoked_at IS NULL
            AND s.available_from <= NOW()
            AND (
              (
                s.audience_type = 'all_students'::resource_share_audience
                AND (
                  NOT EXISTS (SELECT 1 FROM learning_resource_grades lrg WHERE lrg.resource_id = lr.resource_id)
                  OR EXISTS (SELECT 1 FROM learning_resource_grades lrg WHERE lrg.resource_id = lr.resource_id AND lrg.grade_id = $2::uuid)
                )
              )
              OR (
                $3::uuid IS NOT NULL
                AND s.audience_type = 'selected_sections'::resource_share_audience
                AND EXISTS (
                  SELECT 1 FROM learning_resource_share_sections lrss
                  WHERE lrss.share_id = s.share_id AND lrss.section_id = $3::uuid
                )
              )
              OR (
                s.audience_type = 'selected_students'::resource_share_audience
                AND EXISTS (
                  SELECT 1 FROM learning_resource_recipients lrr
                  WHERE lrr.share_id = s.share_id AND lrr.student_id = $4::uuid
                )
              )
            )
        )
      )`,
    ];

    if (filters.subjectId) {
      if (!isValidUuid(filters.subjectId)) {
        return { items: [], total: 0 };
      }
      params.push(filters.subjectId);
      conditions.push(
        `EXISTS (SELECT 1 FROM learning_resource_subjects lrs WHERE lrs.resource_id = lr.resource_id AND lrs.subject_id = $${params.length}::uuid)`,
      );
    }

    if (filters.categoryId) {
      if (!isValidUuid(filters.categoryId)) {
        return { items: [], total: 0 };
      }
      params.push(filters.categoryId);
      conditions.push(`lr.category_id = $${params.length}::uuid`);
    }

    if (filters.resourceType && ['file', 'external_link'].includes(filters.resourceType)) {
      params.push(filters.resourceType);
      conditions.push(`lr.resource_type::text = $${params.length}`);
    }

    if (filters.search && filters.search.trim().length > 0) {
      params.push(`%${filters.search.trim()}%`);
      const idx = params.length;
      conditions.push(`(lr.title ILIKE $${idx} OR COALESCE(lr.description, '') ILIKE $${idx})`);
    }

    const whereClause = conditions.join(' AND ');

    const countRows = await prisma.$queryRawUnsafe<Array<{ total: string }>>(
      `SELECT COUNT(*)::text as total FROM learning_resources lr WHERE ${whereClause}`,
      ...params,
    );
    const total = parseInt(countRows[0]?.total || '0', 10);

    params.push(limit);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const items = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT
        lr.resource_id,
        lr.org_id,
        lr.title,
        lr.description,
        lr.resource_type::text as resource_type,
        lr.file_name,
        lr.file_size_bytes::text as file_size_bytes,
        lr.mime_type,
        lr.external_url,
        lr.category_id,
        rc.category_name,
        lr.resource_status::text as resource_status,
        lr.created_at::text as created_at,
        lr.updated_at::text as updated_at,
        NULLIF(TRIM(CONCAT(COALESCE(u_up.first_name, ''), ' ', COALESCE(u_up.last_name, ''))), '') as uploaded_by_name,
        CASE
          WHEN EXISTS (
            SELECT 1 FROM learning_resource_shares s
            WHERE s.resource_id = lr.resource_id
              AND s.org_id = $1::uuid
              AND s.revoked_at IS NULL
              AND s.available_from <= NOW()
              AND (
                s.audience_type = 'all_students'::resource_share_audience
                OR ($3::uuid IS NOT NULL AND s.audience_type = 'selected_sections'::resource_share_audience AND EXISTS (SELECT 1 FROM learning_resource_share_sections lrss WHERE lrss.share_id = s.share_id AND lrss.section_id = $3::uuid))
                OR (s.audience_type = 'selected_students'::resource_share_audience AND EXISTS (SELECT 1 FROM learning_resource_recipients lrr WHERE lrr.share_id = s.share_id AND lrr.student_id = $4::uuid))
              )
          )
          THEN EXISTS (
            SELECT 1 FROM learning_resource_shares s
            WHERE s.resource_id = lr.resource_id
              AND s.org_id = $1::uuid
              AND s.revoked_at IS NULL
              AND s.available_from <= NOW()
              AND s.allow_download = true
              AND (
                s.audience_type = 'all_students'::resource_share_audience
                OR ($3::uuid IS NOT NULL AND s.audience_type = 'selected_sections'::resource_share_audience AND EXISTS (SELECT 1 FROM learning_resource_share_sections lrss WHERE lrss.share_id = s.share_id AND lrss.section_id = $3::uuid))
                OR (s.audience_type = 'selected_students'::resource_share_audience AND EXISTS (SELECT 1 FROM learning_resource_recipients lrr WHERE lrr.share_id = s.share_id AND lrr.student_id = $4::uuid))
              )
          )
          ELSE true
        END as allow_download,
        COALESCE(
          (
            SELECT json_agg(json_build_object('subject_id', sub.subject_id, 'subject_code', sub.subject_code, 'subject_name', sub.subject_name))
            FROM learning_resource_subjects lrs
            JOIN subjects sub ON sub.subject_id = lrs.subject_id
            WHERE lrs.resource_id = lr.resource_id
          ),
          '[]'::json
        ) as subjects,
        COALESCE(
          (
            SELECT json_agg(rt.tag_name)
            FROM learning_resource_tags lrt
            JOIN resource_tags rt ON rt.tag_id = lrt.tag_id
            WHERE lrt.resource_id = lr.resource_id
          ),
          '[]'::json
        ) as tags
      FROM learning_resources lr
      LEFT JOIN resource_categories rc ON rc.category_id = lr.category_id
      LEFT JOIN staff st ON st.staff_id = lr.uploaded_by_staff_id
      LEFT JOIN users u_up ON u_up.user_id = st.user_id
      WHERE ${whereClause}
      ORDER BY lr.updated_at DESC, lr.created_at DESC
      LIMIT $${limitIdx}::integer OFFSET $${offsetIdx}::integer
      `,
      ...params,
    );

    return { items, total };
  }

  /**
   * Checks whether a specific resource is published and accessible to the child, returning download permission.
   */
  static async checkChildResourceAccess(
    orgId: string,
    studentId: string,
    gradeId: string,
    sectionId: string | null,
    resourceId: string,
  ): Promise<{ accessible: boolean; allowDownload: boolean }> {
    if (!isValidUuid(resourceId)) {
      return { accessible: false, allowDownload: false };
    }

    const rows = await prisma.$queryRawUnsafe<Array<{ allow_download: boolean }>>(
      `
      SELECT
        CASE
          WHEN EXISTS (
            SELECT 1 FROM learning_resource_shares s
            WHERE s.resource_id = lr.resource_id
              AND s.org_id = $1::uuid
              AND s.revoked_at IS NULL
              AND s.available_from <= NOW()
              AND (
                s.audience_type = 'all_students'::resource_share_audience
                OR ($3::uuid IS NOT NULL AND s.audience_type = 'selected_sections'::resource_share_audience AND EXISTS (SELECT 1 FROM learning_resource_share_sections lrss WHERE lrss.share_id = s.share_id AND lrss.section_id = $3::uuid))
                OR (s.audience_type = 'selected_students'::resource_share_audience AND EXISTS (SELECT 1 FROM learning_resource_recipients lrr WHERE lrr.share_id = s.share_id AND lrr.student_id = $4::uuid))
              )
          )
          THEN EXISTS (
            SELECT 1 FROM learning_resource_shares s
            WHERE s.resource_id = lr.resource_id
              AND s.org_id = $1::uuid
              AND s.revoked_at IS NULL
              AND s.available_from <= NOW()
              AND s.allow_download = true
              AND (
                s.audience_type = 'all_students'::resource_share_audience
                OR ($3::uuid IS NOT NULL AND s.audience_type = 'selected_sections'::resource_share_audience AND EXISTS (SELECT 1 FROM learning_resource_share_sections lrss WHERE lrss.share_id = s.share_id AND lrss.section_id = $3::uuid))
                OR (s.audience_type = 'selected_students'::resource_share_audience AND EXISTS (SELECT 1 FROM learning_resource_recipients lrr WHERE lrr.share_id = s.share_id AND lrr.student_id = $4::uuid))
              )
          )
          ELSE true
        END as allow_download
      FROM learning_resources lr
      WHERE lr.resource_id = $5::uuid
        AND lr.org_id = $1::uuid
        AND lr.resource_status = 'published'::resource_status
        AND (
          (
            NOT EXISTS (
              SELECT 1 FROM learning_resource_shares s
              WHERE s.resource_id = lr.resource_id AND s.org_id = $1::uuid
            )
            AND EXISTS (
              SELECT 1 FROM learning_resource_grades lrg
              WHERE lrg.resource_id = lr.resource_id AND lrg.grade_id = $2::uuid
            )
          )
          OR EXISTS (
            SELECT 1 FROM learning_resource_shares s
            WHERE s.resource_id = lr.resource_id
              AND s.org_id = $1::uuid
              AND s.revoked_at IS NULL
              AND s.available_from <= NOW()
              AND (
                (
                  s.audience_type = 'all_students'::resource_share_audience
                  AND (
                    NOT EXISTS (SELECT 1 FROM learning_resource_grades lrg WHERE lrg.resource_id = lr.resource_id)
                    OR EXISTS (SELECT 1 FROM learning_resource_grades lrg WHERE lrg.resource_id = lr.resource_id AND lrg.grade_id = $2::uuid)
                  )
                )
                OR (
                  $3::uuid IS NOT NULL
                  AND s.audience_type = 'selected_sections'::resource_share_audience
                  AND EXISTS (
                    SELECT 1 FROM learning_resource_share_sections lrss
                    WHERE lrss.share_id = s.share_id AND lrss.section_id = $3::uuid
                  )
                )
                OR (
                  s.audience_type = 'selected_students'::resource_share_audience
                  AND EXISTS (
                    SELECT 1 FROM learning_resource_recipients lrr
                    WHERE lrr.share_id = s.share_id AND lrr.student_id = $4::uuid
                  )
                )
              )
          )
        )
      LIMIT 1
      `,
      orgId,
      gradeId,
      sectionId,
      studentId,
      resourceId,
    );

    if (!rows[0]) {
      return { accessible: false, allowDownload: false };
    }
    return { accessible: true, allowDownload: Boolean(rows[0].allow_download) };
  }

  /**
   * Fetches published academic calendar, terms, working days, and grade-relevant events.
   */
  static async findChildCalendar(
    orgId: string,
    academicYearId: string,
    academicYearGradeId: string,
    filters: { entryType?: string; fromDate?: string; toDate?: string } = {},
  ) {
    const calRows = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT
        ac.academic_calendar_id,
        ac.academic_year_id,
        ay.academic_year_name,
        ac.status::text as status,
        ac.version,
        ac.published_at::text as published_at
      FROM academic_calendars ac
      JOIN academic_years ay ON ay.academic_year_id = ac.academic_year_id
      WHERE ac.academic_year_id = $1::uuid
        AND ay.org_id = $2::uuid
        AND ac.status = 'published'::academic_calendar_status
      ORDER BY ac.version DESC
      LIMIT 1
      `,
      academicYearId,
      orgId,
    );

    const calendar = calRows[0] || null;
    if (!calendar) {
      return {
        is_published: false,
        calendar: null,
        working_days: [] as number[],
        terms: [] as any[],
        entries: [] as any[],
      };
    }

    const [workingDayRows, termRows] = await Promise.all([
      prisma.$queryRawUnsafe<{ weekday: number }[]>(
        `
        SELECT weekday
        FROM academic_calendar_working_days
        WHERE academic_calendar_id = $1::uuid
        ORDER BY weekday ASC
        `,
        calendar.academic_calendar_id,
      ),
      prisma.$queryRawUnsafe<any[]>(
        `
        SELECT
          academic_term_id,
          term_name,
          term_number,
          start_date::text as start_date,
          end_date::text as end_date,
          is_active
        FROM academic_terms
        WHERE academic_calendar_id = $1::uuid AND is_active = true
        ORDER BY term_number ASC
        `,
        calendar.academic_calendar_id,
      ),
    ]);

    const params: any[] = [calendar.academic_calendar_id, academicYearGradeId];
    const conditions: string[] = [
      'ace.academic_calendar_id = $1::uuid',
      `(
        NOT EXISTS (
          SELECT 1 FROM academic_calendar_entry_grades aceg
          WHERE aceg.academic_calendar_entry_id = ace.academic_calendar_entry_id
        )
        OR EXISTS (
          SELECT 1 FROM academic_calendar_entry_grades aceg
          WHERE aceg.academic_calendar_entry_id = ace.academic_calendar_entry_id
            AND aceg.academic_year_grade_id = $2::uuid
        )
      )`,
    ];

    if (
      filters.entryType &&
      ['holiday', 'vacation', 'exam', 'school_event', 'school_closure'].includes(filters.entryType)
    ) {
      params.push(filters.entryType);
      conditions.push(`ace.entry_type::text = $${params.length}`);
    }

    if (filters.fromDate && /^\d{4}-\d{2}-\d{2}$/.test(filters.fromDate)) {
      params.push(filters.fromDate);
      conditions.push(`ace.end_date >= $${params.length}::date`);
    }

    if (filters.toDate && /^\d{4}-\d{2}-\d{2}$/.test(filters.toDate)) {
      params.push(filters.toDate);
      conditions.push(`ace.start_date <= $${params.length}::date`);
    }

    const entries = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT
        ace.academic_calendar_entry_id,
        ace.academic_term_id,
        at.term_name,
        ace.entry_name,
        ace.entry_type::text as entry_type,
        ace.start_date::text as start_date,
        ace.end_date::text as end_date,
        ace.is_all_day,
        to_char(ace.start_time, 'HH24:MI') as start_time,
        to_char(ace.end_time, 'HH24:MI') as end_time,
        ace.description,
        EXISTS (
          SELECT 1 FROM academic_calendar_entry_grades aceg
          WHERE aceg.academic_calendar_entry_id = ace.academic_calendar_entry_id
        ) as is_grade_specific
      FROM academic_calendar_entries ace
      LEFT JOIN academic_terms at ON at.academic_term_id = ace.academic_term_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ace.start_date ASC, ace.start_time ASC NULLS LAST
      `,
      ...params,
    );

    return {
      is_published: true,
      calendar,
      working_days: workingDayRows.map((d) => Number(d.weekday)),
      terms: termRows,
      entries,
    };
  }
}
