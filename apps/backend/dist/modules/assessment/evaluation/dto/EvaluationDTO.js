"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gradeCalculateSchema = exports.createRubricSchema = exports.revaluationSchema = exports.moderateSchema = exports.evaluateQuestionSchema = exports.startEvaluationSchema = void 0;
const zod_1 = require("zod");
exports.startEvaluationSchema = zod_1.z.object({
    assignment_id: zod_1.z.string().uuid('Assignment ID must be a valid UUID').optional(),
    published_paper_id: zod_1.z.string().uuid('Published Paper ID must be a valid UUID'),
    attempt_id: zod_1.z.string().uuid('Attempt ID must be a valid UUID')
});
exports.evaluateQuestionSchema = zod_1.z.object({
    question_snapshot_id: zod_1.z.string().uuid('Question Snapshot ID must be a valid UUID'),
    awarded_marks: zod_1.z.number().min(0, 'Awarded marks cannot be negative'),
    maximum_marks: zod_1.z.number().gt(0, 'Maximum marks must be greater than zero'),
    remarks: zod_1.z.string().optional().nullable(),
    annotations: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.enum(['Highlight', 'Rectangle', 'Circle', 'Arrow', 'Strike', 'Underline', 'Sticky Note', 'Text Comment', 'Drawing', 'Freehand Pen']),
        coordinates: zod_1.z.record(zod_1.z.any()),
        comment_text: zod_1.z.string().optional().nullable()
    })).optional()
});
exports.moderateSchema = zod_1.z.object({
    moderator_marks: zod_1.z.number().min(0, 'Marks cannot be negative'),
    status: zod_1.z.enum(['PENDING', 'RESOLVED', 'REJECTED']),
    remarks: zod_1.z.string().optional().nullable()
});
exports.revaluationSchema = zod_1.z.object({
    attempt_id: zod_1.z.string().uuid(),
    student_id: zod_1.z.string().uuid(),
    reason: zod_1.z.string().min(1, 'Reason is required')
});
exports.createRubricSchema = zod_1.z.object({
    question_snapshot_id: zod_1.z.string().uuid(),
    total_score: zod_1.z.number().default(100),
    template_id: zod_1.z.string().uuid().optional().nullable(),
    criteria: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string().min(1, 'Name is required'),
        weight: zod_1.z.number().gt(0),
        description: zod_1.z.string().optional().nullable(),
        criteria_levels: zod_1.z.array(zod_1.z.any()).default([])
    }))
});
exports.gradeCalculateSchema = zod_1.z.object({
    attempt_id: zod_1.z.string().uuid(),
    raw_marks: zod_1.z.number().min(0),
    scaled_marks: zod_1.z.number().min(0),
    grace_marks: zod_1.z.number().min(0).default(0),
    grade_label: zod_1.z.string().min(1),
    grade_point: zod_1.z.number().min(0),
    credits: zod_1.z.number().int().min(0)
});
