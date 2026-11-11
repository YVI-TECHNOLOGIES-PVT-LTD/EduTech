import prisma from '../../../lib/prismaClient';
import { ListTimetableVersionsRawInput, ListClassroomsInput } from '../dto/request/timetable.dto';

export interface TimetableVersionRecord {
  timetable_version_id: string;
  academic_year_id: string;
  academic_year_name: string;
  version_number: number;
  status: string;
  version_name: string | null;
  notes: string | null;
  submitted_at: string | null;
  submitted_by: string | null;
  published_at: string | null;
  published_by: string | null;
  archived_at: string | null;
  archived_by: string | null;
  created_at: string;
  updated_at: string;
  total_entries?: number;
  sections_count?: number;
  teachers_count?: number;
  classrooms_count?: number;
}

export interface TimetableEntryDetailRecord {
  timetable_entry_id: string;
  timetable_version_id: string;
  section_id: string;
  section_name: string;
  grade_id: string;
  grade_name: string;
  grade_code: string;
  academic_year_grade_subject_id: string;
  subject_id: string;
  subject_code: string;
  subject_name: string;
  faculty_assignment_id: string;
  staff_id: string;
  teacher_name: string;
  assignment_role: string;
  bell_schedule_period_id: string;
  period_number: number;
  period_name: string;
  period_type: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  weekday: number;
  classroom_id: string | null;
  room_code: string | null;
  room_name: string | null;
  room_capacity: number | null;
  lesson_type: string;
  lesson_topic: string | null;
  notes: string | null;
}

export interface ClassroomRecord {
  classroom_id: string;
  org_id: string;
  room_code: string;
  room_name: string;
  room_type: string;
  building_name: string | null;
  floor_name: string | null;
  capacity: number | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const ALLOWED_SORT_COLUMNS: Record<string, string> = {
  version_number: 'tv.version_number',
  created_at: 'tv.created_at',
  status: 'tv.status',
};

export class TimetableRepository {
  /**
   * Find paginated timetable versions for tenant
   */
  static async findVersions(
    orgId: string,
    params: ListTimetableVersionsRawInput = {},
  ): Promise<{ items: TimetableVersionRecord[]; total: number }> {
    const page = params.page !== undefined ? Number(params.page) : 1;
    const limit = params.limit !== undefined ? Number(params.limit) : 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['ay.org_id = $1::uuid'];
    const queryParams: any[] = [orgId];

    if (params.academic_year_id) {
      queryParams.push(params.academic_year_id);
      conditions.push(`tv.academic_year_id = $${queryParams.length}::uuid`);
    }

    if (params.status) {
      queryParams.push(params.status);
      conditions.push(`tv.status = $${queryParams.length}::timetable_status`);
    }

    const whereClause = conditions.join(' AND ');
    const sortColumn =
      (params.sortBy && ALLOWED_SORT_COLUMNS[params.sortBy]) || 'tv.version_number';
    const sortOrder = params.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const countSql = `
      SELECT COUNT(*)::text as total
      FROM timetable_versions tv
      JOIN academic_years ay ON ay.academic_year_id = tv.academic_year_id
      WHERE ${whereClause}
    `;

    const countRes = await prisma.$queryRawUnsafe<Array<{ total: string }>>(
      countSql,
      ...queryParams,
    );
    const total = parseInt(countRes[0]?.total || '0', 10);

    queryParams.push(limit);
    const limitIdx = queryParams.length;
    queryParams.push(offset);
    const offsetIdx = queryParams.length;

    const dataSql = `
      SELECT
        tv.timetable_version_id,
        tv.academic_year_id,
        ay.academic_year_name,
        tv.version_number,
        tv.status::text as status,
        tv.version_name,
        tv.notes,
        tv.submitted_at::text as submitted_at,
        tv.submitted_by,
        tv.published_at::text as published_at,
        tv.published_by,
        tv.archived_at::text as archived_at,
        tv.archived_by,
        tv.created_at::text as created_at,
        tv.updated_at::text as updated_at,
        (SELECT COUNT(*)::int FROM timetable_entries te WHERE te.timetable_version_id = tv.timetable_version_id) as total_entries,
        (SELECT COUNT(DISTINCT te.section_id)::int FROM timetable_entries te WHERE te.timetable_version_id = tv.timetable_version_id) as sections_count
      FROM timetable_versions tv
      JOIN academic_years ay ON ay.academic_year_id = tv.academic_year_id
      WHERE ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $${limitIdx}::integer OFFSET $${offsetIdx}::integer
    `;

    const items = await prisma.$queryRawUnsafe<TimetableVersionRecord[]>(dataSql, ...queryParams);
    return { items, total };
  }

