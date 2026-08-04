import { z } from 'zod';

export const createStudentSchema = z.object({
    admission_no: z.string().min(1, 'Admission number is required').trim(),
    first_name: z.string().min(1, 'First name is required').trim(),
    last_name: z.string().min(1, 'Last name is required').trim(),
    school_id: z.string().uuid('Invalid School ID'),
    academic_year_id: z.string().uuid('Invalid Academic Year ID'),
    user_id: z.string().uuid('Invalid User ID').optional()
});

export const updateStudentSchema = z.object({
    first_name: z.string().min(1).trim().optional(),
    last_name: z.string().min(1).trim().optional(),
    status: z.enum(['NEW', 'ACTIVE', 'PROMOTED', 'SUSPENDED', 'TRANSFERRED', 'LEFT', 'ALUMNI']).optional()
});

export const allocateClassSchema = z.object({
    grade: z.string().min(1, 'Grade is required').trim(),
    section_id: z.string().uuid('Invalid Section ID'),
    roll_number: z.number().int().min(1).optional()
});

export const transferStudentSchema = z.object({
    destination_school: z.string().min(1, 'Destination school is required').trim(),
    reason: z.string().min(1, 'Reason is required').trim()
});

export const promoteStudentSchema = z.object({
    to_academic_year_id: z.string().uuid('Invalid Academic Year ID'),
    to_grade: z.string().min(1, 'Grade is required').trim(),
    to_section_id: z.string().uuid('Invalid Section ID').optional(),
    promotion_reason: z.string().min(1, 'Reason is required').trim()
});

export const generateIdentitySchema = z.object({
    barcode_value: z.string().min(1, 'Barcode is required').trim()
});

export const updateProfileSchema = z.object({
    date_of_birth: z.string().datetime('Invalid Date of Birth').optional(),
    gender: z.string().min(1).optional(),
    blood_group: z.string().nullable().optional(),
    nationality: z.string().nullable().optional(),
    religion: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
    aadhaar: z.string().nullable().optional(),
    photo_url: z.string().nullable().optional(),
    allergies: z.string().nullable().optional(),
    medical_conditions: z.string().nullable().optional(),
    emergency_notes: z.string().nullable().optional()
});
