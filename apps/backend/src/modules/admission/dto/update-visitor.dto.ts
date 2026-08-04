import { z } from 'zod';

export const updateVisitorSchema = z.object({
    time_out: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'time_out must be a valid ISO date string'
    }).optional(),
    visit_outcome: z.string().optional().nullable(),
    remarks: z.string().optional().nullable()
});

export type UpdateVisitorDto = z.infer<typeof updateVisitorSchema>;
