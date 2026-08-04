"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blueprintCloneDTOSchema = exports.blueprintVersionDTOSchema = exports.blueprintWorkflowDTOSchema = exports.blueprintSearchDTOSchema = exports.blueprintUpdateDTOSchema = exports.blueprintCreateDTOSchema = exports.blueprintSectionDTO = exports.blueprintSectionRuleDTO = void 0;
const zod_1 = require("zod");
exports.blueprintSectionRuleDTO = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    filter_field: zod_1.z.string().min(1, 'Rule filter field cannot be empty'),
    filter_value: zod_1.z.string().min(1, 'Rule filter value cannot be empty'),
    match_operator: zod_1.z.string().default('eq')
});
exports.blueprintSectionDTO = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    section_name: zod_1.z.string().min(1, 'Section name cannot be empty'),
    description: zod_1.z.string().optional().nullable(),
    points_per_question: zod_1.z.number().min(0, 'Points per question must be positive'),
    negative_marks: zod_1.z.number().min(0, 'Negative penalty must be positive').default(0),
    total_questions: zod_1.z.number().int().min(1, 'Questions count must be greater than 0'),
    sort_order: zod_1.z.number().int().min(1),
    rules: zod_1.z.array(exports.blueprintSectionRuleDTO).default([])
});
exports.blueprintCreateDTOSchema = zod_1.z.object({
    subject_id: zod_1.z.string().uuid('Subject classification ID is required'),
    name: zod_1.z.string().min(1, 'Blueprint name cannot be empty'),
    description: zod_1.z.string().optional().nullable(),
    total_marks: zod_1.z.number().min(1, 'Total marks must be positive').default(100.00),
    difficulty_distribution: zod_1.z.record(zod_1.z.number()).default({}),
    bloom_distribution: zod_1.z.record(zod_1.z.number()).default({}),
    outcome_mapping: zod_1.z.record(zod_1.z.string()).default({}),
    sections: zod_1.z.array(exports.blueprintSectionDTO).default([])
});
exports.blueprintUpdateDTOSchema = exports.blueprintCreateDTOSchema.partial();
exports.blueprintSearchDTOSchema = zod_1.z.object({
    subjectId: zod_1.z.string().uuid().optional(),
    status: zod_1.z.enum(['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED']).optional(),
    page: zod_1.z.number().int().min(1).default(1),
    limit: zod_1.z.number().int().min(1).max(100).default(10)
});
exports.blueprintWorkflowDTOSchema = zod_1.z.object({
    workflow_definition_id: zod_1.z.string().uuid().optional().nullable(),
    target_status: zod_1.z.enum(['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED']),
    transition_reason: zod_1.z.string().optional()
});
exports.blueprintVersionDTOSchema = zod_1.z.object({
    version: zod_1.z.number().int().min(1)
});
exports.blueprintCloneDTOSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Clone name cannot be empty')
});
