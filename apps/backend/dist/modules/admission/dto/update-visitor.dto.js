"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVisitorSchema = void 0;
const zod_1 = require("zod");
exports.updateVisitorSchema = zod_1.z.object({
    time_out: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'time_out must be a valid ISO date string'
    }).optional(),
    visit_outcome: zod_1.z.string().optional().nullable(),
    remarks: zod_1.z.string().optional().nullable()
});
