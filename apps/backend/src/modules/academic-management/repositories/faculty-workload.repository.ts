import prisma from '../../../lib/prismaClient';
import { ListFacultyWorkloadRawInput } from '../dto/request/timetable.dto';

export interface FacultyWorkloadRecord {
  staff_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string | null;
  employee_id: string | null;
  designation_name: string | null;
  department_name: string | null;
  weekly_periods: number;
  distinct_sections_count: number;
  distinct_subjects_count: number;
  primary_assignments_count: number;
  co_teacher_assignments_count: number;
  max_daily_periods: number;
  daily_breakdown: Record<string, number>;
  assigned_subjects: Array<{ subject_id: string; subject_name: string; subject_code: string }>;
  workload_status: 'LIGHT' | 'BALANCED' | 'HEAVY';
}

export class FacultyWorkloadRepository {
  /**
   * Find paginated faculty workload summary for tenant
   */
  static async getWorkloadList(
    orgId: string,
    params: ListFacultyWorkloadRawInput = {},
  ): Promise<{ items: FacultyWorkloadRecord[]; total: number }> {
    const page = params.page !== undefined ? Number(params.page) : 1;
    const limit = params.limit !== undefined ? Number(params.limit) : 50;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['st.org_id = $1::uuid', 'st.is_active = true'];
    const queryParams: any[] = [orgId];

    if (params.department_id) {
      queryParams.push(params.department_id);
      conditions.push(`st.department_id = $${queryParams.length}::uuid`);
    }

    if (params.search && params.search.trim().length > 0) {
      queryParams.push(`%${params.search.trim()}%`);
      const idx = queryParams.length;
      conditions.push(
        `(u.first_name ILIKE $${idx} OR u.last_name ILIKE $${idx} OR st.employee_code ILIKE $${idx})`,
      );
    }

    const whereClause = conditions.join(' AND ');

    let yearFilter = '';
    if (params.academic_year_id) {
      queryParams.push(params.academic_year_id);
      yearFilter = `AND ay.academic_year_id = $${queryParams.length}::uuid`;
    }

    const countSql = `
      SELECT COUNT(*)::text as total
      FROM staff st
      JOIN users u ON u.user_id = st.user_id
      WHERE ${whereClause}
    `;

    const countRes = await prisma.$queryRawUnsafe<Array<{ total: string }>>(
      countSql,
      ...queryParams.slice(
        0,
        params.academic_year_id ? queryParams.length - 1 : queryParams.length,
      ),
    );
    const total = parseInt(countRes[0]?.total || '0', 10);

    const sortOrder = params.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const sortField = params.sortBy === 'name' ? 'full_name' : 'weekly_periods';

    queryParams.push(limit);
    const limitIdx = queryParams.length;
    queryParams.push(offset);
    const offsetIdx = queryParams.length;

    const dataSql = `
      WITH active_timetable AS (
        SELECT tv.timetable_version_id
        FROM timetable_versions tv
        JOIN academic_years ay ON ay.academic_year_id = tv.academic_year_id
        WHERE ay.org_id = $1::uuid AND tv.status = 'published'::timetable_status ${yearFilter}
        ORDER BY ay.start_date DESC
        LIMIT 1
      ),
      faculty_entries AS (
        SELECT
          ssfa.staff_id,
          te.timetable_entry_id,
          te.weekday,
          te.section_id,
          aygs.subject_id,
          sub.subject_code,
          sub.subject_name,
          ssfa.assignment_role
        FROM timetable_entries te
        JOIN active_timetable at ON at.timetable_version_id = te.timetable_version_id
        JOIN section_subject_faculty_assignments ssfa ON ssfa.faculty_assignment_id = te.faculty_assignment_id
        JOIN academic_year_grade_subjects aygs ON aygs.academic_year_grade_subject_id = te.academic_year_grade_subject_id
        JOIN subjects sub ON sub.subject_id = aygs.subject_id
      )
      SELECT
        st.staff_id,
        st.user_id,
        u.first_name,
        u.last_name,
        TRIM(CONCAT(u.first_name, ' ', u.last_name)) as full_name,
        u.email,
        st.employee_code as employee_id,
        des.designation_name,
        dept.department_name,
        COALESCE((SELECT COUNT(*)::int FROM faculty_entries fe WHERE fe.staff_id = st.staff_id), 0) as weekly_periods,
        COALESCE((SELECT COUNT(DISTINCT fe.section_id)::int FROM faculty_entries fe WHERE fe.staff_id = st.staff_id), 0) as distinct_sections_count,
        COALESCE((SELECT COUNT(DISTINCT fe.subject_id)::int FROM faculty_entries fe WHERE fe.staff_id = st.staff_id), 0) as distinct_subjects_count,
        COALESCE((SELECT COUNT(*)::int FROM section_subject_faculty_assignments ssfa WHERE ssfa.staff_id = st.staff_id AND ssfa.assignment_role = 'primary' AND ssfa.is_active = true), 0) as primary_assignments_count,
        COALESCE((SELECT COUNT(*)::int FROM section_subject_faculty_assignments ssfa WHERE ssfa.staff_id = st.staff_id AND ssfa.assignment_role = 'co_teacher' AND ssfa.is_active = true), 0) as co_teacher_assignments_count,
        COALESCE(
          (
            SELECT MAX(cnt)::int
            FROM (
              SELECT COUNT(*)::int as cnt
              FROM faculty_entries fe
              WHERE fe.staff_id = st.staff_id
              GROUP BY fe.weekday
            ) sub_q
          ),
          0
        ) as max_daily_periods,
        (
          SELECT json_object_agg(sub_agg.wd, sub_agg.cnt)
          FROM (
            SELECT fe.weekday::text as wd, COUNT(*)::int as cnt
            FROM faculty_entries fe
            WHERE fe.staff_id = st.staff_id
            GROUP BY fe.weekday
          ) sub_agg
        ) as daily_breakdown_json,
        (
          SELECT json_agg(json_build_object('subject_id', s_agg.subject_id, 'subject_name', s_agg.subject_name, 'subject_code', s_agg.subject_code))
          FROM (
            SELECT DISTINCT fe.subject_id, fe.subject_name, fe.subject_code
            FROM faculty_entries fe
            WHERE fe.staff_id = st.staff_id
          ) s_agg
        ) as assigned_subjects_json
      FROM staff st
      JOIN users u ON u.user_id = st.user_id
      LEFT JOIN designations des ON des.designation_id = st.designation_id
      LEFT JOIN departments dept ON dept.department_id = st.department_id
      WHERE ${whereClause}
      ORDER BY ${sortField} ${sortOrder}
      LIMIT $${limitIdx}::integer OFFSET $${offsetIdx}::integer
    `;

    const rows = await prisma.$queryRawUnsafe<any[]>(dataSql, ...queryParams);

    const items: FacultyWorkloadRecord[] = rows.map((r) => {
      const weekly = r.weekly_periods || 0;
      let status: 'LIGHT' | 'BALANCED' | 'HEAVY' = 'BALANCED';
      if (weekly < 15) {
        status = 'LIGHT';
      } else if (weekly > 25) {
        status = 'HEAVY';
      }

      return {
        staff_id: r.staff_id,
        user_id: r.user_id,
        first_name: r.first_name,
        last_name: r.last_name,
        full_name: r.full_name,
        email: r.email,
        employee_id: r.employee_id,
        designation_name: r.designation_name,
        department_name: r.department_name,
        weekly_periods: weekly,
        distinct_sections_count: r.distinct_sections_count || 0,
        distinct_subjects_count: r.distinct_subjects_count || 0,
        primary_assignments_count: r.primary_assignments_count || 0,
        co_teacher_assignments_count: r.co_teacher_assignments_count || 0,
        max_daily_periods: r.max_daily_periods || 0,
        daily_breakdown: r.daily_breakdown_json || {},
        assigned_subjects: r.assigned_subjects_json || [],
        workload_status: status,
      };
    });

    return { items, total };
  }

