import prisma from '../../../lib/prismaClient';
import { ListLessonPlansRawInput } from '../dto/request/lesson-planning.dto';

export interface ResolvedContext {
  orgId: string;
  schoolName: string;
  academicYearId: string;
  academicYearName: string;
  gradeId: string;
  gradeName: string;
  sectionId?: string;
  sectionName?: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  curriculumPlanId: string;
  curriculumPlanTitle: string;
  curriculumPlanDescription: string | null;
  curriculumUnitId: string;
  unitTitle: string;
  unitCode: string | null;
  unitDescription: string | null;
  officialOutcomes: Array<{
    learning_outcome_id: string;
    outcome_code: string | null;
    outcome_statement: string;
    bloom_level: any;
  }>;
  availableResources: Array<{
    resource_id: string;
    title: string;
    resource_type: string;
    description: string | null;
  }>;
}

export interface SavedLessonSummaryRecord {
  lesson_plan_id: string;
  curriculum_unit_id: string;
  unit_title: string;
  curriculum_plan_id: string;
  plan_title: string;
  grade_name: string;
  subject_name: string;
  subject_code: string;
  teacher_staff_id: string;
  teacher_name: string;
  lesson_title: string;
  lesson_summary: string | null;
  sequence_number: number;
  planned_date: string | null;
  duration_minutes: number | null;
  teaching_approach: string | null;
  is_active: boolean;
  activities_count: number;
  outcomes_count: number;
  created_at: string;
  updated_at: string;
}

export class LessonPlanningRepository {
  /**
   * Resolve full academic context and verify tenant ownership across hierarchy
   */
  static async resolveContext(
    orgId: string,
    inputs: {
      academicYearId: string;
      gradeId: string;
      sectionId?: string;
      subjectId: string;
      curriculumPlanId?: string;
      curriculumUnitId: string;
    },
  ): Promise<ResolvedContext | null> {
    // 1. Verify organization & academic year
    const orgRes = await prisma.$queryRawUnsafe<any[]>(
      `SELECT org_name FROM organizations WHERE org_id = $1::uuid LIMIT 1`,
      orgId,
    );
    if (!orgRes || orgRes.length === 0) return null;
    const schoolName = orgRes[0].org_name;

    const yearRes = await prisma.$queryRawUnsafe<any[]>(
      `SELECT academic_year_id, academic_year_name FROM academic_years WHERE academic_year_id = $1::uuid AND org_id = $2::uuid LIMIT 1`,
      inputs.academicYearId,
      orgId,
    );
    if (!yearRes || yearRes.length === 0) return null;
    const academicYearName = yearRes[0].academic_year_name;

    // 2. Verify grade and subject offering in this academic year
    const aygRes = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT ayg.academic_year_grade_id, g.grade_id, g.grade_name
      FROM academic_year_grades ayg
      JOIN grades g ON g.grade_id = ayg.grade_id
      WHERE ayg.academic_year_id = $1::uuid AND ayg.grade_id = $2::uuid AND g.org_id = $3::uuid
      LIMIT 1
      `,
      inputs.academicYearId,
      inputs.gradeId,
      orgId,
    );
    if (!aygRes || aygRes.length === 0) return null;
    const academicYearGradeId = aygRes[0].academic_year_grade_id;
    const gradeName = aygRes[0].grade_name;

    // Optional section check
    let sectionName: string | undefined;
    if (inputs.sectionId) {
      const secRes = await prisma.$queryRawUnsafe<any[]>(
        `SELECT section_name FROM sections WHERE section_id = $1::uuid AND academic_year_grade_id = $2::uuid LIMIT 1`,
        inputs.sectionId,
        academicYearGradeId,
      );
      if (secRes && secRes.length > 0) {
        sectionName = secRes[0].section_name;
      }
    }

    // Subject check
    const subRes = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT aygs.academic_year_grade_subject_id, sub.subject_id, sub.subject_name, sub.subject_code
      FROM academic_year_grade_subjects aygs
      JOIN subjects sub ON sub.subject_id = aygs.subject_id
      WHERE aygs.academic_year_grade_id = $1::uuid AND sub.subject_id = $2::uuid AND sub.org_id = $3::uuid
      LIMIT 1
      `,
      academicYearGradeId,
      inputs.subjectId,
      orgId,
    );
    if (!subRes || subRes.length === 0) return null;
    const subjectName = subRes[0].subject_name;
    const subjectCode = subRes[0].subject_code;

