import { z } from 'zod';

export const updateFollowupSchema = z.object({
    status: z.enum(['scheduled', 'completed', 'missed', 'cancelled'], {
        errorMap: () => ({ message: 'Invalid followup status' })
    }).optional(),
    notes: z.string().optional().nullable(),
    completed_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Completed date must be a valid ISO date string'
    }).optional().nullable()
});

export type UpdateFollowupDto = z.infer<typeof updateFollowupSchema>;
