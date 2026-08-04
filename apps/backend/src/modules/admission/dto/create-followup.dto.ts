import { z } from 'zod';

export const createFollowupSchema = z.object({
    lead_id: z.string().uuid('Invalid lead ID'),
    scheduled_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Scheduled date must be a valid ISO date string'
    }),
    notes: z.string().optional().nullable()
});

export type CreateFollowupDto = z.infer<typeof createFollowupSchema>;
