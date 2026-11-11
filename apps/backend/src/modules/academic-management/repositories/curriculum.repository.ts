import prisma from '../../../lib/prismaClient';
import { ListCurriculumInput, UpdateCurriculumPlanInput } from '../dto/request/curriculum.dto';

export interface CurriculumPlanRecord {
  curriculum_plan_id: string;
  org_id: string;
  academic_year_grade_subject_id: string;
  version_number: number;
  plan_title: string;
  plan_description: string | null;
  status: string;
  coordinator_staff_id: string | null;
  planned_start_date: string | null;
  planned_end_date: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  published_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  subject_id: string;
  subject_code: string;
  subject_name: string;
  grade_id: string;
  grade_code: string;
  grade_name: string;
  board: string | null;
  academic_year_id: string;
  academic_year_name: string;
  coordinator_name: string | null;
  unit_count: number;
}

export interface CurriculumUnitRecord {
  curriculum_unit_id: string;
  curriculum_plan_id: string;
  unit_code: string | null;
  unit_title: string;
  unit_description: string | null;
  sequence_number: number;
  planned_duration_periods: number | null;
  planned_start_date: string | null;
  planned_end_date: string | null;
  created_at: string;
  outcomes?: CurriculumOutcomeRecord[];
}

export interface CurriculumOutcomeRecord {
  learning_outcome_id: string;
  curriculum_unit_id: string;
  outcome_code: string | null;
  outcome_statement: string;
  bloom_level: string | null;
  assessment_criteria: string | null;
  sequence_number: number;
  created_at: string;
}

const ALLOWED_SORT_COLUMNS: Record<string, string> = {
  plan_title: 'cp.plan_title',
  created_at: 'cp.created_at',
  status: 'cp.status',
  version_number: 'cp.version_number',
};

