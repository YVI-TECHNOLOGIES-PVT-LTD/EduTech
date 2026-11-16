import { z } from 'zod';

export const uuidSchema = z.string().uuid('Invalid UUID identifier');

const isoDateTimeSchema = z
  .string()
  .trim()
  .min(1, 'Timestamp is required')
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid ISO timestamp');

export const activityTypeSchema = z.enum(['homework', 'project']);
export const activitySubtypeSchema = z.enum([
  'homework',
  'project',
  'coding_lab',
  'video_submission',
  'audio_submission',
  'quiz',
  'peer_learning',
  'collaborative',
]);

export const codingLabConfigSchema = z.object({
  language: z.string().trim().min(1).max(50),
  problem_statement: z.string().trim().max(10000).optional(),
  input_format: z.string().trim().max(2000).optional(),
  output_format: z.string().trim().max(2000).optional(),
  constraints: z.string().trim().max(2000).optional(),
  sample_input: z.string().trim().max(5000).optional(),
  sample_output: z.string().trim().max(5000).optional(),
  starter_code: z.string().max(10000).optional(),
});

export const quizConfigSchema = z.object({
  duration_minutes: z.number().int().min(1).max(180).optional(),
  questions: z.array(
    z.object({
      question_id: z.string().trim().min(1),
      question_text: z.string().trim().min(1).max(2000),
      options: z.array(
        z.object({
          key: z.string().trim().min(1).max(10),
          text: z.string().trim().min(1).max(1000),
        }),
      ),
      correct_key: z.string().trim().max(10).optional(),
      explanation: z.string().trim().max(2000).optional(),
      marks: z.number().min(0).max(100).optional(),
    }),
  ),
  shuffle_questions: z.boolean().optional(),
});

export const peerLearningConfigSchema = z.object({
  learning_objective: z.string().trim().max(2000).optional(),
  group_size: z.number().int().min(2).max(10).optional(),
  discussion_prompts: z.array(z.string().trim().max(1000)).optional(),
  rubric_criteria: z.array(z.string().trim().max(1000)).optional(),
});

export const collaborativeConfigSchema = z.object({
  group_name: z.string().trim().max(200).optional(),
  team_roles: z.array(z.string().trim().max(100)).optional(),
  shared_deliverables: z.array(z.string().trim().max(1000)).optional(),
  contribution_guidelines: z.string().trim().max(2000).optional(),
});

export const activityStatusSchema = z.enum(['draft', 'published', 'closed']);
export const submissionStatusSchema = z.enum([
  'submitted',
  'under_review',
  'resubmission_requested',
  'reviewed',
]);
export const reviewDecisionSchema = z.enum(['reviewed', 'resubmission_requested']);

export const createActivitySchema = z
  .object({
    faculty_assignment_id: uuidSchema,
    lesson_plan_id: uuidSchema.optional().nullable(),
    activity_type: activityTypeSchema,
    activity_subtype: activitySubtypeSchema.optional(),
    coding_lab_config: codingLabConfigSchema.optional().nullable(),
    quiz_config: quizConfigSchema.optional().nullable(),
    peer_learning_config: peerLearningConfigSchema.optional().nullable(),
    collaborative_config: collaborativeConfigSchema.optional().nullable(),
    title: z.string().trim().min(1, 'Title is required').max(255, 'Title cannot exceed 255 chars'),
    instructions: z
      .string()
      .trim()
      .min(1, 'Instructions are required')
      .max(20000, 'Instructions cannot exceed 20,000 chars'),
    assigned_at: isoDateTimeSchema.optional(),
    due_at: isoDateTimeSchema,
    late_submission_authorized_until: isoDateTimeSchema.optional().nullable(),
    grading_enabled: z.boolean().default(false),
    maximum_marks: z.coerce
      .number()
      .positive('Maximum marks must be > 0')
      .max(10000)
      .optional()
      .nullable(),
    publish_immediately: z.boolean().optional().default(false),
  })
  .superRefine((val, ctx) => {
    const assignedMs = val.assigned_at ? Date.parse(val.assigned_at) : Date.now();
    const dueMs = Date.parse(val.due_at);
    if (dueMs <= assignedMs) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['due_at'],
        message: 'Due date & time must be strictly after assigned date & time',
      });
    }
    if (val.late_submission_authorized_until) {
      const lateMs = Date.parse(val.late_submission_authorized_until);
      if (lateMs <= dueMs) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['late_submission_authorized_until'],
          message: 'Late submission extension must be strictly after due_at',
        });
      }
    }
    if (val.grading_enabled) {
      if (
        val.maximum_marks === null ||
        val.maximum_marks === undefined ||
        Number(val.maximum_marks) <= 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['maximum_marks'],
          message: 'Maximum marks (> 0) is required when grading is enabled',
        });
      }
    } else if (val.maximum_marks !== null && val.maximum_marks !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['maximum_marks'],
        message: 'Maximum marks must be omitted when grading is disabled',
      });
    }
  });

