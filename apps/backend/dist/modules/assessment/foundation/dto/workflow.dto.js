"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWorkflowSchema = exports.createWorkflowSchema = exports.createWorkflowTransitionSchema = exports.createWorkflowStepSchema = void 0;
const zod_1 = require("zod");
exports.createWorkflowStepSchema = zod_1.z.object({
    step_name: zod_1.z.string().min(1, 'Step name is required'),
    role_required: zod_1.z.string().min(1, 'Role required is required'),
    sort_order: zod_1.z.number().int().min(1, 'Sort order must be greater than or equal to 1')
});
exports.createWorkflowTransitionSchema = zod_1.z.object({
    from_status: zod_1.z.string().min(1, 'From status is required'),
    to_status: zod_1.z.string().min(1, 'To status is required'),
    rule_condition: zod_1.z.string().nullable().optional()
});
exports.createWorkflowSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Workflow name is required'),
    description: zod_1.z.string().optional().nullable(),
    is_active: zod_1.z.boolean().default(true),
    steps: zod_1.z.array(exports.createWorkflowStepSchema).min(1, 'At least one step is required'),
    transitions: zod_1.z.array(exports.createWorkflowTransitionSchema).optional()
});
exports.updateWorkflowSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Workflow name is required').optional(),
    description: zod_1.z.string().optional().nullable(),
    is_active: zod_1.z.boolean().optional(),
    steps: zod_1.z.array(exports.createWorkflowStepSchema).optional(),
    transitions: zod_1.z.array(exports.createWorkflowTransitionSchema).optional()
});