  /**
   * Find workload detail for single faculty member
   */
  static async getFacultyDetail(
    orgId: string,
    staffId: string,
    academicYearId?: string,
  ): Promise<FacultyWorkloadRecord | null> {
    // Directly query for this specific staff
    const queryParams: any[] = [orgId, staffId];
    let yearFilter = '';
    if (academicYearId) {
      queryParams.push(academicYearId);
      yearFilter = `AND ay.academic_year_id = $${queryParams.length}::uuid`;
    }

    const dataSql = `
      WITH active_timetable AS (
        SELECT tv.timetable_version_id
        FROM timetable_versions tv
        JOIN academic_years ay ON ay.academic_year_id = tv.academic_year_id
        WHERE ay.org_id = $1::uuid AND tv.status = 'published'::timetable_status ${yearFilter}
        ORDER BY ay.start_date DESC
        LIMIT 1
      ),
      faculty_entries AS (
        SELECT
          ssfa.staff_id,
          te.timetable_entry_id,
          te.weekday,
          te.section_id,
          aygs.subject_id,
          sub.subject_code,
          sub.subject_name,
          ssfa.assignment_role
        FROM timetable_entries te
        JOIN active_timetable at ON at.timetable_version_id = te.timetable_version_id
        JOIN section_subject_faculty_assignments ssfa ON ssfa.faculty_assignment_id = te.faculty_assignment_id
        JOIN academic_year_grade_subjects aygs ON aygs.academic_year_grade_subject_id = te.academic_year_grade_subject_id
        JOIN subjects sub ON sub.subject_id = aygs.subject_id
      )
      SELECT
        st.staff_id,
        st.user_id,
        u.first_name,
        u.last_name,
        TRIM(CONCAT(u.first_name, ' ', u.last_name)) as full_name,
        u.email,
        st.employee_code as employee_id,
        des.designation_name,
        dept.department_name,
        COALESCE((SELECT COUNT(*)::int FROM faculty_entries fe WHERE fe.staff_id = st.staff_id), 0) as weekly_periods,
        COALESCE((SELECT COUNT(DISTINCT fe.section_id)::int FROM faculty_entries fe WHERE fe.staff_id = st.staff_id), 0) as distinct_sections_count,
        COALESCE((SELECT COUNT(DISTINCT fe.subject_id)::int FROM faculty_entries fe WHERE fe.staff_id = st.staff_id), 0) as distinct_subjects_count,
        COALESCE((SELECT COUNT(*)::int FROM section_subject_faculty_assignments ssfa WHERE ssfa.staff_id = st.staff_id AND ssfa.assignment_role = 'primary' AND ssfa.is_active = true), 0) as primary_assignments_count,
        COALESCE((SELECT COUNT(*)::int FROM section_subject_faculty_assignments ssfa WHERE ssfa.staff_id = st.staff_id AND ssfa.assignment_role = 'co_teacher' AND ssfa.is_active = true), 0) as co_teacher_assignments_count,
        COALESCE(
          (
            SELECT MAX(cnt)::int
            FROM (
              SELECT COUNT(*)::int as cnt
              FROM faculty_entries fe
              WHERE fe.staff_id = st.staff_id
              GROUP BY fe.weekday
            ) sub_q
          ),
          0
        ) as max_daily_periods,
        (
          SELECT json_object_agg(sub_agg.wd, sub_agg.cnt)
          FROM (
            SELECT fe.weekday::text as wd, COUNT(*)::int as cnt
            FROM faculty_entries fe
            WHERE fe.staff_id = st.staff_id
            GROUP BY fe.weekday
          ) sub_agg
        ) as daily_breakdown_json,
        (
          SELECT json_agg(json_build_object('subject_id', s_agg.subject_id, 'subject_name', s_agg.subject_name, 'subject_code', s_agg.subject_code))
          FROM (
            SELECT DISTINCT fe.subject_id, fe.subject_name, fe.subject_code
            FROM faculty_entries fe
            WHERE fe.staff_id = st.staff_id
          ) s_agg
        ) as assigned_subjects_json
      FROM staff st
      JOIN users u ON u.user_id = st.user_id
      LEFT JOIN designations des ON des.designation_id = st.designation_id
      LEFT JOIN departments dept ON dept.department_id = st.department_id
      WHERE st.org_id = $1::uuid AND st.staff_id = $2::uuid
      LIMIT 1
    `;

    const res = await prisma.$queryRawUnsafe<any[]>(dataSql, ...queryParams);
    if (!res || res.length === 0) return null;

    const r = res[0];
    const weekly = r.weekly_periods || 0;
    let status: 'LIGHT' | 'BALANCED' | 'HEAVY' = 'BALANCED';
    if (weekly < 15) {
      status = 'LIGHT';
    } else if (weekly > 25) {
      status = 'HEAVY';
    }

    return {
      staff_id: r.staff_id,
      user_id: r.user_id,
      first_name: r.first_name,
      last_name: r.last_name,
      full_name: r.full_name,
      email: r.email,
      employee_id: r.employee_id,
      designation_name: r.designation_name,
      department_name: r.department_name,
      weekly_periods: weekly,
      distinct_sections_count: r.distinct_sections_count || 0,
      distinct_subjects_count: r.distinct_subjects_count || 0,
      primary_assignments_count: r.primary_assignments_count || 0,
      co_teacher_assignments_count: r.co_teacher_assignments_count || 0,
      max_daily_periods: r.max_daily_periods || 0,
      daily_breakdown: r.daily_breakdown_json || {},
      assigned_subjects: r.assigned_subjects_json || [],
      workload_status: status,
    };
  }
}
