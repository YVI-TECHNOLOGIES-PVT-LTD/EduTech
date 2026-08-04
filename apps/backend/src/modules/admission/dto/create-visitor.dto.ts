import { z } from 'zod';

export const createVisitorSchema = z.object({
    visitor_name: z.string().min(2, 'Visitor name must contain at least 2 characters'),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Enter a valid phone number'),
    purpose: z.string().min(1, 'Purpose of visit is required'),
    lead_id: z.string().uuid('Invalid lead ID').optional().nullable(),
    counselor_id: z.string().uuid('Invalid counselor ID').optional().nullable(),
    remarks: z.string().optional().nullable(),
    visit_type: z.enum(['Walk-in', 'Campus Tour', 'Meeting', 'Admission Inquiry', 'Parent Meeting'], {
        errorMap: () => ({ message: 'Invalid visit type' })
    })
});

export type CreateVisitorDto = z.infer<typeof createVisitorSchema>;