  /**
   * Find single timetable version by ID scoped to tenant
   */
  static async findVersionById(
    orgId: string,
    versionId: string,
  ): Promise<TimetableVersionRecord | null> {
    const sql = `
      SELECT
        tv.timetable_version_id,
        tv.academic_year_id,
        ay.academic_year_name,
        tv.version_number,
        tv.status::text as status,
        tv.version_name,
        tv.notes,
        tv.submitted_at::text as submitted_at,
        tv.submitted_by,
        tv.published_at::text as published_at,
        tv.published_by,
        tv.archived_at::text as archived_at,
        tv.archived_by,
        tv.created_at::text as created_at,
        tv.updated_at::text as updated_at,
        (SELECT COUNT(*)::int FROM timetable_entries te WHERE te.timetable_version_id = tv.timetable_version_id) as total_entries,
        (SELECT COUNT(DISTINCT te.section_id)::int FROM timetable_entries te WHERE te.timetable_version_id = tv.timetable_version_id) as sections_count,
        (
          SELECT COUNT(DISTINCT ssfa.staff_id)::int
          FROM timetable_entries te
          JOIN section_subject_faculty_assignments ssfa ON ssfa.faculty_assignment_id = te.faculty_assignment_id
          WHERE te.timetable_version_id = tv.timetable_version_id
        ) as teachers_count,
        (
          SELECT COUNT(DISTINCT te.classroom_id)::int
          FROM timetable_entries te
          WHERE te.timetable_version_id = tv.timetable_version_id AND te.classroom_id IS NOT NULL
        ) as classrooms_count
      FROM timetable_versions tv
      JOIN academic_years ay ON ay.academic_year_id = tv.academic_year_id
      WHERE tv.timetable_version_id = $1::uuid AND ay.org_id = $2::uuid
      LIMIT 1
    `;

    const res = await prisma.$queryRawUnsafe<TimetableVersionRecord[]>(sql, versionId, orgId);
    return res[0] || null;
  }

  /**
   * Find the active published timetable version for an academic year (or latest active year)
   */
  static async findPublishedVersion(
    orgId: string,
    academicYearId?: string,
  ): Promise<TimetableVersionRecord | null> {
    let yearFilter = '';
    const params: any[] = [orgId];

    if (academicYearId) {
      params.push(academicYearId);
      yearFilter = `AND ay.academic_year_id = $${params.length}::uuid`;
    } else {
      yearFilter = `AND ay.status IN ('teaching', 'open')`;
    }

    const sql = `
      SELECT
        tv.timetable_version_id,
        tv.academic_year_id,
        ay.academic_year_name,
        tv.version_number,
        tv.status::text as status,
        tv.version_name,
        tv.notes,
        tv.submitted_at::text as submitted_at,
        tv.submitted_by,
        tv.published_at::text as published_at,
        tv.published_by,
        tv.archived_at::text as archived_at,
        tv.archived_by,
        tv.created_at::text as created_at,
        tv.updated_at::text as updated_at
      FROM timetable_versions tv
      JOIN academic_years ay ON ay.academic_year_id = tv.academic_year_id
      WHERE ay.org_id = $1::uuid AND tv.status = 'published'::timetable_status ${yearFilter}
      ORDER BY ay.start_date DESC, tv.version_number DESC
      LIMIT 1
    `;

    const res = await prisma.$queryRawUnsafe<TimetableVersionRecord[]>(sql, ...params);
    return res[0] || null;
  }

