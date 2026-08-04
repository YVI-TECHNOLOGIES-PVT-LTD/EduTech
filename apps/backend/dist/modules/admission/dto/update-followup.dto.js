"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFollowupSchema = void 0;
const zod_1 = require("zod");
exports.updateFollowupSchema = zod_1.z.object({
    status: zod_1.z.enum(['scheduled', 'completed', 'missed', 'cancelled'], {
        errorMap: () => ({ message: 'Invalid followup status' })
    }).optional(),
    notes: zod_1.z.string().optional().nullable(),
    completed_date: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Completed date must be a valid ISO date string'
    }).optional().nullable()
});
