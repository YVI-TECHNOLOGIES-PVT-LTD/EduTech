import { z } from 'zod';
import { admission_decision_status } from '@prisma/client';

export const recordDecisionSchema = z.object({
  decision_status: z.nativeEnum(admission_decision_status),
  decision_date: z.string().optional(),
  decided_by: z.string().uuid().optional().nullable(),
  reason: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  offer_expiry_date: z.string().optional().nullable(),
  waitlist_position: z
    .number()
    .int()
    .min(1, 'Waitlist position must be at least 1')
    .optional()
    .nullable(),
  scholarship_percentage: z
    .number()
    .min(0, 'Scholarship percentage cannot be negative')
    .max(100, 'Scholarship percentage cannot exceed 100')
    .optional()
    .nullable(),
});

export type RecordDecisionDto = z.infer<typeof recordDecisionSchema>;