export class CurriculumRepository {
  /**
   * Find paginated curriculum plans with filters strictly scoped to tenant org_id
   */
  static async findMany(
    orgId: string,
    params: ListCurriculumInput,
  ): Promise<{ items: CurriculumPlanRecord[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['cp.org_id = $1::uuid'];
    const queryParams: any[] = [orgId];

    if (params.academic_year_id) {
      queryParams.push(params.academic_year_id);
      conditions.push(`ay.academic_year_id = $${queryParams.length}::uuid`);
    }

    if (params.grade_id) {
      queryParams.push(params.grade_id);
      conditions.push(`g.grade_id = $${queryParams.length}::uuid`);
    }

    if (params.subject_id) {
      queryParams.push(params.subject_id);
      conditions.push(`s.subject_id = $${queryParams.length}::uuid`);
    }

    if (params.status) {
      queryParams.push(params.status);
      conditions.push(`cp.status = $${queryParams.length}::curriculum_plan_status`);
    }

    if (params.search && params.search.trim().length > 0) {
      queryParams.push(`%${params.search.trim()}%`);
      const idx = queryParams.length;
      conditions.push(
        `(cp.plan_title ILIKE $${idx} OR s.subject_name ILIKE $${idx} OR s.subject_code ILIKE $${idx} OR g.grade_name ILIKE $${idx})`,
      );
    }

    const whereClause = conditions.join(' AND ');
    const sortColumn = (params.sortBy && ALLOWED_SORT_COLUMNS[params.sortBy]) || 'cp.created_at';
    const sortOrder = params.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const countSql = `
      SELECT COUNT(*)::text as total
      FROM curriculum_plans cp
      JOIN academic_year_grade_subjects aygs ON aygs.academic_year_grade_subject_id = cp.academic_year_grade_subject_id
      JOIN subjects s ON s.subject_id = aygs.subject_id
      JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = aygs.academic_year_grade_id
      JOIN grades g ON g.grade_id = ayg.grade_id
      JOIN academic_years ay ON ay.academic_year_id = ayg.academic_year_id
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
        cp.curriculum_plan_id,
        cp.org_id,
        cp.academic_year_grade_subject_id,
        cp.version_number,
        cp.plan_title,
        cp.plan_description,
        cp.status::text as status,
        cp.coordinator_staff_id,
        cp.planned_start_date::text as planned_start_date,
        cp.planned_end_date::text as planned_end_date,
        cp.submitted_at::text as submitted_at,
        cp.approved_at::text as approved_at,
        cp.published_at::text as published_at,
        cp.archived_at::text as archived_at,
        cp.created_at::text as created_at,
        cp.updated_at::text as updated_at,
        s.subject_id,
        s.subject_code,
        s.subject_name,
        g.grade_id,
        g.grade_code,
        g.grade_name,
        g.board,
        ay.academic_year_id,
        ay.academic_year_name,
        TRIM(CONCAT(u.first_name, ' ', u.last_name)) as coordinator_name,
        (SELECT COUNT(*)::int FROM curriculum_plan_units cpu WHERE cpu.curriculum_plan_id = cp.curriculum_plan_id) as unit_count
      FROM curriculum_plans cp
      JOIN academic_year_grade_subjects aygs ON aygs.academic_year_grade_subject_id = cp.academic_year_grade_subject_id
      JOIN subjects s ON s.subject_id = aygs.subject_id
      JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = aygs.academic_year_grade_id
      JOIN grades g ON g.grade_id = ayg.grade_id
      JOIN academic_years ay ON ay.academic_year_id = ayg.academic_year_id
      LEFT JOIN staff st ON st.staff_id = cp.coordinator_staff_id
      LEFT JOIN users u ON u.user_id = st.user_id
      WHERE ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $${limitIdx}::integer OFFSET $${offsetIdx}::integer
    `;

    const items = await prisma.$queryRawUnsafe<CurriculumPlanRecord[]>(dataSql, ...queryParams);
    return { items, total };
  }

  /**
   * Find single curriculum plan by ID scoped to tenant org_id
   */
  static async findById(orgId: string, planId: string): Promise<CurriculumPlanRecord | null> {
    const sql = `
      SELECT
        cp.curriculum_plan_id,
        cp.org_id,
        cp.academic_year_grade_subject_id,
        cp.version_number,
        cp.plan_title,
        cp.plan_description,
        cp.status::text as status,
        cp.coordinator_staff_id,
        cp.planned_start_date::text as planned_start_date,
        cp.planned_end_date::text as planned_end_date,
        cp.submitted_at::text as submitted_at,
        cp.approved_at::text as approved_at,
        cp.published_at::text as published_at,
        cp.archived_at::text as archived_at,
        cp.created_at::text as created_at,
        cp.updated_at::text as updated_at,
        s.subject_id,
        s.subject_code,
        s.subject_name,
        g.grade_id,
        g.grade_code,
        g.grade_name,
        g.board,
        ay.academic_year_id,
        ay.academic_year_name,
        TRIM(CONCAT(u.first_name, ' ', u.last_name)) as coordinator_name,
        (SELECT COUNT(*)::int FROM curriculum_plan_units cpu WHERE cpu.curriculum_plan_id = cp.curriculum_plan_id) as unit_count
      FROM curriculum_plans cp
      JOIN academic_year_grade_subjects aygs ON aygs.academic_year_grade_subject_id = cp.academic_year_grade_subject_id
      JOIN subjects s ON s.subject_id = aygs.subject_id
      JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = aygs.academic_year_grade_id
      JOIN grades g ON g.grade_id = ayg.grade_id
      JOIN academic_years ay ON ay.academic_year_id = ayg.academic_year_id
      LEFT JOIN staff st ON st.staff_id = cp.coordinator_staff_id
      LEFT JOIN users u ON u.user_id = st.user_id
      WHERE cp.curriculum_plan_id = $1::uuid AND cp.org_id = $2::uuid
      LIMIT 1
    `;

    const res = await prisma.$queryRawUnsafe<CurriculumPlanRecord[]>(sql, planId, orgId);
    return res[0] || null;
  }

  /**
   * Find curriculum plan with full hierarchical syllabus structure (units and learning outcomes)
   */
  static async findWithStructure(
    orgId: string,
    planId: string,
  ): Promise<(CurriculumPlanRecord & { units: CurriculumUnitRecord[] }) | null> {
    const plan = await this.findById(orgId, planId);
    if (!plan) return null;

    const unitsSql = `
      SELECT
        curriculum_unit_id,
        curriculum_plan_id,
        unit_code,
        unit_title,
        unit_description,
        sequence_number,
        planned_duration_periods,
        planned_start_date::text as planned_start_date,
        planned_end_date::text as planned_end_date,
        created_at::text as created_at
      FROM curriculum_plan_units
      WHERE curriculum_plan_id = $1::uuid
      ORDER BY sequence_number ASC
    `;

    const units = await prisma.$queryRawUnsafe<CurriculumUnitRecord[]>(unitsSql, planId);

    if (units.length > 0) {
      const outcomesSql = `
        SELECT
          learning_outcome_id,
          curriculum_unit_id,
          outcome_code,
          outcome_statement,
          bloom_level::text as bloom_level,
          assessment_criteria,
          sequence_number,
          created_at::text as created_at
        FROM curriculum_learning_outcomes
        WHERE curriculum_unit_id = ANY($1::uuid[])
        ORDER BY sequence_number ASC
      `;
      const unitIds = units.map((u) => u.curriculum_unit_id);
      const outcomes = await prisma.$queryRawUnsafe<CurriculumOutcomeRecord[]>(
        outcomesSql,
        unitIds,
      );

      const outcomesByUnit = new Map<string, CurriculumOutcomeRecord[]>();
      for (const o of outcomes) {
        if (!outcomesByUnit.has(o.curriculum_unit_id)) {
          outcomesByUnit.set(o.curriculum_unit_id, []);
        }
        outcomesByUnit.get(o.curriculum_unit_id)!.push(o);
      }

      for (const u of units) {
        u.outcomes = outcomesByUnit.get(u.curriculum_unit_id) || [];
      }
    }

    return { ...plan, units };
  }

  /**
   * Transition curriculum plan status respecting database trigger lifecycle rules
   */
  static async updateStatus(
    orgId: string,
    planId: string,
    newStatus: string,
    actorId: string | null,
  ): Promise<CurriculumPlanRecord> {
    const current = await this.findById(orgId, planId);
    if (!current) {
      throw new Error(`Curriculum plan with ID '${planId}' was not found`);
    }

    const setClauses: string[] = ['status = $1::curriculum_plan_status', 'updated_at = NOW()'];
    const params: any[] = [newStatus];

    if (actorId) {
      params.push(actorId);
      setClauses.push(`updated_by = $${params.length}::uuid`);
    }

    if (newStatus === 'review' && current.status === 'draft') {
      setClauses.push('submitted_at = NOW()');
    } else if (newStatus === 'approved') {
      setClauses.push('approved_at = NOW()');
      if (actorId) {
        params.push(actorId);
        setClauses.push(`approved_by = $${params.length}::uuid`);
      }
    } else if (newStatus === 'published') {
      setClauses.push('published_at = NOW()');
      if (actorId) {
        params.push(actorId);
        setClauses.push(`published_by = $${params.length}::uuid`);
      }
    } else if (newStatus === 'archived') {
      setClauses.push('archived_at = NOW()');
    }

    params.push(planId);
    const planIdIdx = params.length;
    params.push(orgId);
    const orgIdIdx = params.length;

    const sql = `
      UPDATE curriculum_plans
      SET ${setClauses.join(', ')}
      WHERE curriculum_plan_id = $${planIdIdx}::uuid AND org_id = $${orgIdIdx}::uuid
      RETURNING curriculum_plan_id
    `;

    await prisma.$executeRawUnsafe(sql, ...params);

    const updated = await this.findById(orgId, planId);
    if (!updated) {
      throw new Error(`Failed to retrieve updated curriculum plan '${planId}'`);
    }
    return updated;
  }

  /**
   * Update plan metadata (only allowed for draft status per trigger)
   */
  static async updatePlan(
    orgId: string,
    planId: string,
    data: UpdateCurriculumPlanInput,
    actorId: string | null,
  ): Promise<CurriculumPlanRecord> {
    const current = await this.findById(orgId, planId);
    if (!current) {
      throw new Error(`Curriculum plan with ID '${planId}' was not found`);
    }

    const setClauses: string[] = ['updated_at = NOW()'];
    const params: any[] = [];

    if (data.plan_title !== undefined) {
      params.push(data.plan_title);
      setClauses.push(`plan_title = $${params.length}`);
    }

    if (data.plan_description !== undefined) {
      params.push(data.plan_description);
      setClauses.push(`plan_description = $${params.length}`);
    }

    if (data.planned_start_date !== undefined) {
      params.push(data.planned_start_date);
      setClauses.push(`planned_start_date = $${params.length}::date`);
    }

    if (data.planned_end_date !== undefined) {
      params.push(data.planned_end_date);
      setClauses.push(`planned_end_date = $${params.length}::date`);
    }

    if (data.coordinator_staff_id !== undefined) {
      params.push(data.coordinator_staff_id);
      setClauses.push(`coordinator_staff_id = $${params.length}::uuid`);
    }

    if (actorId) {
      params.push(actorId);
      setClauses.push(`updated_by = $${params.length}::uuid`);
    }

    params.push(planId);
    const planIdIdx = params.length;
    params.push(orgId);
    const orgIdIdx = params.length;

    const sql = `
      UPDATE curriculum_plans
      SET ${setClauses.join(', ')}
      WHERE curriculum_plan_id = $${planIdIdx}::uuid AND org_id = $${orgIdIdx}::uuid
      RETURNING curriculum_plan_id
    `;

    await prisma.$executeRawUnsafe(sql, ...params);

    const updated = await this.findById(orgId, planId);
    if (!updated) {
      throw new Error(`Failed to retrieve updated curriculum plan '${planId}'`);
    }
    return updated;
  }

  /**
   * Aggregation metrics for the academic overview dashboard
   */
  static async getOverviewMetrics(orgId: string): Promise<{
    total_plans: number;
    published_plans: number;
    in_review_plans: number;
    draft_plans: number;
    archived_plans: number;
    total_units: number;
    total_learning_outcomes: number;
  }> {
    const sql = `
      SELECT
        COUNT(*)::int as total_plans,
        COUNT(CASE WHEN cp.status = 'published' THEN 1 END)::int as published_plans,
        COUNT(CASE WHEN cp.status = 'review' THEN 1 END)::int as in_review_plans,
        COUNT(CASE WHEN cp.status = 'draft' THEN 1 END)::int as draft_plans,
        COUNT(CASE WHEN cp.status = 'archived' THEN 1 END)::int as archived_plans,
        COALESCE((SELECT COUNT(*)::int FROM curriculum_plan_units cpu JOIN curriculum_plans p ON p.curriculum_plan_id = cpu.curriculum_plan_id WHERE p.org_id = $1::uuid), 0) as total_units,
        COALESCE((SELECT COUNT(*)::int FROM curriculum_learning_outcomes clo JOIN curriculum_plan_units cpu ON cpu.curriculum_unit_id = clo.curriculum_unit_id JOIN curriculum_plans p ON p.curriculum_plan_id = cpu.curriculum_plan_id WHERE p.org_id = $1::uuid), 0) as total_learning_outcomes
      FROM curriculum_plans cp
      WHERE cp.org_id = $1::uuid
    `;

    const res = await prisma.$queryRawUnsafe<any[]>(sql, orgId);
    const row = res[0] || {};
    return {
      total_plans: row.total_plans || 0,
      published_plans: row.published_plans || 0,
      in_review_plans: row.in_review_plans || 0,
      draft_plans: row.draft_plans || 0,
      archived_plans: row.archived_plans || 0,
      total_units: row.total_units || 0,
      total_learning_outcomes: row.total_learning_outcomes || 0,
    };
  }
}