  /**
   * High-level operational overview metrics for timetables
   */
  static async getOverview(orgId: string): Promise<{
    total_timetables: number;
    published_timetables: number;
    draft_timetables: number;
    review_timetables: number;
    archived_timetables: number;
    total_scheduled_entries: number;
    total_sections_scheduled: number;
    total_sections_count: number;
    coverage_percentage: number;
    total_teachers_scheduled: number;
    total_classrooms_utilized: number;
  }> {
    const sql = `
      WITH tenant_years AS (
        SELECT academic_year_id FROM academic_years WHERE org_id = $1::uuid
      ),
      tenant_versions AS (
        SELECT tv.timetable_version_id, tv.status
        FROM timetable_versions tv
        JOIN tenant_years ty ON ty.academic_year_id = tv.academic_year_id
      ),
      tenant_entries AS (
        SELECT te.*
        FROM timetable_entries te
        JOIN tenant_versions tv ON tv.timetable_version_id = te.timetable_version_id
      ),
      total_sec AS (
        SELECT COUNT(s.section_id)::int as count
        FROM sections s
        JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = s.academic_year_grade_id
        JOIN tenant_years ty ON ty.academic_year_id = ayg.academic_year_id
        WHERE s.is_active = true
      )
      SELECT
        (SELECT COUNT(*)::int FROM tenant_versions) as total_timetables,
        (SELECT COUNT(*)::int FROM tenant_versions WHERE status = 'published') as published_timetables,
        (SELECT COUNT(*)::int FROM tenant_versions WHERE status = 'draft') as draft_timetables,
        (SELECT COUNT(*)::int FROM tenant_versions WHERE status = 'review') as review_timetables,
        (SELECT COUNT(*)::int FROM tenant_versions WHERE status = 'archived') as archived_timetables,
        (SELECT COUNT(*)::int FROM tenant_entries) as total_scheduled_entries,
        (SELECT COUNT(DISTINCT section_id)::int FROM tenant_entries) as total_sections_scheduled,
        (SELECT count FROM total_sec) as total_sections_count,
        (
          SELECT COUNT(DISTINCT ssfa.staff_id)::int
          FROM tenant_entries te
          JOIN section_subject_faculty_assignments ssfa ON ssfa.faculty_assignment_id = te.faculty_assignment_id
        ) as total_teachers_scheduled,
        (SELECT COUNT(DISTINCT classroom_id)::int FROM tenant_entries WHERE classroom_id IS NOT NULL) as total_classrooms_utilized
    `;

    const res = await prisma.$queryRawUnsafe<any[]>(sql, orgId);
    const row = res[0] || {};
    const totalSections = row.total_sections_count || 0;
    const scheduledSections = row.total_sections_scheduled || 0;
    const coveragePercentage =
      totalSections > 0 ? Math.round((scheduledSections / totalSections) * 100) : 0;

    return {
      total_timetables: row.total_timetables || 0,
      published_timetables: row.published_timetables || 0,
      draft_timetables: row.draft_timetables || 0,
      review_timetables: row.review_timetables || 0,
      archived_timetables: row.archived_timetables || 0,
      total_scheduled_entries: row.total_scheduled_entries || 0,
      total_sections_scheduled: scheduledSections,
      total_sections_count: totalSections,
      coverage_percentage: coveragePercentage,
      total_teachers_scheduled: row.total_teachers_scheduled || 0,
      total_classrooms_utilized: row.total_classrooms_utilized || 0,
    };
  }

