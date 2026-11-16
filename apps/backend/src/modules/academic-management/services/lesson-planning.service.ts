import {
  LessonPlanningRepository,
  ResolvedContext,
  SavedLessonSummaryRecord,
} from '../repositories/lesson-planning.repository';
import {
  GenerateLessonPlanInput,
  GenerateLessonPlanRawInput,
  generateLessonPlanSchema,
  RefineLessonPlanInput,
  RefineLessonPlanRawInput,
  refineLessonPlanSchema,
  ValidateLessonPlanInput,
  ValidateLessonPlanRawInput,
  validateLessonPlanSchema,
  GetLessonPlanningCurriculumInput,
  GetLessonPlanningResourcesInput,
  ListLessonPlansRawInput,
  StructuredLessonPlan,
  StructuredLessonPlanSchema,
} from '../dto/request/lesson-planning.dto';
import { AiProviderFactory } from './ai-provider.client';
import { LessonPromptBuilder } from './lesson-prompt.builder';
import { AcademicError } from '../errors/academic.errors';
import { TeacherContextRepository } from '../repositories/teacher-context.repository';

export class LessonPlanningService {
  /**
   * Resolve and verify curriculum context hierarchy
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
  ): Promise<ResolvedContext> {
    const context = await LessonPlanningRepository.resolveContext(orgId, inputs);
    if (!context) {
      throw new AcademicError(
        'Selected curriculum context is invalid or does not belong to your organization.',
        400,
        'INVALID_LESSON_CONTEXT',
      );
    }
    return context;
  }

  /**
   * Find curriculum plans for grade and subject
   */
  static async getCurriculumPlans(orgId: string, params: GetLessonPlanningCurriculumInput) {
    return LessonPlanningRepository.findCurriculumPlans(
      orgId,
      params.grade_id,
      params.subject_id,
      params.academic_year_id,
    );
  }

  /**
   * Find syllabus units for curriculum plan
   */
  static async getUnits(orgId: string, curriculumPlanId: string) {
    const units = await LessonPlanningRepository.findUnits(orgId, curriculumPlanId);
    if (!units || units.length === 0) {
      // Check if plan exists in tenant
      throw new AcademicError(
        `No syllabus units found for curriculum plan '${curriculumPlanId}'.`,
        404,
        'NOT_FOUND',
      );
    }
    return units;
  }

  /**
   * Find learning outcomes for syllabus unit
   */
  static async getOutcomes(orgId: string, curriculumUnitId: string) {
    const outcomes = await LessonPlanningRepository.findOutcomes(orgId, curriculumUnitId);
    return outcomes;
  }

  /**
   * Find matching digital learning resources
   */
  static async getResources(orgId: string, params: GetLessonPlanningResourcesInput) {
    return LessonPlanningRepository.findResources(orgId, {
      subjectId: params.subject_id,
      gradeId: params.grade_id,
      search: params.search,
      limit: params.limit,
    });
  }

