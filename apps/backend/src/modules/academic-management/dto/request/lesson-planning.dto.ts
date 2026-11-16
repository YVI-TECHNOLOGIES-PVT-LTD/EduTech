import { z } from 'zod';

// ── Enumerations matching database and educational taxonomy ──────────────────
export const BloomLevelEnum = z.enum([
  'remember',
  'understand',
  'apply',
  'analyze',
  'evaluate',
  'create',
]);
export type BloomLevel = z.infer<typeof BloomLevelEnum>;

export const LessonActivityTypeEnum = z.enum([
  'direct_instruction',
  'discussion',
  'group_work',
  'individual_work',
  'practical',
  'project',
  'inquiry',
  'assessment',
  'reflection',
  'other',
]);
export type LessonActivityType = z.infer<typeof LessonActivityTypeEnum>;

// ── Structured AI Lesson Plan Sub-schemas ────────────────────────────────────
export const LearningObjectiveSchema = z.object({
  description: z.string().min(5),
  bloom_level: BloomLevelEnum.default('understand'),
  curriculum_alignment: z.string().default('Supplementary Objective'),
  is_official_outcome: z.boolean().default(false),
  assessment_method: z.string().default('Teacher observation and guided questioning'),
});
export type LearningObjective = z.infer<typeof LearningObjectiveSchema>;

export const TeachingIntroductionSchema = z.object({
  hook: z.string().min(5),
  previous_knowledge_connection: z.string().default('Connects to preceding unit lessons.'),
  motivational_questions: z.array(z.string()).default([]),
});
export type TeachingIntroduction = z.infer<typeof TeachingIntroductionSchema>;

export const LessonActivityItemSchema = z.object({
  sequence_number: z.number().int().positive(),
  activity_title: z.string().min(3),
  activity_type: LessonActivityTypeEnum.default('direct_instruction'),
  duration_minutes: z.number().int().positive(),
  teacher_instructions: z.string().min(5),
  student_participation: z.string().default('Active engagement and note-taking.'),
  materials_required: z.string().default('Standard classroom supplies.'),
  expected_result: z.string().default('Students demonstrate mastery of key concept.'),
});
export type LessonActivityItem = z.infer<typeof LessonActivityItemSchema>;

export const RecommendedResourceSchema = z.object({
  resource_id: z.string().uuid().nullable().optional(),
  title: z.string().min(3),
  resource_type: z.string().default('document'),
  recommendation_reason: z.string().default('Relevant curriculum enrichment material.'),
  usage_guidelines: z.string().default('Use during direct instruction or guided inquiry.'),
  is_existing_resource: z.boolean().default(false),
});
export type RecommendedResource = z.infer<typeof RecommendedResourceSchema>;

export const LessonAssessmentsSchema = z.object({
  formative_questions: z.array(z.string()).default([]),
  exit_ticket: z.object({
    prompt: z.string().min(5),
    expected_criteria: z.string().min(5),
  }),
  homework: z.string().default('Review lesson notes and complete assigned exercises.'),
});
export type LessonAssessments = z.infer<typeof LessonAssessmentsSchema>;

export const DifferentiatedStrategySchema = z.object({
  learner_group: z.string().min(3),
  strategy_description: z.string().min(5),
});
export type DifferentiatedStrategy = z.infer<typeof DifferentiatedStrategySchema>;

export const LessonClosureSchema = z.object({
  summary: z.string().min(5),
  reflection_questions: z.array(z.string()).default([]),
  next_steps: z.string().default('Continue with the subsequent topic in next session.'),
});
export type LessonClosure = z.infer<typeof LessonClosureSchema>;

// ── Complete Validated Structured Lesson Plan ────────────────────────────────
export const StructuredLessonPlanSchema = z.object({
  lesson_title: z.string().min(3),
  estimated_duration_minutes: z.number().int().min(15).max(180),
  topic: z.string().min(3),
  grade: z.string().default(''),
  subject: z.string().default(''),
  curriculum_unit_title: z.string().default(''),
  prerequisite_knowledge: z.string().default('Basic introductory concepts.'),
  teaching_approach: z.string().default('Interactive blended instruction.'),
  learning_objectives: z.array(LearningObjectiveSchema).min(1),
  teaching_introduction: TeachingIntroductionSchema,
  teaching_methodologies: z.array(z.string()).min(1),
  lesson_activities: z.array(LessonActivityItemSchema).min(1),
  instructional_resources: z.array(RecommendedResourceSchema).default([]),
  assessments: LessonAssessmentsSchema,
  differentiated_instruction: z.array(DifferentiatedStrategySchema).default([]),
  lesson_closure: LessonClosureSchema,
  metadata: z.object({
    generated_at: z.string(),
    provider: z.string(),
    model: z.string(),
    is_ai_generated: z.boolean().default(true),
    version: z.number().int().default(1),
    total_activity_duration_minutes: z.number().int().default(0),
    official_outcomes_count: z.number().int().default(0),
    token_usage: z
      .object({
        prompt_tokens: z.number().optional(),
        completion_tokens: z.number().optional(),
        total_tokens: z.number().optional(),
      })
      .optional(),
  }),
});
export type StructuredLessonPlan = z.infer<typeof StructuredLessonPlanSchema>;

