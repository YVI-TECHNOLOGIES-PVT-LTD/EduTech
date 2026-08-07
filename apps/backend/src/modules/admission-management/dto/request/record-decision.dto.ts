import { z } from 'zod';
import { admission_decision_status } from '@prisma/client';

export const recordDecisionSchema = z.object({
  decision_status: z.nativeEnum(admission_decision_status),
  decision_date: z.string().optional(),
  decided_by: z.string().uuid().optional().nullable(),
  reason: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  offer_expiry_date: z.string().optional().nullable(),
  waitlist_position: z.number().int().optional().nullable(),
  scholarship_percentage: z.number().optional().nullable(),
});

export type RecordDecisionDto = z.infer<typeof recordDecisionSchema>;