  /**
   * Generate an AI-assisted structured lesson plan grounded in verified curriculum context
   */
  static async generateLessonPlan(
    orgId: string,
    rawInput: GenerateLessonPlanRawInput,
  ): Promise<StructuredLessonPlan> {
    const input = generateLessonPlanSchema.parse(rawInput);
    // 1. Resolve and ground with physical database context
    const context = await this.resolveContext(orgId, {
      academicYearId: input.academic_year_id,
      gradeId: input.grade_id,
      sectionId: input.section_id,
      subjectId: input.subject_id,
      curriculumPlanId: input.curriculum_plan_id,
      curriculumUnitId: input.curriculum_unit_id,
    });

    // Filter focal outcomes if specified
    let focalOutcomes = context.officialOutcomes;
    if (input.focal_outcome_ids && input.focal_outcome_ids.length > 0) {
      const focalSet = new Set(input.focal_outcome_ids);
      const matched = context.officialOutcomes.filter((o) => focalSet.has(o.learning_outcome_id));
      if (matched.length > 0) {
        focalOutcomes = matched;
      }
    }

    // 2. Build secure prompts
    const systemPrompt = LessonPromptBuilder.buildSystemPrompt();
    const userPrompt = LessonPromptBuilder.buildGenerationPrompt({
      schoolName: context.schoolName,
      academicYearName: context.academicYearName,
      gradeName: context.gradeName,
      sectionName: context.sectionName,
      subjectName: context.subjectName,
      subjectCode: context.subjectCode,
      curriculumPlanTitle: context.curriculumPlanTitle,
      curriculumPlanDescription: context.curriculumPlanDescription,
      unitTitle: context.unitTitle,
      unitCode: context.unitCode,
      unitDescription: context.unitDescription,
      officialOutcomes: focalOutcomes,
      availableResources: context.availableResources,
      topic: input.topic,
      durationMinutes: input.duration_minutes,
      teachingDate: input.teaching_date,
      preferredMethodology: input.preferred_methodology,
      difficultyLevel: input.difficulty_level,
      includeDifferentiatedInstruction: input.include_differentiated_instruction,
      includeExitTicket: input.include_exit_ticket,
    });

    // 3. Request LLM generation
    const provider = AiProviderFactory.getProvider();
    const aiResponse = await provider.generateJson(systemPrompt, userPrompt, {
      timeoutMs: 25000,
      temperature: 0.25,
    });

    // 4. Validate structured model output against Zod schema
    const parsed = StructuredLessonPlanSchema.safeParse(aiResponse.parsedJson);
    if (!parsed.success) {
      throw new AcademicError(
        'AI generated lesson plan response did not meet required structural validation.',
        502,
        'AI_RESPONSE_INVALID',
        parsed.error.format(),
      );
    }

    const plan = parsed.data;

    // 5. Post-process and ensure integrity metrics
    const totalActivityDuration = plan.lesson_activities.reduce(
      (sum, act) => sum + (act.duration_minutes || 0),
      0,
    );

    // Ensure metadata is accurately populated
    plan.topic = input.topic;
    plan.grade = context.gradeName;
    plan.subject = context.subjectName;
    plan.curriculum_unit_title = context.unitTitle;
    plan.estimated_duration_minutes = input.duration_minutes;

    plan.metadata = {
      generated_at: new Date().toISOString(),
      provider: aiResponse.provider,
      model: aiResponse.model,
      is_ai_generated: true,
      version: 1,
      total_activity_duration_minutes: totalActivityDuration,
      official_outcomes_count: context.officialOutcomes.length,
      token_usage: aiResponse.tokenUsage,
    };

    return plan;
  }

  /**
   * Refine an existing generated lesson plan with teacher feedback
   */
  static async refineLessonPlan(
    orgId: string,
    rawInput: RefineLessonPlanRawInput,
  ): Promise<StructuredLessonPlan> {
    const input = refineLessonPlanSchema.parse(rawInput);
    const systemPrompt = LessonPromptBuilder.buildSystemPrompt();
    const userPrompt = LessonPromptBuilder.buildRefinementPrompt(
      JSON.stringify(input.current_plan, null, 2),
      input.refinement_instructions,
      input.focus_areas,
      input.target_duration_minutes,
    );

    const provider = AiProviderFactory.getProvider();
    const aiResponse = await provider.generateJson(systemPrompt, userPrompt, {
      timeoutMs: 25000,
      temperature: 0.25,
    });

    const parsed = StructuredLessonPlanSchema.safeParse(aiResponse.parsedJson);
    if (!parsed.success) {
      throw new AcademicError(
        'AI refined lesson plan response did not meet required structural validation.',
        502,
        'AI_RESPONSE_INVALID',
        parsed.error.format(),
      );
    }

    const refined = parsed.data;
    const currentVersion = input.current_plan.metadata?.version || 1;
    const targetDuration =
      input.target_duration_minutes || input.current_plan.estimated_duration_minutes;

    const totalActivityDuration = refined.lesson_activities.reduce(
      (sum, act) => sum + (act.duration_minutes || 0),
      0,
    );

    refined.estimated_duration_minutes = targetDuration;
    refined.metadata = {
      generated_at: new Date().toISOString(),
      provider: aiResponse.provider,
      model: aiResponse.model,
      is_ai_generated: true,
      version: currentVersion + 1,
      total_activity_duration_minutes: totalActivityDuration,
      official_outcomes_count: input.current_plan.metadata?.official_outcomes_count || 0,
      token_usage: aiResponse.tokenUsage,
    };

    return refined;
  }

