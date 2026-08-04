"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportPaperSchema = exports.createGenerationJobSchema = exports.paperWorkflowSchema = exports.updatePaperSchema = exports.createPaperSchema = void 0;
const zod_1 = require("zod");
exports.createPaperSchema = zod_1.z.object({
    blueprint_id: zod_1.z.string().uuid('Blueprint must be a valid UUID'),
    template_id: zod_1.z.string().uuid('Template must be a valid UUID'),
    subject_id: zod_1.z.string().uuid('Subject must be a valid UUID'),
    name: zod_1.z.string().min(1, 'Paper name is required'),
    description: zod_1.z.string().optional().nullable()
});
exports.updatePaperSchema = exports.createPaperSchema.partial();
exports.paperWorkflowSchema = zod_1.z.object({
    target_status: zod_1.z.enum(['DRAFT', 'GENERATED', 'VALIDATED', 'APPROVED', 'PUBLISHED', 'ARCHIVED', 'CANCELLED']),
    transition_reason: zod_1.z.string().optional()
});
exports.createGenerationJobSchema = zod_1.z.object({
    blueprint_id: zod_1.z.string().uuid('Blueprint must be a valid UUID'),
    template_id: zod_1.z.string().uuid('Template must be a valid UUID')
});
exports.exportPaperSchema = zod_1.z.object({
    format: zod_1.z.enum(['PDF', 'DOCX', 'HTML', 'ZIP']),
    type: zod_1.z.enum(['candidate', 'moderator', 'answer_key'])
});