  /**
   * Find entries for a section with all joined entities
   */
  static async getSectionEntries(
    orgId: string,
    sectionId: string,
    versionId?: string,
  ): Promise<TimetableEntryDetailRecord[]> {
    const params: any[] = [sectionId, orgId];
    let versionCondition = '';

    if (versionId) {
      params.push(versionId);
      versionCondition = `AND tv.timetable_version_id = $${params.length}::uuid`;
    } else {
      versionCondition = `AND tv.status = 'published'::timetable_status`;
    }

    const sql = `
      SELECT
        te.timetable_entry_id,
        te.timetable_version_id,
        te.section_id,
        sec.section_name,
        g.grade_id,
        g.grade_name,
        g.grade_code,
        te.academic_year_grade_subject_id,
        sub.subject_id,
        sub.subject_code,
        sub.subject_name,
        te.faculty_assignment_id,
        st.staff_id,
        TRIM(CONCAT(u.first_name, ' ', u.last_name)) as teacher_name,
        ssfa.assignment_role::text as assignment_role,
        te.bell_schedule_period_id,
        bsp.period_number,
        bsp.period_name,
        bsp.period_type::text as period_type,
        bsp.start_time::text as start_time,
        bsp.end_time::text as end_time,
        ROUND(EXTRACT(EPOCH FROM (bsp.end_time - bsp.start_time)) / 60)::int as duration_minutes,
        te.weekday,
        te.classroom_id,
        c.room_code,
        c.room_name,
        c.capacity as room_capacity,
        te.lesson_type::text as lesson_type,
        te.lesson_topic,
        te.notes
      FROM timetable_entries te
      JOIN timetable_versions tv ON tv.timetable_version_id = te.timetable_version_id
      JOIN academic_years ay ON ay.academic_year_id = tv.academic_year_id
      JOIN sections sec ON sec.section_id = te.section_id
      JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = sec.academic_year_grade_id
      JOIN grades g ON g.grade_id = ayg.grade_id
      JOIN academic_year_grade_subjects aygs ON aygs.academic_year_grade_subject_id = te.academic_year_grade_subject_id
      JOIN subjects sub ON sub.subject_id = aygs.subject_id
      JOIN section_subject_faculty_assignments ssfa ON ssfa.faculty_assignment_id = te.faculty_assignment_id
      JOIN staff st ON st.staff_id = ssfa.staff_id
      JOIN users u ON u.user_id = st.user_id
      JOIN bell_schedule_periods bsp ON bsp.bell_schedule_period_id = te.bell_schedule_period_id
      LEFT JOIN classrooms c ON c.classroom_id = te.classroom_id
      WHERE te.section_id = $1::uuid AND ay.org_id = $2::uuid ${versionCondition}
      ORDER BY te.weekday ASC, bsp.start_time ASC, bsp.period_number ASC
    `;

    return prisma.$queryRawUnsafe<TimetableEntryDetailRecord[]>(sql, ...params);
  }

  /**
   * Find entries for all sections in an academic_year_grade
   */
  static async getClassEntries(
    orgId: string,
    academicYearGradeId: string,
    versionId?: string,
  ): Promise<TimetableEntryDetailRecord[]> {
    const params: any[] = [academicYearGradeId, orgId];
    let versionCondition = '';

    if (versionId) {
      params.push(versionId);
      versionCondition = `AND tv.timetable_version_id = $${params.length}::uuid`;
    } else {
      versionCondition = `AND tv.status = 'published'::timetable_status`;
    }

    const sql = `
      SELECT
        te.timetable_entry_id,
        te.timetable_version_id,
        te.section_id,
        sec.section_name,
        g.grade_id,
        g.grade_name,
        g.grade_code,
        te.academic_year_grade_subject_id,
        sub.subject_id,
        sub.subject_code,
        sub.subject_name,
        te.faculty_assignment_id,
        st.staff_id,
        TRIM(CONCAT(u.first_name, ' ', u.last_name)) as teacher_name,
        ssfa.assignment_role::text as assignment_role,
        te.bell_schedule_period_id,
        bsp.period_number,
        bsp.period_name,
        bsp.period_type::text as period_type,
        bsp.start_time::text as start_time,
        bsp.end_time::text as end_time,
        ROUND(EXTRACT(EPOCH FROM (bsp.end_time - bsp.start_time)) / 60)::int as duration_minutes,
        te.weekday,
        te.classroom_id,
        c.room_code,
        c.room_name,
        c.capacity as room_capacity,
        te.lesson_type::text as lesson_type,
        te.lesson_topic,
        te.notes
      FROM timetable_entries te
      JOIN timetable_versions tv ON tv.timetable_version_id = te.timetable_version_id
      JOIN academic_years ay ON ay.academic_year_id = tv.academic_year_id
      JOIN sections sec ON sec.section_id = te.section_id
      JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = sec.academic_year_grade_id
      JOIN grades g ON g.grade_id = ayg.grade_id
      JOIN academic_year_grade_subjects aygs ON aygs.academic_year_grade_subject_id = te.academic_year_grade_subject_id
      JOIN subjects sub ON sub.subject_id = aygs.subject_id
      JOIN section_subject_faculty_assignments ssfa ON ssfa.faculty_assignment_id = te.faculty_assignment_id
      JOIN staff st ON st.staff_id = ssfa.staff_id
      JOIN users u ON u.user_id = st.user_id
      JOIN bell_schedule_periods bsp ON bsp.bell_schedule_period_id = te.bell_schedule_period_id
      LEFT JOIN classrooms c ON c.classroom_id = te.classroom_id
      WHERE sec.academic_year_grade_id = $1::uuid AND ay.org_id = $2::uuid ${versionCondition}
      ORDER BY sec.section_name ASC, te.weekday ASC, bsp.start_time ASC
    `;

    return prisma.$queryRawUnsafe<TimetableEntryDetailRecord[]>(sql, ...params);
  }

