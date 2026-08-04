"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFollowupSchema = void 0;
const zod_1 = require("zod");
exports.createFollowupSchema = zod_1.z.object({
    lead_id: zod_1.z.string().uuid('Invalid lead ID'),
    scheduled_date: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Scheduled date must be a valid ISO date string'
    }),
    notes: zod_1.z.string().optional().nullable()
});
