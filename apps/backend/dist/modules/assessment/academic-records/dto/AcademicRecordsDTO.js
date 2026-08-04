"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.approveGraduationSchema = exports.createStandingRuleSchema = exports.createTranscriptRequestSchema = exports.createAcademicRecordSchema = void 0;
const zod_1 = require("zod");
exports.createAcademicRecordSchema = zod_1.z.object({
    student_id: zod_1.z.string().uuid(),
    cgpa: zod_1.z.number().min(0).max(10),
    total_credits: zod_1.z.number().min(0)
});
exports.createTranscriptRequestSchema = zod_1.z.object({
    student_id: zod_1.z.string().uuid(),
    status: zod_1.z.enum(['Requested', 'Fee Pending', 'Payment Complete', 'Processing', 'Generated', 'Signed', 'Dispatched', 'Delivered']).default('Requested')
});
exports.createStandingRuleSchema = zod_1.z.object({
    min_gpa: zod_1.z.number().min(0).max(10),
    max_backlogs: zod_1.z.number().min(0),
    resulting_status: zod_1.z.enum(['GOOD_STANDING', 'WARNING', 'PROBATION', 'SUSPENSION', 'HONORS'])
});
exports.approveGraduationSchema = zod_1.z.object({
    student_id: zod_1.z.string().uuid(),
    status: zod_1.z.enum(['ELIGIBLE', 'UNDER_REVIEW', 'CLEARANCE_PENDING', 'APPROVED', 'GRADUATED', 'CERTIFICATE_GENERATED', 'ARCHIVED'])
});