  /**
   * Find scheduled periods for a teacher
   */
  static async getTeacherEntries(
    orgId: string,
    staffId: string,
    versionId?: string,
    academicYearId?: string,
  ): Promise<TimetableEntryDetailRecord[]> {
    const params: any[] = [staffId, orgId];
    const extraConditions: string[] = [];

    if (versionId) {
      params.push(versionId);
      extraConditions.push(`tv.timetable_version_id = $${params.length}::uuid`);
    } else {
      extraConditions.push(`tv.status = 'published'::timetable_status`);
    }

    if (academicYearId) {
      params.push(academicYearId);
      extraConditions.push(`ay.academic_year_id = $${params.length}::uuid`);
    }

    const whereExtra = extraConditions.length > 0 ? `AND ${extraConditions.join(' AND ')}` : '';

    const sql = `
      SELECT
        te.timetable_entry_id,
        te.timetable_version_id,
        te.section_id,
        sec.section_name,
        g.grade_id,
        g.grade_name,
        g.grade_code,
        te.academic_year_grade_subject_id,
        sub.subject_id,
        sub.subject_code,
        sub.subject_name,
        te.faculty_assignment_id,
        st.staff_id,
        TRIM(CONCAT(u.first_name, ' ', u.last_name)) as teacher_name,
        ssfa.assignment_role::text as assignment_role,
        te.bell_schedule_period_id,
        bsp.period_number,
        bsp.period_name,
        bsp.period_type::text as period_type,
        bsp.start_time::text as start_time,
        bsp.end_time::text as end_time,
        ROUND(EXTRACT(EPOCH FROM (bsp.end_time - bsp.start_time)) / 60)::int as duration_minutes,
        te.weekday,
        te.classroom_id,
        c.room_code,
        c.room_name,
        c.capacity as room_capacity,
        te.lesson_type::text as lesson_type,
        te.lesson_topic,
        te.notes
      FROM timetable_entries te
      JOIN timetable_versions tv ON tv.timetable_version_id = te.timetable_version_id
      JOIN academic_years ay ON ay.academic_year_id = tv.academic_year_id
      JOIN section_subject_faculty_assignments ssfa ON ssfa.faculty_assignment_id = te.faculty_assignment_id
      JOIN staff st ON st.staff_id = ssfa.staff_id
      JOIN users u ON u.user_id = st.user_id
      JOIN sections sec ON sec.section_id = te.section_id
      JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = sec.academic_year_grade_id
      JOIN grades g ON g.grade_id = ayg.grade_id
      JOIN academic_year_grade_subjects aygs ON aygs.academic_year_grade_subject_id = te.academic_year_grade_subject_id
      JOIN subjects sub ON sub.subject_id = aygs.subject_id
      JOIN bell_schedule_periods bsp ON bsp.bell_schedule_period_id = te.bell_schedule_period_id
      LEFT JOIN classrooms c ON c.classroom_id = te.classroom_id
      WHERE ssfa.staff_id = $1::uuid AND st.org_id = $2::uuid ${whereExtra}
      ORDER BY te.weekday ASC, bsp.start_time ASC, bsp.period_number ASC
    `;

    return prisma.$queryRawUnsafe<TimetableEntryDetailRecord[]>(sql, ...params);
  }

