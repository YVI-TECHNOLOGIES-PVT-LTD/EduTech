import { z } from 'zod';

export const completeSessionSchema = z.object({
  ai_summary: z.string().optional().nullable(),
  satisfaction_rating: z.number().int().min(1).max(5).optional().nullable(),
});

export type CompleteSessionDto = z.infer<typeof completeSessionSchema>;