  /**
   * Validate quality and pedagogical metrics of a structured lesson plan
   */
  static async validateLessonPlanQuality(
    orgId: string,
    rawInput: ValidateLessonPlanRawInput,
  ): Promise<{
    is_valid: boolean;
    quality_score: number;
    duration_match: boolean;
    activity_count: number;
    bloom_levels_covered: string[];
    official_outcomes_aligned: boolean;
    validation_messages: string[];
  }> {
    const input = validateLessonPlanSchema.parse(rawInput);
    const plan = input.plan;
    const messages: string[] = [];

    const totalActivityDuration = plan.lesson_activities.reduce(
      (sum: number, act: { duration_minutes?: number }) => sum + (act.duration_minutes || 0),
      0,
    );

    const durationDiff = Math.abs(totalActivityDuration - plan.estimated_duration_minutes);
    const durationMatch = durationDiff <= 5;
    if (!durationMatch) {
      messages.push(
        `Activity durations sum to ${totalActivityDuration}m, differing from estimated ${plan.estimated_duration_minutes}m.`,
      );
    }

    const bloomSet = new Set<string>(
      plan.learning_objectives.map((o: { bloom_level?: string }) => o.bloom_level || 'understand'),
    );
    const bloomLevelsCovered = Array.from(bloomSet);

    if (plan.learning_objectives.length < 2) {
      messages.push('Lesson plan should ideally include at least 2 clear learning objectives.');
    }

    if (!plan.assessments.exit_ticket || !plan.assessments.exit_ticket.prompt) {
      messages.push('Lesson plan lacks an explicit exit ticket for formative evaluation.');
    }

    let qualityScore = 100;
    if (!durationMatch) qualityScore -= 15;
    if (bloomLevelsCovered.length < 2) qualityScore -= 10;
    if (plan.instructional_resources.length === 0) qualityScore -= 10;
    if (plan.differentiated_instruction.length === 0) qualityScore -= 15;

    return {
      is_valid: messages.length === 0,
      quality_score: Math.max(qualityScore, 0),
      duration_match: durationMatch,
      activity_count: plan.lesson_activities.length,
      bloom_levels_covered: bloomLevelsCovered,
      official_outcomes_aligned: plan.learning_objectives.some(
        (o: { is_official_outcome?: boolean }) => !!o.is_official_outcome,
      ),
      validation_messages: messages,
    };
  }

