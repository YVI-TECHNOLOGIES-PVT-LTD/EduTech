"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitApplicationSchema = exports.saveDraftSchema = exports.createApplicationSchema = exports.declarationSchema = exports.preferencesSchema = exports.previousEducationSchema = exports.parentSchema = exports.profileSchema = void 0;
const zod_1 = require("zod");
// ==========================================
// 1. SUB-SECTION SCHEMAS
// ==========================================
exports.profileSchema = zod_1.z.object({
    date_of_birth: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of Birth must be in YYYY-MM-DD format'),
    gender: zod_1.z.enum(['Male', 'Female', 'Other']),
    blood_group: zod_1.z.string().trim().nullable().optional(),
    nationality: zod_1.z.string().trim().nullable().optional(),
    religion: zod_1.z.string().trim().nullable().optional(),
    category: zod_1.z.string().trim().nullable().optional(),
    aadhaar: zod_1.z.string().trim().nullable().optional(),
    photo_url: zod_1.z.string().trim().nullable().optional(),
    allergies: zod_1.z.string().trim().nullable().optional(),
    medical_conditions: zod_1.z.string().trim().nullable().optional(),
    emergency_notes: zod_1.z.string().trim().nullable().optional(),
});
exports.parentSchema = zod_1.z.object({
    father_name: zod_1.z.string().trim().nullable().optional(),
    mother_name: zod_1.z.string().trim().nullable().optional(),
    guardian_name: zod_1.z.string().trim().nullable().optional(),
    guardian_relation: zod_1.z.string().trim().nullable().optional(),
    father_occupation: zod_1.z.string().trim().nullable().optional(),
    mother_occupation: zod_1.z.string().trim().nullable().optional(),
    guardian_occupation: zod_1.z.string().trim().nullable().optional(),
    father_income: zod_1.z.number().nullable().optional(),
    mother_income: zod_1.z.number().nullable().optional(),
    guardian_income: zod_1.z.number().nullable().optional(),
    father_education: zod_1.z.string().trim().nullable().optional(),
    mother_education: zod_1.z.string().trim().nullable().optional(),
    guardian_education: zod_1.z.string().trim().nullable().optional(),
    father_phone: zod_1.z.string().trim().nullable().optional(),
    mother_phone: zod_1.z.string().trim().nullable().optional(),
    guardian_phone: zod_1.z.string().trim().nullable().optional(),
    father_email: zod_1.z.string().email().nullable().optional().or(zod_1.z.literal('')),
    mother_email: zod_1.z.string().email().nullable().optional().or(zod_1.z.literal('')),
    guardian_email: zod_1.z.string().email().nullable().optional().or(zod_1.z.literal('')),
    father_address: zod_1.z.string().trim().nullable().optional(),
    mother_address: zod_1.z.string().trim().nullable().optional(),
    guardian_address: zod_1.z.string().trim().nullable().optional(),
    emergency_contact: zod_1.z.string().trim().nullable().optional(),
});
exports.previousEducationSchema = zod_1.z.object({
    school_name: zod_1.z.string().min(1, 'Previous School Name is required').trim(),
    board: zod_1.z.string().trim().nullable().optional(),
    medium: zod_1.z.string().trim().nullable().optional(),
    last_class: zod_1.z.string().trim().nullable().optional(),
    percentage: zod_1.z.number().nullable().optional(),
    subjects: zod_1.z.string().trim().nullable().optional(),
    tc_number: zod_1.z.string().trim().nullable().optional(),
    reason_leaving: zod_1.z.string().trim().nullable().optional(),
});
exports.preferencesSchema = zod_1.z.object({
    need_transport: zod_1.z.boolean().default(false),
    route_preference: zod_1.z.string().trim().nullable().optional(),
    pickup_point: zod_1.z.string().trim().nullable().optional(),
    need_hostel: zod_1.z.boolean().default(false),
    room_preference: zod_1.z.string().trim().nullable().optional(),
    special_requirements: zod_1.z.string().trim().nullable().optional(),
});
exports.declarationSchema = zod_1.z.object({
    agreed_to_terms: zod_1.z
        .boolean()
        .refine((val) => val === true, 'You must agree to the terms to submit'),
    parent_signature: zod_1.z.string().min(1, 'Parent/Guardian signature is required').trim(),
    date_signed: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Signed date must be in YYYY-MM-DD format'),
});
// ==========================================
// 2. LIFECYCLE DTO SCHEMAS
// ==========================================
exports.createApplicationSchema = zod_1.z.object({
    lead_id: zod_1.z.string().optional(),
    grade: zod_1.z.string().optional().default('Grade 1'),
});
// Incrementally saves sections of the application
exports.saveDraftSchema = zod_1.z.object({
    profile: exports.profileSchema.partial().optional(),
    parents: exports.parentSchema.partial().optional(),
    education: exports.previousEducationSchema.partial().optional(),
    preferences: exports.preferencesSchema.partial().optional(),
    declaration: exports.declarationSchema.partial().optional(),
    change_reason: zod_1.z.string().trim().nullable().optional(),
});
// Required payload for full submission
exports.submitApplicationSchema = zod_1.z.object({
    profile: exports.profileSchema,
    parents: exports.parentSchema.refine((data) => {
        // Enforce either parents or guardian is filled
        return !!(data.father_name || data.mother_name || data.guardian_name);
    }, 'Father, Mother or Guardian details must be provided'),
    education: exports.previousEducationSchema.optional(),
    preferences: exports.preferencesSchema.optional(),
    declaration: exports.declarationSchema,
    change_reason: zod_1.z.string().trim().nullable().optional(),
});
