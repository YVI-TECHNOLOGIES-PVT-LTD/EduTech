import { z } from 'zod';

export const uuidSchema = z.string().uuid('Invalid UUID identifier');

export const generateLessonPlanSchema = z.object({
  faculty_assignment_id: uuidSchema,
  curriculum_unit_id: uuidSchema.optional().nullable(),
  topic: z.string().trim().min(2, 'Topic must be at least 2 characters').max(200),
  duration_minutes: z.coerce.number().int().min(15).max(300).default(45),
  teaching_approach: z
    .enum(['traditional', 'flipped', 'inquiry_based', 'collaborative', 'experiential'])
    .default('collaborative'),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  learning_objectives: z.array(z.string().trim().min(1)).max(10).optional(),
  teacher_notes: z.string().trim().max(2000).optional().nullable(),
});

export const generateTeachingMaterialSchema = z.object({
  faculty_assignment_id: uuidSchema,
  curriculum_unit_id: uuidSchema.optional().nullable(),
  material_type: z.enum([
    'worksheet',
    'quiz',
    'topic_summary',
    'study_notes',
    'discussion_prompts',
    'worked_examples',
  ]),
  topic: z.string().trim().min(2).max(200),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  target_length: z.enum(['concise', 'standard', 'comprehensive']).default('standard'),
  teacher_instructions: z.string().trim().max(2000).optional().nullable(),
});

export const generateQuestionsSchema = z.object({
  faculty_assignment_id: uuidSchema,
  curriculum_unit_id: uuidSchema.optional().nullable(),
  topic: z.string().trim().min(2).max(200),
  question_types: z
    .array(z.enum(['mcq', 'true_false', 'short_answer', 'descriptive']))
    .min(1, 'Select at least one question type')
    .default(['mcq', 'short_answer']),
  total_questions: z.coerce.number().int().min(1).max(50).default(5),
  difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']).default('mixed'),
  marks_per_question: z.coerce.number().min(1).max(100).default(1),
  blooms_levels: z
    .array(z.enum(['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']))
    .optional(),
  learning_objectives: z.array(z.string().trim().min(1)).optional(),
});

export const generateAssessmentSchema = z.object({
  faculty_assignment_id: uuidSchema,
  curriculum_unit_id: uuidSchema.optional().nullable(),
  title: z.string().trim().min(2).max(200),
  topic: z.string().trim().min(2).max(200),
  duration_minutes: z.coerce.number().int().min(15).max(180).default(60),
  total_marks: z.coerce.number().int().min(5).max(200).default(50),
  question_count: z.coerce.number().int().min(3).max(40).default(10),
  question_types: z
    .array(z.enum(['mcq', 'true_false', 'short_answer', 'descriptive']))
    .min(1)
    .default(['mcq', 'short_answer']),
  difficulty_distribution: z
    .object({
      easy_percent: z.number().min(0).max(100).default(30),
      medium_percent: z.number().min(0).max(100).default(50),
      hard_percent: z.number().min(0).max(100).default(20),
    })
    .default({ easy_percent: 30, medium_percent: 50, hard_percent: 20 }),
});

export const generateActivitySchema = z.object({
  faculty_assignment_id: uuidSchema,
  activity_type: z.enum(['homework', 'project']),
  topic: z.string().trim().min(2).max(200),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  learning_objectives: z.array(z.string().trim().min(1)).max(10).optional(),
  suggested_days: z.coerce.number().int().min(1).max(30).default(3),
  additional_notes: z.string().trim().max(2000).optional().nullable(),
});

export const analyzePerformanceSchema = z.object({
  faculty_assignment_id: uuidSchema,
  student_id: uuidSchema.optional().nullable(),
  topic: z.string().trim().max(200).optional().nullable(),
  focus_area: z.enum(['overall', 'submissions', 'attendance', 'low_performing']).default('overall'),
});

export const analyzeLearningGapsSchema = z.object({
  faculty_assignment_id: uuidSchema,
  topic: z.string().trim().min(2).max(200),
  unit_id: uuidSchema.optional().nullable(),
});

export const generateRemedialPlanSchema = z.object({
  faculty_assignment_id: uuidSchema,
  learning_gap_description: z.string().trim().min(5).max(2000),
  affected_concept: z.string().trim().min(2).max(200),
  target_duration_days: z.coerce.number().int().min(1).max(30).default(7),
});

export const draftFeedbackSchema = z.object({
  faculty_assignment_id: uuidSchema,
  submission_id: uuidSchema.optional().nullable(),
  student_work_text: z.string().trim().max(10000).optional().nullable(),
  observed_strengths: z.string().trim().max(2000).optional().nullable(),
  observed_weaknesses: z.string().trim().max(2000).optional().nullable(),
  tone: z.enum(['encouraging', 'constructive', 'rigorous']).default('encouraging'),
});

export const draftParentCommunicationSchema = z.object({
  faculty_assignment_id: uuidSchema,
  student_id: uuidSchema.optional().nullable(),
  communication_type: z.enum([
    'progress_update',
    'homework_reminder',
    'appreciation',
    'remedial_support_request',
    'upcoming_test_notice',
  ]),
  topic: z.string().trim().max(200).optional().nullable(),
  specific_observations: z.string().trim().max(2000).optional().nullable(),
  tone: z.enum(['formal', 'friendly', 'concise', 'detailed']).default('friendly'),
});

export const studentStudyAssistantSchema = z.object({
  topic: z.string().trim().min(2, 'Topic is required').max(200),
  subject_name: z.string().trim().max(100).optional(),
  grade_level: z.string().trim().max(50).optional(),
  student_question: z.string().trim().min(3).max(1000),
  preferred_style: z.enum(['simplified', 'detailed', 'step_by_step']).default('step_by_step'),
});

export const approveMaterialSchema = z.object({
  generation_request_id: uuidSchema,
  title: z.string().trim().min(2).max(200),
  change_summary: z.string().trim().max(1000).optional().nullable(),
});

export const dismissRecommendationSchema = z.object({
  recommendation_id: uuidSchema,
  dismissal_reason: z.string().trim().max(1000).optional().nullable(),
});