  /**
   * List saved lesson plans from physical PostgreSQL database (Read-only)
   */
  static async listSavedPlans(
    orgId: string,
    params: ListLessonPlansRawInput = {},
    requestingUser?: { userId: string; roles: string[] },
  ): Promise<{
    items: SavedLessonSummaryRecord[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = params.page !== undefined ? Number(params.page) : 1;
    const limit = params.limit !== undefined ? Number(params.limit) : 20;

    let effectiveParams: ListLessonPlansRawInput = { ...params };

    if (requestingUser) {
      const userRoles = requestingUser.roles || [];
      const isAdministrative = userRoles.some((r) =>
        ['ADMIN', 'ORG_ADMIN', 'SUPERADMIN', 'SUPER_ADMIN', 'HOI', 'PRINCIPAL'].includes(r),
      );

      if (isAdministrative) {
        // Administrative caller: If a teacher_staff_id filter is requested, verify it belongs to this tenant
        if (effectiveParams.teacher_staff_id) {
          const staff = await TeacherContextRepository.findStaffById(
            orgId,
            effectiveParams.teacher_staff_id,
          );
          if (!staff) {
            // Target staff does not exist in this tenant - return empty results to prevent cross-tenant lookup
            return {
              items: [],
              meta: { total: 0, page, limit, totalPages: 1 },
            };
          }
        }
      } else {
        // Non-administrative caller
        const isTeacher = userRoles.some((r) => ['TEACHER', 'FACULTY'].includes(r));
        if (!isTeacher) {
          throw new AcademicError(
            'Forbidden: Non-teaching staff cannot access institutional lesson plans.',
            403,
            'FORBIDDEN',
          );
        }

        // Ordinary teacher: Resolve teacher's own staff record and enforce teacher_staff_id strictly
        const staff = await TeacherContextRepository.findStaffByUserId(
          orgId,
          requestingUser.userId,
        );
        if (!staff) {
          return {
            items: [],
            meta: { total: 0, page, limit, totalPages: 1 },
          };
        }

        // Force teacher_staff_id to authenticated teacher's staff ID (ignores any client-supplied override)
        effectiveParams.teacher_staff_id = staff.staff_id;
      }
    }

    const { items, total } = await LessonPlanningRepository.findSavedPlans(orgId, effectiveParams);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get single saved lesson plan with complete components
   */
  static async getSavedPlanById(
    orgId: string,
    lessonPlanId: string,
    requestingUser?: { userId: string; roles: string[] },
  ) {
    const plan = await LessonPlanningRepository.findSavedPlanById(orgId, lessonPlanId);
    if (!plan) {
      throw new AcademicError(
        `Saved lesson plan '${lessonPlanId}' was not found.`,
        404,
        'NOT_FOUND',
      );
    }

    if (requestingUser) {
      const isAdministrative = (requestingUser.roles || []).some((r) =>
        ['ADMIN', 'ORG_ADMIN', 'SUPERADMIN', 'SUPER_ADMIN', 'HOI', 'PRINCIPAL'].includes(r),
      );
      if (!isAdministrative) {
        const staff = await TeacherContextRepository.findStaffByUserId(
          orgId,
          requestingUser.userId,
        );
        if (!staff || plan.teacher_staff_id !== staff.staff_id) {
          throw new AcademicError(
            'Forbidden: Teachers may only access their own lesson plans.',
            403,
            'FORBIDDEN_LESSON_PLAN_ACCESS',
          );
        }
      }
    }

    return plan;
  }

  // ── Explicit 501 Handlers for Unsupported Write Operations ──────────────
  static handlePlanCreateUnsupported(): never {
    throw new AcademicError(
      'Lesson plan direct write persistence is outside the finalized Stage-1 baseline and requires Stage-2/Stage-3 database migration approval.',
      501,
      'FEATURE_NOT_IMPLEMENTED',
      { limitation_code: 'WRITE_OPERATIONS_FROZEN_STAGE_1' },
    );
  }

  static handlePlanUpdateUnsupported(): never {
    throw new AcademicError(
      'Lesson plan updates are outside the finalized Stage-1 baseline and require Stage-2/Stage-3 database migration approval.',
      501,
      'FEATURE_NOT_IMPLEMENTED',
      { limitation_code: 'WRITE_OPERATIONS_FROZEN_STAGE_1' },
    );
  }

  static handlePlanDeleteUnsupported(): never {
    throw new AcademicError(
      'Lesson plan deletions are outside the finalized Stage-1 baseline and require Stage-2/Stage-3 database migration approval.',
      501,
      'FEATURE_NOT_IMPLEMENTED',
      { limitation_code: 'WRITE_OPERATIONS_FROZEN_STAGE_1' },
    );
  }

  static handlePlanSubmitUnsupported(): never {
    throw new AcademicError(
      'Lesson plan approval workflow mutations are outside the finalized Stage-1 baseline and require Stage-2/Stage-3 database migration approval.',
      501,
      'FEATURE_NOT_IMPLEMENTED',
      { limitation_code: 'WRITE_OPERATIONS_FROZEN_STAGE_1' },
    );
  }

  static handlePlanApproveUnsupported(): never {
    throw new AcademicError(
      'Lesson plan approval mutations are outside the finalized Stage-1 baseline and require Stage-2/Stage-3 database migration approval.',
      501,
      'FEATURE_NOT_IMPLEMENTED',
      { limitation_code: 'WRITE_OPERATIONS_FROZEN_STAGE_1' },
    );
  }
}
