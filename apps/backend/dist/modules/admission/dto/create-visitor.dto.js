"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVisitorSchema = void 0;
const zod_1 = require("zod");
exports.createVisitorSchema = zod_1.z.object({
    visitor_name: zod_1.z.string().min(2, 'Visitor name must contain at least 2 characters'),
    phone: zod_1.z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Enter a valid phone number'),
    purpose: zod_1.z.string().min(1, 'Purpose of visit is required'),
    lead_id: zod_1.z.string().uuid('Invalid lead ID').optional().nullable(),
    counselor_id: zod_1.z.string().uuid('Invalid counselor ID').optional().nullable(),
    remarks: zod_1.z.string().optional().nullable(),
    visit_type: zod_1.z.enum(['Walk-in', 'Campus Tour', 'Meeting', 'Admission Inquiry', 'Parent Meeting'], {
        errorMap: () => ({ message: 'Invalid visit type' })
    })
});
