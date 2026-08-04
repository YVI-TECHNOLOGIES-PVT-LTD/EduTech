import { z } from 'zod';

export const createEnquirySchema = z.object({
    student_name: z.string()
        .min(2, 'Name must contain at least 2 characters')
        .max(100, 'Name must not exceed 100 characters')
        .regex(/^[A-Za-z ]+$/, 'Name must contain letters only'),
    grade_applied_for: z.string().min(1, 'Grade applied for is required'),
    parent_name: z.string().min(2, 'Parent name must contain at least 2 characters'),
    parent_email: z.string().email('Enter a valid email address'),
    parent_phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Enter a valid phone number with country code (e.g. +919876543210)'),
    source: z.enum(['Website', 'Phone', 'Walk-in', 'Campaign', 'Referral'], {
        errorMap: () => ({ message: 'Invalid lead source' })
    }),
    date_of_birth: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Date of birth must be a valid date string'
    }).optional().nullable(),
    gender: z.string().optional().nullable(),
    current_school: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    remarks: z.string().optional().nullable()
});

export type CreateEnquiryDto = z.infer<typeof createEnquirySchema>;
