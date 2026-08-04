"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signResultsSchema = exports.promotionDecisionSchema = exports.publishResultsSchema = exports.transitionWorkflowSchema = exports.calculateResultsSchema = exports.createSessionSchema = void 0;
const zod_1 = require("zod");
exports.createSessionSchema = zod_1.z.object({
    academic_year_id: zod_1.z.string().uuid('Academic Year must be a valid UUID'),
    term_id: zod_1.z.string().uuid('Term must be a valid UUID')
});
exports.calculateResultsSchema = zod_1.z.object({
    session_id: zod_1.z.string().uuid('Session ID must be a valid UUID')
});
exports.transitionWorkflowSchema = zod_1.z.object({
    target_status: zod_1.z.enum(['DRAFT', 'CALCULATED', 'UNDER_VERIFICATION', 'APPROVED', 'PUBLISHED', 'LOCKED']),
    comments: zod_1.z.string().optional().nullable()
});
exports.publishResultsSchema = zod_1.z.object({
    target_portal: zod_1.z.enum(['STUDENT_PORTAL', 'PARENT_PORTAL', 'PUBLIC_WEBSITE', 'MOBILE_APP'])
});
exports.promotionDecisionSchema = zod_1.z.object({
    student_id: zod_1.z.string().uuid(),
    academic_year_id: zod_1.z.string().uuid(),
    decision: zod_1.z.enum([
        'PASS', 'PROMOTED', 'PROMOTED WITH BACKLOG', 'COMPARTMENT', 'REPEAT',
        'WITHHELD', 'MALPRACTICE', 'TRANSFERRED', 'INCOMPLETE'
    ]),
    remarks: zod_1.z.string().optional().nullable()
});
exports.signResultsSchema = zod_1.z.object({
    principal_signature: zod_1.z.string().optional().nullable(),
    coe_signature: zod_1.z.string().optional().nullable(),
    director_signature: zod_1.z.string().optional().nullable()
});