    // 3. Resolve curriculum plan and unit
    const unitRes = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT
        cpu.curriculum_unit_id,
        cpu.unit_title,
        cpu.unit_code,
        cpu.unit_description,
        cp.curriculum_plan_id,
        cp.plan_title,
        cp.plan_description
      FROM curriculum_plan_units cpu
      JOIN curriculum_plans cp ON cp.curriculum_plan_id = cpu.curriculum_plan_id
      WHERE cpu.curriculum_unit_id = $1::uuid AND cp.org_id = $2::uuid
      LIMIT 1
      `,
      inputs.curriculumUnitId,
      orgId,
    );
    if (!unitRes || unitRes.length === 0) return null;
    const unit = unitRes[0];

    // 4. Resolve official learning outcomes for unit
    const outcomes = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT learning_outcome_id, outcome_code, outcome_statement, bloom_level::text as bloom_level
      FROM curriculum_learning_outcomes
      WHERE curriculum_unit_id = $1::uuid
      ORDER BY sequence_number ASC
      `,
      inputs.curriculumUnitId,
    );

    // 5. Resolve matching digital resources
    const resources = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT DISTINCT lr.resource_id, lr.title, lr.resource_type::text as resource_type, lr.description
      FROM learning_resources lr
      LEFT JOIN learning_resource_subjects lrs ON lrs.resource_id = lr.resource_id
      LEFT JOIN learning_resource_grades lrg ON lrg.resource_id = lr.resource_id
      WHERE lr.org_id = $1::uuid
        AND lr.resource_status = 'published'::resource_status
        AND (lrs.subject_id = $2::uuid OR lrg.grade_id = $3::uuid)
      LIMIT 5
      `,
      orgId,
      inputs.subjectId,
      inputs.gradeId,
    );

    return {
      orgId,
      schoolName,
      academicYearId: inputs.academicYearId,
      academicYearName,
      gradeId: inputs.gradeId,
      gradeName,
      sectionId: inputs.sectionId,
      sectionName,
      subjectId: inputs.subjectId,
      subjectName,
      subjectCode,
      curriculumPlanId: unit.curriculum_plan_id,
      curriculumPlanTitle: unit.plan_title,
      curriculumPlanDescription: unit.plan_description,
      curriculumUnitId: unit.curriculum_unit_id,
      unitTitle: unit.unit_title,
      unitCode: unit.unit_code,
      unitDescription: unit.unit_description,
      officialOutcomes: outcomes.map((o) => ({
        learning_outcome_id: o.learning_outcome_id,
        outcome_code: o.outcome_code,
        outcome_statement: o.outcome_statement,
        bloom_level: o.bloom_level,
      })),
      availableResources: resources.map((r) => ({
        resource_id: r.resource_id,
        title: r.title,
        resource_type: r.resource_type,
        description: r.description,
      })),
    };
  }

  /**
   * Find curriculum plans for grade and subject in tenant
   */
  static async findCurriculumPlans(
    orgId: string,
    gradeId: string,
    subjectId: string,
    academicYearId?: string,
  ): Promise<any[]> {
    const params: any[] = [orgId, gradeId, subjectId];
    let yearFilter = '';
    if (academicYearId) {
      params.push(academicYearId);
      yearFilter = `AND ay.academic_year_id = $${params.length}::uuid`;
    }

    const sql = `
      SELECT
        cp.curriculum_plan_id,
        cp.plan_title,
        cp.plan_description,
        cp.status::text as status,
        cp.version_number,
        ay.academic_year_id,
        ay.academic_year_name,
        g.grade_id,
        g.grade_name,
        sub.subject_id,
        sub.subject_name,
        sub.subject_code,
        (SELECT COUNT(*)::int FROM curriculum_plan_units cpu WHERE cpu.curriculum_plan_id = cp.curriculum_plan_id) as units_count
      FROM curriculum_plans cp
      JOIN academic_year_grade_subjects aygs ON aygs.academic_year_grade_subject_id = cp.academic_year_grade_subject_id
      JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = aygs.academic_year_grade_id
      JOIN academic_years ay ON ay.academic_year_id = ayg.academic_year_id
      JOIN grades g ON g.grade_id = ayg.grade_id
      JOIN subjects sub ON sub.subject_id = aygs.subject_id
      WHERE cp.org_id = $1::uuid
        AND g.grade_id = $2::uuid
        AND sub.subject_id = $3::uuid
        ${yearFilter}
      ORDER BY cp.created_at DESC
    `;

    return prisma.$queryRawUnsafe<any[]>(sql, ...params);
  }

  /**
   * Find syllabus units for a curriculum plan
   */
  static async findUnits(orgId: string, curriculumPlanId: string): Promise<any[]> {
    const sql = `
      SELECT
        cpu.curriculum_unit_id,
        cpu.curriculum_plan_id,
        cpu.unit_title,
        cpu.unit_code,
        cpu.unit_description,
        cpu.sequence_number,
        cpu.planned_duration_periods,
        (SELECT COUNT(*)::int FROM curriculum_learning_outcomes clo WHERE clo.curriculum_unit_id = cpu.curriculum_unit_id) as outcomes_count,
        (SELECT COUNT(*)::int FROM lesson_plans lp WHERE lp.curriculum_unit_id = cpu.curriculum_unit_id) as saved_lessons_count
      FROM curriculum_plan_units cpu
      JOIN curriculum_plans cp ON cp.curriculum_plan_id = cpu.curriculum_plan_id
      WHERE cp.curriculum_plan_id = $1::uuid AND cp.org_id = $2::uuid
      ORDER BY cpu.sequence_number ASC
    `;

    return prisma.$queryRawUnsafe<any[]>(sql, curriculumPlanId, orgId);
  }

  /**
   * Find learning outcomes for a syllabus unit
   */
  static async findOutcomes(orgId: string, curriculumUnitId: string): Promise<any[]> {
    const sql = `
      SELECT
        clo.learning_outcome_id,
        clo.curriculum_unit_id,
        clo.outcome_code,
        clo.outcome_statement,
        clo.bloom_level::text as bloom_level,
        clo.assessment_criteria,
        clo.sequence_number
      FROM curriculum_learning_outcomes clo
      JOIN curriculum_plan_units cpu ON cpu.curriculum_unit_id = clo.curriculum_unit_id
      JOIN curriculum_plans cp ON cp.curriculum_plan_id = cpu.curriculum_plan_id
      WHERE clo.curriculum_unit_id = $1::uuid AND cp.org_id = $2::uuid
      ORDER BY clo.sequence_number ASC
    `;

    return prisma.$queryRawUnsafe<any[]>(sql, curriculumUnitId, orgId);
  }

  /**
   * Find digital resources matching lesson planning criteria
   */
  static async findResources(
    orgId: string,
    params: { subjectId?: string; gradeId?: string; search?: string; limit: number },
  ): Promise<any[]> {
    const conditions: string[] = [
      'lr.org_id = $1::uuid',
      "lr.resource_status = 'published'::resource_status",
    ];
    const queryParams: any[] = [orgId];

    if (params.subjectId) {
      queryParams.push(params.subjectId);
      conditions.push(`lrs.subject_id = $${queryParams.length}::uuid`);
    }

    if (params.gradeId) {
      queryParams.push(params.gradeId);
      conditions.push(`lrg.grade_id = $${queryParams.length}::uuid`);
    }

    if (params.search && params.search.trim().length > 0) {
      queryParams.push(`%${params.search.trim()}%`);
      const idx = queryParams.length;
      conditions.push(`(lr.title ILIKE $${idx} OR lr.description ILIKE $${idx})`);
    }

    queryParams.push(params.limit);
    const limitIdx = queryParams.length;

    const sql = `
      SELECT DISTINCT
        lr.resource_id,
        lr.title,
        lr.resource_type::text as resource_type,
        lr.mime_type,
        lr.description,
        lr.created_at::text as created_at
      FROM learning_resources lr
      LEFT JOIN learning_resource_subjects lrs ON lrs.resource_id = lr.resource_id
      LEFT JOIN learning_resource_grades lrg ON lrg.resource_id = lr.resource_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY lr.title ASC
      LIMIT $${limitIdx}::integer
    `;

    return prisma.$queryRawUnsafe<any[]>(sql, ...queryParams);
  }

  /**
   * List paginated saved lesson plans for tenant
   */
  static async findSavedPlans(
    orgId: string,
    params: ListLessonPlansRawInput = {},
  ): Promise<{ items: SavedLessonSummaryRecord[]; total: number }> {
    const page = params.page !== undefined ? Number(params.page) : 1;
    const limit = params.limit !== undefined ? Number(params.limit) : 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['cp.org_id = $1::uuid'];
    const queryParams: any[] = [orgId];

    if (params.curriculum_unit_id) {
      queryParams.push(params.curriculum_unit_id);
      conditions.push(`lp.curriculum_unit_id = $${queryParams.length}::uuid`);
    }

    if (params.teacher_staff_id) {
      queryParams.push(params.teacher_staff_id);
      conditions.push(`lp.teacher_staff_id = $${queryParams.length}::uuid`);
    }

    if (params.grade_id) {
      queryParams.push(params.grade_id);
      conditions.push(`g.grade_id = $${queryParams.length}::uuid`);
    }

    if (params.subject_id) {
      queryParams.push(params.subject_id);
      conditions.push(`sub.subject_id = $${queryParams.length}::uuid`);
    }

    if (params.academic_year_id) {
      queryParams.push(params.academic_year_id);
      conditions.push(`ay.academic_year_id = $${queryParams.length}::uuid`);
    }

    if (params.search && params.search.trim().length > 0) {
      queryParams.push(`%${params.search.trim()}%`);
      const idx = queryParams.length;
      conditions.push(`(lp.lesson_title ILIKE $${idx} OR lp.lesson_summary ILIKE $${idx})`);
    }

    const whereClause = conditions.join(' AND ');

    const countSql = `
      SELECT COUNT(*)::text as total
      FROM lesson_plans lp
      JOIN curriculum_plan_units cpu ON cpu.curriculum_unit_id = lp.curriculum_unit_id
      JOIN curriculum_plans cp ON cp.curriculum_plan_id = cpu.curriculum_plan_id
      JOIN academic_year_grade_subjects aygs ON aygs.academic_year_grade_subject_id = cp.academic_year_grade_subject_id
      JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = aygs.academic_year_grade_id
      JOIN academic_years ay ON ay.academic_year_id = ayg.academic_year_id
      JOIN grades g ON g.grade_id = ayg.grade_id
      JOIN subjects sub ON sub.subject_id = aygs.subject_id
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
        lp.lesson_plan_id,
        lp.curriculum_unit_id,
        cpu.unit_title,
        cp.curriculum_plan_id,
        cp.plan_title,
        g.grade_name,
        sub.subject_name,
        sub.subject_code,
        lp.teacher_staff_id,
        TRIM(CONCAT(u.first_name, ' ', u.last_name)) as teacher_name,
        lp.lesson_title,
        lp.lesson_summary,
        lp.sequence_number,
        lp.planned_date::text as planned_date,
        lp.duration_minutes,
        lp.teaching_approach,
        lp.is_active,
        (SELECT COUNT(*)::int FROM lesson_activities la WHERE la.lesson_plan_id = lp.lesson_plan_id) as activities_count,
        (SELECT COUNT(*)::int FROM lesson_plan_outcomes lpo WHERE lpo.lesson_plan_id = lp.lesson_plan_id) as outcomes_count,
        lp.created_at::text as created_at,
        lp.updated_at::text as updated_at
      FROM lesson_plans lp
      JOIN curriculum_plan_units cpu ON cpu.curriculum_unit_id = lp.curriculum_unit_id
      JOIN curriculum_plans cp ON cp.curriculum_plan_id = cpu.curriculum_plan_id
      JOIN academic_year_grade_subjects aygs ON aygs.academic_year_grade_subject_id = cp.academic_year_grade_subject_id
      JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = aygs.academic_year_grade_id
      JOIN academic_years ay ON ay.academic_year_id = ayg.academic_year_id
      JOIN grades g ON g.grade_id = ayg.grade_id
      JOIN subjects sub ON sub.subject_id = aygs.subject_id
      JOIN staff st ON st.staff_id = lp.teacher_staff_id
      JOIN users u ON u.user_id = st.user_id
      WHERE ${whereClause}
      ORDER BY lp.created_at DESC
      LIMIT $${limitIdx}::integer OFFSET $${offsetIdx}::integer
    `;

    const items = await prisma.$queryRawUnsafe<SavedLessonSummaryRecord[]>(dataSql, ...queryParams);
    return { items, total };
  }

  /**
   * Find single saved lesson plan with complete components
   */
  static async findSavedPlanById(orgId: string, lessonPlanId: string): Promise<any | null> {
    const planSql = `
      SELECT
        lp.lesson_plan_id,
        lp.curriculum_unit_id,
        cpu.unit_title,
        cpu.unit_code,
        cp.curriculum_plan_id,
        cp.plan_title,
        ay.academic_year_id,
        ay.academic_year_name,
        g.grade_id,
        g.grade_name,
        sub.subject_id,
        sub.subject_name,
        sub.subject_code,
        lp.teacher_staff_id,
        TRIM(CONCAT(u.first_name, ' ', u.last_name)) as teacher_name,
        lp.lesson_title,
        lp.lesson_summary,
        lp.sequence_number,
        lp.planned_date::text as planned_date,
        lp.duration_minutes,
        lp.teaching_approach,
        lp.prerequisite_knowledge,
        lp.is_active,
        lp.created_at::text as created_at,
        lp.updated_at::text as updated_at
      FROM lesson_plans lp
      JOIN curriculum_plan_units cpu ON cpu.curriculum_unit_id = lp.curriculum_unit_id
      JOIN curriculum_plans cp ON cp.curriculum_plan_id = cpu.curriculum_plan_id
      JOIN academic_year_grade_subjects aygs ON aygs.academic_year_grade_subject_id = cp.academic_year_grade_subject_id
      JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = aygs.academic_year_grade_id
      JOIN academic_years ay ON ay.academic_year_id = ayg.academic_year_id
      JOIN grades g ON g.grade_id = ayg.grade_id
      JOIN subjects sub ON sub.subject_id = aygs.subject_id
      JOIN staff st ON st.staff_id = lp.teacher_staff_id
      JOIN users u ON u.user_id = st.user_id
      WHERE lp.lesson_plan_id = $1::uuid AND cp.org_id = $2::uuid
      LIMIT 1
    `;

    const planRes = await prisma.$queryRawUnsafe<any[]>(planSql, lessonPlanId, orgId);
    if (!planRes || planRes.length === 0) return null;
    const plan = planRes[0];

    // Fetch child entities
    const outcomes = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT lpo.learning_outcome_id, lpo.coverage_notes, clo.outcome_code, clo.outcome_statement, clo.bloom_level::text as bloom_level
      FROM lesson_plan_outcomes lpo
      JOIN curriculum_learning_outcomes clo ON clo.learning_outcome_id = lpo.learning_outcome_id
      WHERE lpo.lesson_plan_id = $1::uuid
      ORDER BY clo.sequence_number ASC
      `,
      lessonPlanId,
    );

    const activities = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT lesson_activity_id, activity_type::text as activity_type, activity_title, activity_description, duration_minutes, sequence_number, materials_required
      FROM lesson_activities
      WHERE lesson_plan_id = $1::uuid
      ORDER BY sequence_number ASC
      `,
      lessonPlanId,
    );

    const differentiation = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT differentiation_strategy_id, learner_group, strategy_description, sequence_number
      FROM lesson_differentiation_strategies
      WHERE lesson_plan_id = $1::uuid
      ORDER BY sequence_number ASC
      `,
      lessonPlanId,
    );

    const exitTickets = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT exit_ticket_id, prompt, expected_response_or_criteria, sequence_number
      FROM lesson_exit_tickets
      WHERE lesson_plan_id = $1::uuid
      ORDER BY sequence_number ASC
      `,
      lessonPlanId,
    );

    const resources = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT lpr.resource_id, lpr.usage_notes, lpr.sequence_number, lr.title, lr.resource_type::text as resource_type, lr.mime_type
      FROM lesson_plan_resources lpr
      JOIN learning_resources lr ON lr.resource_id = lpr.resource_id
      WHERE lpr.lesson_plan_id = $1::uuid
      ORDER BY lpr.sequence_number ASC
      `,
      lessonPlanId,
    );

    return {
      ...plan,
      outcomes,
      activities,
      differentiation_strategies: differentiation,
      exit_tickets: exitTickets,
      resources,
    };
  }
}
