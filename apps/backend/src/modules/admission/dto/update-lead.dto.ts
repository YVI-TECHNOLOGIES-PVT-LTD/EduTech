import { z } from 'zod';

export const updateLeadSchema = z.object({
    status: z.enum(['NEW', 'CONTACTED', 'FOLLOW_UP', 'VISITED', 'INTERESTED', 'NOT_INTERESTED', 'LOST'], {
        errorMap: () => ({ message: 'Invalid lead status for CRM lifecycle' })
    }).optional(),
    counselor_id: z.string().uuid('Invalid counselor ID').optional().nullable(),
    lost_reason: z.string().optional().nullable(),
    updated_at: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'updated_at timestamp is required for optimistic locking checks'
    })
});

export type UpdateLeadDto = z.infer<typeof updateLeadSchema>;
