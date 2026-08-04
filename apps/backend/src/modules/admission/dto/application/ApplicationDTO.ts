import { z } from 'zod';

// ==========================================
// 1. SUB-SECTION SCHEMAS
// ==========================================

export const profileSchema = z.object({
    date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of Birth must be in YYYY-MM-DD format'),
    gender: z.enum(['Male', 'Female', 'Other']),
    blood_group: z.string().trim().nullable().optional(),
    nationality: z.string().trim().nullable().optional(),
    religion: z.string().trim().nullable().optional(),
    category: z.string().trim().nullable().optional(),
    aadhaar: z.string().trim().nullable().optional(),
    photo_url: z.string().trim().nullable().optional(),
    allergies: z.string().trim().nullable().optional(),
    medical_conditions: z.string().trim().nullable().optional(),
    emergency_notes: z.string().trim().nullable().optional()
});

export const parentSchema = z.object({
    father_name: z.string().trim().nullable().optional(),
    mother_name: z.string().trim().nullable().optional(),
    guardian_name: z.string().trim().nullable().optional(),
    guardian_relation: z.string().trim().nullable().optional(),
    father_occupation: z.string().trim().nullable().optional(),
    mother_occupation: z.string().trim().nullable().optional(),
    guardian_occupation: z.string().trim().nullable().optional(),
    father_income: z.number().nullable().optional(),
    mother_income: z.number().nullable().optional(),
    guardian_income: z.number().nullable().optional(),
    father_education: z.string().trim().nullable().optional(),
    mother_education: z.string().trim().nullable().optional(),
    guardian_education: z.string().trim().nullable().optional(),
    father_phone: z.string().trim().nullable().optional(),
    mother_phone: z.string().trim().nullable().optional(),
    guardian_phone: z.string().trim().nullable().optional(),
    father_email: z.string().email().nullable().optional().or(z.literal('')),
    mother_email: z.string().email().nullable().optional().or(z.literal('')),
    guardian_email: z.string().email().nullable().optional().or(z.literal('')),
    father_address: z.string().trim().nullable().optional(),
    mother_address: z.string().trim().nullable().optional(),
    guardian_address: z.string().trim().nullable().optional(),
    emergency_contact: z.string().trim().nullable().optional()
});

export const previousEducationSchema = z.object({
    school_name: z.string().min(1, 'Previous School Name is required').trim(),
    board: z.string().trim().nullable().optional(),
    medium: z.string().trim().nullable().optional(),
    last_class: z.string().trim().nullable().optional(),
    percentage: z.number().nullable().optional(),
    subjects: z.string().trim().nullable().optional(),
    tc_number: z.string().trim().nullable().optional(),
    reason_leaving: z.string().trim().nullable().optional()
});

export const preferencesSchema = z.object({
    need_transport: z.boolean().default(false),
    route_preference: z.string().trim().nullable().optional(),
    pickup_point: z.string().trim().nullable().optional(),
    need_hostel: z.boolean().default(false),
    room_preference: z.string().trim().nullable().optional(),
    special_requirements: z.string().trim().nullable().optional()
});

export const declarationSchema = z.object({
    agreed_to_terms: z.boolean().refine(val => val === true, 'You must agree to the terms to submit'),
    parent_signature: z.string().min(1, 'Parent/Guardian signature is required').trim(),
    date_signed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Signed date must be in YYYY-MM-DD format')
});

// ==========================================
// 2. LIFECYCLE DTO SCHEMAS
// ==========================================

export const createApplicationSchema = z.object({
    lead_id: z.string().uuid('Lead ID must be a valid UUID'),
    grade: z.string().min(1, 'Grade is required').trim()
});

// Incrementally saves sections of the application
export const saveDraftSchema = z.object({
    profile: profileSchema.partial().optional(),
    parents: parentSchema.partial().optional(),
    education: previousEducationSchema.partial().optional(),
    preferences: preferencesSchema.partial().optional(),
    declaration: declarationSchema.partial().optional(),
    change_reason: z.string().trim().nullable().optional()
});

// Required payload for full submission
export const submitApplicationSchema = z.object({
    profile: profileSchema,
    parents: parentSchema.refine(data => {
        // Enforce either parents or guardian is filled
        return !!(data.father_name || data.mother_name || data.guardian_name);
    }, 'Father, Mother or Guardian details must be provided'),
    education: previousEducationSchema.optional(),
    preferences: preferencesSchema.optional(),
    declaration: declarationSchema,
    change_reason: z.string().trim().nullable().optional()
});