  /**
   * List classrooms for tenant
   */
  static async findClassrooms(
    orgId: string,
    params: ListClassroomsInput,
  ): Promise<ClassroomRecord[]> {
    const conditions: string[] = ['org_id = $1::uuid'];
    const queryParams: any[] = [orgId];

    if (params.room_type) {
      queryParams.push(params.room_type);
      conditions.push(`room_type = $${queryParams.length}`);
    }

    if (params.is_active !== undefined) {
      queryParams.push(params.is_active);
      conditions.push(`is_active = $${queryParams.length}::boolean`);
    }

    if (params.search && params.search.trim().length > 0) {
      queryParams.push(`%${params.search.trim()}%`);
      const idx = queryParams.length;
      conditions.push(
        `(room_code ILIKE $${idx} OR room_name ILIKE $${idx} OR building_name ILIKE $${idx})`,
      );
    }

    const whereClause = conditions.join(' AND ');

    const sql = `
      SELECT
        classroom_id,
        org_id,
        room_code,
        room_name,
        room_type,
        building_name,
        floor_name,
        capacity,
        description,
        is_active,
        created_at::text as created_at,
        updated_at::text as updated_at
      FROM classrooms
      WHERE ${whereClause}
      ORDER BY room_code ASC
    `;

    return prisma.$queryRawUnsafe<ClassroomRecord[]>(sql, ...queryParams);
  }

  /**
   * Find single classroom by ID scoped to tenant
   */
  static async findClassroomById(
    orgId: string,
    classroomId: string,
  ): Promise<ClassroomRecord | null> {
    const sql = `
      SELECT
        classroom_id,
        org_id,
        room_code,
        room_name,
        room_type,
        building_name,
        floor_name,
        capacity,
        description,
        is_active,
        created_at::text as created_at,
        updated_at::text as updated_at
      FROM classrooms
      WHERE classroom_id = $1::uuid AND org_id = $2::uuid
      LIMIT 1
    `;

    const res = await prisma.$queryRawUnsafe<ClassroomRecord[]>(sql, classroomId, orgId);
    return res[0] || null;
  }

  /**
   * Find utilization schedule for a classroom
   */
  static async getClassroomSchedule(
    orgId: string,
    classroomId: string,
    versionId?: string,
  ): Promise<TimetableEntryDetailRecord[]> {
    const params: any[] = [classroomId, orgId];
    let versionCondition = '';

    if (versionId) {
      params.push(versionId);
      versionCondition = `AND tv.timetable_version_id = $${params.length}::uuid`;
    } else {
      versionCondition = `AND tv.status = 'published'::timetable_status`;
    }

    const sql = `
      SELECT
        te.timetable_entry_id,
        te.timetable_version_id,
        te.section_id,
        sec.section_name,
        g.grade_id,
        g.grade_name,
        g.grade_code,
        te.academic_year_grade_subject_id,
        sub.subject_id,
        sub.subject_code,
        sub.subject_name,
        te.faculty_assignment_id,
        st.staff_id,
        TRIM(CONCAT(u.first_name, ' ', u.last_name)) as teacher_name,
        ssfa.assignment_role::text as assignment_role,
        te.bell_schedule_period_id,
        bsp.period_number,
        bsp.period_name,
        bsp.period_type::text as period_type,
        bsp.start_time::text as start_time,
        bsp.end_time::text as end_time,
        ROUND(EXTRACT(EPOCH FROM (bsp.end_time - bsp.start_time)) / 60)::int as duration_minutes,
        te.weekday,
        te.classroom_id,
        c.room_code,
        c.room_name,
        c.capacity as room_capacity,
        te.lesson_type::text as lesson_type,
        te.lesson_topic,
        te.notes
      FROM timetable_entries te
      JOIN timetable_versions tv ON tv.timetable_version_id = te.timetable_version_id
      JOIN classrooms c ON c.classroom_id = te.classroom_id
      JOIN sections sec ON sec.section_id = te.section_id
      JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = sec.academic_year_grade_id
      JOIN grades g ON g.grade_id = ayg.grade_id
      JOIN academic_year_grade_subjects aygs ON aygs.academic_year_grade_subject_id = te.academic_year_grade_subject_id
      JOIN subjects sub ON sub.subject_id = aygs.subject_id
      JOIN section_subject_faculty_assignments ssfa ON ssfa.faculty_assignment_id = te.faculty_assignment_id
      JOIN staff st ON st.staff_id = ssfa.staff_id
      JOIN users u ON u.user_id = st.user_id
      JOIN bell_schedule_periods bsp ON bsp.bell_schedule_period_id = te.bell_schedule_period_id
      WHERE te.classroom_id = $1::uuid AND c.org_id = $2::uuid ${versionCondition}
      ORDER BY te.weekday ASC, bsp.start_time ASC, bsp.period_number ASC
    `;

    return prisma.$queryRawUnsafe<TimetableEntryDetailRecord[]>(sql, ...params);
  }
}
