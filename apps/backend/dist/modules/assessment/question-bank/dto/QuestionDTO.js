"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionBulkCopySchema = exports.questionBulkMoveSchema = exports.questionImportDTOSchema = exports.questionVersionDTOSchema = exports.questionWorkflowDTOSchema = exports.questionAssetDTOSchema = exports.questionFolderDTOSchema = exports.questionSearchDTOSchema = exports.questionUpdateDTOSchema = exports.questionCreateDTOSchema = exports.questionOptionDTO = void 0;
const zod_1 = require("zod");
exports.questionOptionDTO = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    option_text: zod_1.z.string().min(1, 'Option text cannot be empty'),
    is_correct: zod_1.z.boolean().default(false)
});
exports.questionCreateDTOSchema = zod_1.z.object({
    academic_year_id: zod_1.z.string().uuid('Academic Year is required'),
    campus_id: zod_1.z.string().uuid().optional().nullable(),
    program_id: zod_1.z.string().uuid().optional().nullable(),
    department_id: zod_1.z.string().uuid().optional().nullable(),
    folder_id: zod_1.z.string().uuid().optional().nullable(),
    subject_id: zod_1.z.string().uuid('Subject ID is required'),
    question_text: zod_1.z.string().min(1, 'Question text cannot be empty'),
    question_type: zod_1.z.string().min(1, 'Question type is required'),
    difficulty: zod_1.z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
    bloom_level: zod_1.z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']).default('REMEMBER'),
    points: zod_1.z.number().min(0).default(1.0),
    negative_marks: zod_1.z.number().min(0).default(0.0),
    explanation: zod_1.z.string().optional().nullable(),
    course_outcome_code: zod_1.z.string().optional().nullable(),
    program_outcome_code: zod_1.z.string().optional().nullable(),
    lesson_id: zod_1.z.string().uuid().optional().nullable(),
    taxonomy_tags: zod_1.z.array(zod_1.z.string()).default([]),
    options: zod_1.z.array(exports.questionOptionDTO).default([])
});
exports.questionUpdateDTOSchema = exports.questionCreateDTOSchema.partial();
exports.questionSearchDTOSchema = zod_1.z.object({
    folderId: zod_1.z.string().uuid().optional().nullable(),
    subjectId: zod_1.z.string().uuid().optional(),
    difficulty: zod_1.z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
    bloomLevel: zod_1.z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']).optional(),
    status: zod_1.z.enum(['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED']).optional(),
    questionType: zod_1.z.string().optional(),
    creatorId: zod_1.z.string().uuid().optional(),
    language: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    sortBy: zod_1.z.string().default('created_at'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
    page: zod_1.z.number().int().min(1).default(1),
    limit: zod_1.z.number().int().min(1).max(100).default(10)
});
exports.questionFolderDTOSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Folder name cannot be empty'),
    parent_id: zod_1.z.string().uuid().optional().nullable()
});
exports.questionAssetDTOSchema = zod_1.z.object({
    file_name: zod_1.z.string().min(1),
    file_path: zod_1.z.string().min(1),
    mime_type: zod_1.z.string().min(1),
    file_size: zod_1.z.number().int().min(1)
});
exports.questionWorkflowDTOSchema = zod_1.z.object({
    workflow_definition_id: zod_1.z.string().uuid('Workflow definition ID is required'),
    target_status: zod_1.z.enum(['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED']),
    transition_reason: zod_1.z.string().optional()
});
exports.questionVersionDTOSchema = zod_1.z.object({
    version: zod_1.z.number().int().min(1),
    description: zod_1.z.string().optional()
});
exports.questionImportDTOSchema = zod_1.z.object({
    academicYearId: zod_1.z.string().uuid(),
    subjectId: zod_1.z.string().uuid(),
    folderId: zod_1.z.string().uuid().optional().nullable(),
    csv: zod_1.z.string().min(1, 'CSV content is required')
});
exports.questionBulkMoveSchema = zod_1.z.object({
    questionIds: zod_1.z.array(zod_1.z.string().uuid()).min(1, 'At least one question is required'),
    targetFolderId: zod_1.z.string().uuid().nullable()
});
exports.questionBulkCopySchema = zod_1.z.object({
    questionIds: zod_1.z.array(zod_1.z.string().uuid()).min(1, 'At least one question is required'),
    targetFolderId: zod_1.z.string().uuid().nullable()
});
