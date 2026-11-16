"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEnquirySchema = void 0;
const zod_1 = require("zod");
exports.createEnquirySchema = zod_1.z.object({
    student_name: zod_1.z
        .string()
        .max(100, 'Name must not exceed 100 characters')
        .optional()
        .nullable()
        .transform((val) => (val && val.trim() ? val.trim() : undefined)),
    grade_applied_for: zod_1.z.string().min(1, 'Grade applied for is required'),
    parent_name: zod_1.z.string().min(1, 'Parent name is required'),
    parent_email: zod_1.z
        .string()
        .email('Enter a valid email address')
        .optional()
        .nullable()
        .or(zod_1.z.literal(''))
        .transform((val) => (val && val.trim() ? val.trim() : undefined)),
    parent_phone: zod_1.z
        .string()
        .transform((val) => (val ? String(val).replace(/[\s\-()]/g, '') : ''))
        .refine((val) => /^\+?[0-9]{7,16}$/.test(val), 'Enter a valid phone number (e.g. +919876543210)'),
    source: zod_1.z.string().optional().default('website'),
    date_of_birth: zod_1.z
        .string()
        .optional()
        .nullable()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: 'Date of birth must be a valid date string',
    }),
    gender: zod_1.z.string().optional().nullable(),
    current_school: zod_1.z.string().optional().nullable(),
    address: zod_1.z.string().optional().nullable(),
    remarks: zod_1.z.string().optional().nullable(),
    query_type: zod_1.z.string().optional().nullable(),
    contact_consent: zod_1.z.boolean().optional().default(false),
});
