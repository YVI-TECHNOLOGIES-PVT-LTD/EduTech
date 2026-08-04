"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.templateCloneSchema = exports.templateWorkflowSchema = exports.updateTemplateSchema = exports.createTemplateSchema = exports.templateSectionSchema = exports.templateRuleSchema = exports.templateLayoutRuleSchema = exports.templateFooterSchema = exports.templateHeaderSchema = void 0;
const zod_1 = require("zod");
exports.templateHeaderSchema = zod_1.z.object({
    institution_logo: zod_1.z.boolean().default(true),
    school_name: zod_1.z.boolean().default(true),
    exam_name: zod_1.z.boolean().default(true),
    subject: zod_1.z.boolean().default(true),
    class: zod_1.z.boolean().default(true),
    academic_year: zod_1.z.boolean().default(true),
    exam_date: zod_1.z.boolean().default(true),
    duration: zod_1.z.boolean().default(true),
    max_marks: zod_1.z.boolean().default(true),
    student_name: zod_1.z.boolean().default(true),
    hall_ticket: zod_1.z.boolean().default(true),
    signature_block: zod_1.z.boolean().default(true),
    qr_code: zod_1.z.boolean().default(false),
    barcode: zod_1.z.boolean().default(false)
});
exports.templateFooterSchema = zod_1.z.object({
    invigilator_signature: zod_1.z.boolean().default(true),
    chief_superintendent: zod_1.z.boolean().default(true),
    generated_timestamp: zod_1.z.boolean().default(true),
    page_number: zod_1.z.boolean().default(true),
    confidential_watermark: zod_1.z.boolean().default(false),
    qr_verification: zod_1.z.boolean().default(false),
    instructions_footer: zod_1.z.boolean().default(true)
});
exports.templateLayoutRuleSchema = zod_1.z.object({
    property: zod_1.z.string().min(1),
    value: zod_1.z.string().min(1)
});
exports.templateRuleSchema = zod_1.z.object({
    filter_field: zod_1.z.enum(['difficulty', 'bloom_level', 'tags', 'course_outcome', 'program_outcome']),
    filter_value: zod_1.z.string().min(1, 'Filter value is required'),
    match_operator: zod_1.z.enum(['eq', 'in', 'like']).default('eq')
});
exports.templateSectionSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    section_name: zod_1.z.string().min(1, 'Section name is required'),
    description: zod_1.z.string().optional().nullable(),
    points_per_question: zod_1.z.number().min(0).default(1.00),
    negative_marks: zod_1.z.number().min(0).default(0.00),
    total_questions: zod_1.z.number().int().min(1),
    sort_order: zod_1.z.number().int().min(1),
    rules: zod_1.z.array(exports.templateRuleSchema).default([])
});
exports.createTemplateSchema = zod_1.z.object({
    subject_id: zod_1.z.string().uuid('Subject must be a valid UUID'),
    blueprint_id: zod_1.z.string().uuid('Blueprint ID must be a valid UUID').optional().nullable(),
    name: zod_1.z.string().min(1, 'Template name is required'),
    description: zod_1.z.string().optional().nullable(),
    instructions: zod_1.z.string().optional().default(''),
    header: exports.templateHeaderSchema.optional(),
    footer: exports.templateFooterSchema.optional(),
    layoutRules: zod_1.z.array(exports.templateLayoutRuleSchema).optional(),
    sections: zod_1.z.array(exports.templateSectionSchema).default([])
});
exports.updateTemplateSchema = exports.createTemplateSchema.partial();
exports.templateWorkflowSchema = zod_1.z.object({
    target_status: zod_1.z.enum(['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED']),
    transition_reason: zod_1.z.string().optional()
});
exports.templateCloneSchema = zod_1.z.object({
    name: zod_1.z.string().min(1)
});
