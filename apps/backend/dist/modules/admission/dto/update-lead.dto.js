"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLeadSchema = void 0;
const zod_1 = require("zod");
exports.updateLeadSchema = zod_1.z.object({
    status: zod_1.z.enum(['NEW', 'CONTACTED', 'FOLLOW_UP', 'VISITED', 'INTERESTED', 'NOT_INTERESTED', 'LOST'], {
        errorMap: () => ({ message: 'Invalid lead status for CRM lifecycle' })
    }).optional(),
    counselor_id: zod_1.z.string().uuid('Invalid counselor ID').optional().nullable(),
    lost_reason: zod_1.z.string().optional().nullable(),
    updated_at: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'updated_at timestamp is required for optimistic locking checks'
    })
});