// ── Request Query / Body Validation Schemas ──────────────────────────────────

// 1. Context Queries
export const getLessonPlanningContextSchema = z.object({
  academic_year_id: z.string().uuid().optional(),
  grade_id: z.string().uuid().optional(),
  subject_id: z.string().uuid().optional(),
});
export type GetLessonPlanningContextInput = z.infer<typeof getLessonPlanningContextSchema>;

export const getLessonPlanningCurriculumSchema = z.object({
  grade_id: z.string().uuid(),
  subject_id: z.string().uuid(),
  academic_year_id: z.string().uuid().optional(),
});
export type GetLessonPlanningCurriculumInput = z.infer<typeof getLessonPlanningCurriculumSchema>;

export const getLessonPlanningUnitsSchema = z.object({
  curriculum_plan_id: z.string().uuid(),
});
export type GetLessonPlanningUnitsInput = z.infer<typeof getLessonPlanningUnitsSchema>;

export const getLessonPlanningOutcomesSchema = z.object({
  curriculum_unit_id: z.string().uuid(),
});
export type GetLessonPlanningOutcomesInput = z.infer<typeof getLessonPlanningOutcomesSchema>;

export const getLessonPlanningResourcesSchema = z.object({
  subject_id: z.string().uuid().optional(),
  grade_id: z.string().uuid().optional(),
  curriculum_unit_id: z.string().uuid().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().max(50).default(10),
});
export type GetLessonPlanningResourcesInput = z.infer<typeof getLessonPlanningResourcesSchema>;

// 2. AI Generation Input
export const generateLessonPlanSchema = z.object({
  academic_year_id: z.string().uuid(),
  grade_id: z.string().uuid(),
  section_id: z.string().uuid().optional(),
  subject_id: z.string().uuid(),
  curriculum_plan_id: z.string().uuid().optional(),
  curriculum_unit_id: z.string().uuid(),
  focal_outcome_ids: z.array(z.string().uuid()).optional().default([]),
  topic: z.string().min(3).max(200),
  duration_minutes: z.coerce.number().int().min(15).max(180).default(45),
  teaching_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format')
    .optional(),
  preferred_methodology: z.string().max(200).optional(),
  difficulty_level: z.enum(['standard', 'introductory', 'advanced']).default('standard'),
  include_differentiated_instruction: z.boolean().default(true),
  include_exit_ticket: z.boolean().default(true),
  include_resource_recommendations: z.boolean().default(true),
});
export type GenerateLessonPlanInput = z.infer<typeof generateLessonPlanSchema>;
export type GenerateLessonPlanRawInput = z.input<typeof generateLessonPlanSchema>;

// 3. AI Refinement Input
export const refineLessonPlanSchema = z.object({
  current_plan: StructuredLessonPlanSchema,
  refinement_instructions: z.string().min(5).max(1000),
  focus_areas: z
    .array(
      z.enum([
        'activities',
        'objectives',
        'duration',
        'assessments',
        'differentiation',
        'methodology',
        'resources',
      ]),
    )
    .optional(),
  target_duration_minutes: z.coerce.number().int().min(15).max(180).optional(),
});
export type RefineLessonPlanInput = z.infer<typeof refineLessonPlanSchema>;
export type RefineLessonPlanRawInput = z.input<typeof refineLessonPlanSchema>;

// 4. Validation Input
export const validateLessonPlanSchema = z.object({
  plan: StructuredLessonPlanSchema,
  curriculum_unit_id: z.string().uuid().optional(),
});
export type ValidateLessonPlanInput = z.infer<typeof validateLessonPlanSchema>;
export type ValidateLessonPlanRawInput = z.input<typeof validateLessonPlanSchema>;

// 5. Saved Lesson Plans Query
export const listLessonPlansSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  curriculum_unit_id: z.string().uuid().optional(),
  teacher_staff_id: z.string().uuid().optional(),
  grade_id: z.string().uuid().optional(),
  subject_id: z.string().uuid().optional(),
  academic_year_id: z.string().uuid().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['title', 'date', 'created_at', 'duration']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export type ListLessonPlansInput = z.infer<typeof listLessonPlansSchema>;
export type ListLessonPlansRawInput = z.input<typeof listLessonPlansSchema>;
