"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateQuestionSchema = exports.createQuestionSchema = exports.questionOptionSchema = void 0;
const zod_1 = require("zod");
exports.questionOptionSchema = zod_1.z.object({
    option_text: zod_1.z.string().min(1, 'Option text is required'),
    is_correct: zod_1.z.boolean().default(false)
});
exports.createQuestionSchema = zod_1.z.object({
    academic_year_id: zod_1.z.string().uuid('Academic Year must be a valid UUID'),
    campus_id: zod_1.z.string().uuid().optional().nullable(),
    program_id: zod_1.z.string().uuid().optional().nullable(),
    department_id: zod_1.z.string().uuid().optional().nullable(),
    folder_id: zod_1.z.string().uuid().optional().nullable(),
    subject_id: zod_1.z.string().uuid('Subject must be a valid UUID'),
    question_text: zod_1.z.string().min(1, 'Question content text is required'),
    question_type: zod_1.z.enum(['MCQ', 'TRUE_FALSE', 'SUBJECTIVE', 'MULTIPLE_SELECT', 'FILL_BLANKS', 'CODING', 'SQL']),
    difficulty: zod_1.z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
    bloom_level: zod_1.z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']).default('REMEMBER'),
    points: zod_1.z.number().min(0, 'Points cannot be negative').default(1.00),
    negative_marks: zod_1.z.number().min(0, 'Negative marks cannot be negative').default(0.00),
    explanation: zod_1.z.string().optional().nullable(),
    course_outcome_code: zod_1.z.string().optional().nullable(),
    program_outcome_code: zod_1.z.string().optional().nullable(),
    lesson_id: zod_1.z.string().uuid().optional().nullable(),
    taxonomy_tags: zod_1.z.array(zod_1.z.string()).default([]),
    status: zod_1.z.enum(['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'ARCHIVED']).default('DRAFT'),
    options: zod_1.z.array(exports.questionOptionSchema).default([])
});
exports.updateQuestionSchema = exports.createQuestionSchema.partial();