export const updateActivitySchema = z
  .object({
    lesson_plan_id: uuidSchema.optional().nullable(),
    activity_type: activityTypeSchema.optional(),
    activity_subtype: activitySubtypeSchema.optional(),
    coding_lab_config: codingLabConfigSchema.optional().nullable(),
    quiz_config: quizConfigSchema.optional().nullable(),
    peer_learning_config: peerLearningConfigSchema.optional().nullable(),
    collaborative_config: collaborativeConfigSchema.optional().nullable(),
    title: z.string().trim().min(1).max(255).optional(),
    instructions: z.string().trim().min(1).max(20000).optional(),
    assigned_at: isoDateTimeSchema.optional(),
    due_at: isoDateTimeSchema.optional(),
    late_submission_authorized_until: isoDateTimeSchema.optional().nullable(),
    grading_enabled: z.boolean().optional(),
    maximum_marks: z.coerce.number().positive().max(10000).optional().nullable(),
  })
  .refine((val) => Object.keys(val).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const closeActivitySchema = z.object({
  closure_reason: z.string().trim().max(1000).optional().nullable(),
});

export const extendLateSubmissionSchema = z.object({
  late_submission_authorized_until: isoDateTimeSchema.nullable(),
});

export const listActivitiesQuerySchema = z.object({
  activity_type: activityTypeSchema.optional(),
  activity_subtype: activitySubtypeSchema.optional(),
  activity_status: activityStatusSchema.optional(),
  section_id: uuidSchema.optional(),
  subject_id: uuidSchema.optional(),
  academic_year_id: uuidSchema.optional(),
  submission_status: submissionStatusSchema.optional(),
  view: z
    .enum([
      'all',
      'pending',
      'upcoming',
      'overdue',
      'submitted',
      'reviewed',
      'resubmission_requested',
    ])
    .optional()
    .default('all'),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const listTeacherSubmissionsQuerySchema = z.object({
  activity_id: uuidSchema.optional(),
  submission_status: submissionStatusSchema.optional(),
  is_late: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const createStudentSubmissionSchema = z.object({
  text_content: z.string().max(50000).optional().nullable(),
});

export const createTeacherReviewSchema = z
  .object({
    review_decision: reviewDecisionSchema,
    obtained_marks: z.coerce
      .number()
      .min(0, 'Marks cannot be negative')
      .max(10000)
      .optional()
      .nullable(),
    feedback: z.string().trim().max(10000).optional().nullable(),
    resubmission_allowed_until: isoDateTimeSchema.optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.review_decision === 'resubmission_requested') {
      if (!val.resubmission_allowed_until) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['resubmission_allowed_until'],
          message: 'resubmission_allowed_until is required when requesting resubmission',
        });
      } else if (Date.parse(val.resubmission_allowed_until) <= Date.now()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['resubmission_allowed_until'],
          message: 'resubmission_allowed_until must be a future date & time',
        });
      }
    } else if (val.resubmission_allowed_until) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['resubmission_allowed_until'],
        message: 'resubmission_allowed_until is only permitted when requesting resubmission',
      });
    }
  });
