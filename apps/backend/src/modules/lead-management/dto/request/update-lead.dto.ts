import { z } from 'zod';
import { createLeadSchema } from './create-lead.dto';

export const updateLeadSchema = createLeadSchema.partial().extend({
  lost_reason: z.string().optional().nullable(),
  ai_lead_score: z.number().optional().nullable(),
});

export type UpdateLeadDto = z.infer<typeof updateLeadSchema>;
