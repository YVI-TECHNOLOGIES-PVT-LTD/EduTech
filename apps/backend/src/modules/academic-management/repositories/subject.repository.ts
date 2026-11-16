import prisma from '../../../lib/prismaClient';
import { ListSubjectsInput } from '../dto/request/subject.dto';

export interface SubjectRecord {
  subject_id: string;
  org_id: string;
  subject_category_id: string | null;
  subject_code: string;
  subject_name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category_code: string | null;
  category_name: string | null;
}

export interface SubjectCategoryRecord {
  subject_category_id: string;
  org_id: string;
  category_code: string;
  category_name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GradeSubjectOfferingRecord {
  academic_year_grade_subject_id: string;
  academic_year_grade_id: string;
  subject_id: string;
  subject_requirement: string;
  weekly_periods: number | null;
  theory_periods: number | null;
  practical_periods: number | null;
  display_order: number;
  is_active: boolean;
  subject_code: string;
  subject_name: string;
  category_name: string | null;
  grade_id: string;
  grade_name: string;
  academic_year_id: string;
  academic_year_name: string;
}

const ALLOWED_SORT_COLUMNS: Record<string, string> = {
  subject_name: 's.subject_name',
  subject_code: 's.subject_code',
  created_at: 's.created_at',
};

export class SubjectRepository {
  /**
   * Find paginated subjects scoped to tenant org_id
   */
  static async findMany(
    orgId: string,
    params: ListSubjectsInput,
  ): Promise<{ items: SubjectRecord[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['s.org_id = $1::uuid'];
    const queryParams: any[] = [orgId];

    if (params.category_id) {
      queryParams.push(params.category_id);
      conditions.push(`s.subject_category_id = $${queryParams.length}::uuid`);
    }

    if (params.is_active !== undefined) {
      queryParams.push(params.is_active);
      conditions.push(`s.is_active = $${queryParams.length}::boolean`);
    }

    if (params.search && params.search.trim().length > 0) {
      queryParams.push(`%${params.search.trim()}%`);
      const idx = queryParams.length;
      conditions.push(`(s.subject_name ILIKE $${idx} OR s.subject_code ILIKE $${idx})`);
    }

    const whereClause = conditions.join(' AND ');
    const sortColumn = (params.sortBy && ALLOWED_SORT_COLUMNS[params.sortBy]) || 's.subject_name';
    const sortOrder = params.sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const countSql = `
      SELECT COUNT(*)::text as total
      FROM subjects s
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
        s.subject_id,
        s.org_id,
        s.subject_category_id,
        s.subject_code,
        s.subject_name,
        s.description,
        s.is_active,
        s.created_at::text as created_at,
        s.updated_at::text as updated_at,
        sc.category_code,
        sc.category_name
      FROM subjects s
      LEFT JOIN subject_categories sc ON sc.subject_category_id = s.subject_category_id
      WHERE ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $${limitIdx}::integer OFFSET $${offsetIdx}::integer
    `;

    const items = await prisma.$queryRawUnsafe<SubjectRecord[]>(dataSql, ...queryParams);
    return { items, total };
  }

  /**
   * Find single subject by ID scoped to tenant org_id
   */
  static async findById(orgId: string, subjectId: string): Promise<SubjectRecord | null> {
    const sql = `
      SELECT
        s.subject_id,
        s.org_id,
        s.subject_category_id,
        s.subject_code,
        s.subject_name,
        s.description,
        s.is_active,
        s.created_at::text as created_at,
        s.updated_at::text as updated_at,
        sc.category_code,
        sc.category_name
      FROM subjects s
      LEFT JOIN subject_categories sc ON sc.subject_category_id = s.subject_category_id
      WHERE s.subject_id = $1::uuid AND s.org_id = $2::uuid
      LIMIT 1
    `;

    const res = await prisma.$queryRawUnsafe<SubjectRecord[]>(sql, subjectId, orgId);
    return res[0] || null;
  }

  /**
   * List all subject categories for the tenant
   */
  static async findCategories(orgId: string): Promise<SubjectCategoryRecord[]> {
    const sql = `
      SELECT
        subject_category_id,
        org_id,
        category_code,
        category_name,
        description,
        display_order,
        is_active,
        created_at::text as created_at,
        updated_at::text as updated_at
      FROM subject_categories
      WHERE org_id = $1::uuid
      ORDER BY display_order ASC, category_name ASC
    `;

    return prisma.$queryRawUnsafe<SubjectCategoryRecord[]>(sql, orgId);
  }

  /**
   * Find grade subject offerings for an academic_year_grade_id
   */
  static async findGradeSubjects(
    orgId: string,
    academicYearGradeId: string,
  ): Promise<GradeSubjectOfferingRecord[]> {
    const sql = `
      SELECT
        aygs.academic_year_grade_subject_id,
        aygs.academic_year_grade_id,
        aygs.subject_id,
        aygs.subject_requirement::text as subject_requirement,
        aygs.weekly_periods,
        aygs.theory_periods,
        aygs.practical_periods,
        aygs.display_order,
        aygs.is_active,
        s.subject_code,
        s.subject_name,
        sc.category_name,
        g.grade_id,
        g.grade_name,
        ay.academic_year_id,
        ay.academic_year_name
      FROM academic_year_grade_subjects aygs
      JOIN subjects s ON s.subject_id = aygs.subject_id
      LEFT JOIN subject_categories sc ON sc.subject_category_id = s.subject_category_id
      JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = aygs.academic_year_grade_id
      JOIN grades g ON g.grade_id = ayg.grade_id
      JOIN academic_years ay ON ay.academic_year_id = ayg.academic_year_id
      WHERE aygs.academic_year_grade_id = $1::uuid AND ay.org_id = $2::uuid
      ORDER BY aygs.display_order ASC, s.subject_name ASC
    `;

    return prisma.$queryRawUnsafe<GradeSubjectOfferingRecord[]>(sql, academicYearGradeId, orgId);
  }

  /**
   * Find learning resources mapped to a subject
   */
  static async findResourcesForSubject(orgId: string, subjectId: string): Promise<any[]> {
    const sql = `
      SELECT
        lr.resource_id,
        lr.title,
        lr.description,
        lr.resource_type::text as resource_type,
        lr.external_url,
        lr.file_name,
        lr.file_size_bytes::text as file_size_bytes,
        lr.mime_type,
        lr.resource_status::text as status,
        lr.created_at::text as created_at
      FROM learning_resource_subjects lrs
      JOIN learning_resources lr ON lr.resource_id = lrs.resource_id
      WHERE lrs.subject_id = $1::uuid AND lrs.org_id = $2::uuid AND lr.org_id = $2::uuid
      ORDER BY lr.created_at DESC
    `;

    return prisma.$queryRawUnsafe<any[]>(sql, subjectId, orgId);
  }

  /**
   * Subject metrics for overview
   */
  static async getMetrics(
    orgId: string,
  ): Promise<{ total_subjects: number; active_subjects: number; total_categories: number }> {
    const sql = `
      SELECT
        COUNT(*)::int as total_subjects,
        COUNT(CASE WHEN is_active = true THEN 1 END)::int as active_subjects,
        (SELECT COUNT(*)::int FROM subject_categories WHERE org_id = $1::uuid) as total_categories
      FROM subjects
      WHERE org_id = $1::uuid
    `;

    const res = await prisma.$queryRawUnsafe<any[]>(sql, orgId);
    const row = res[0] || {};
    return {
      total_subjects: row.total_subjects || 0,
      active_subjects: row.active_subjects || 0,
      total_categories: row.total_categories || 0,
    };
  }
}
