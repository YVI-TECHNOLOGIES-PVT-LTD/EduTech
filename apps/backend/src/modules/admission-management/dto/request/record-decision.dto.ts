import { z } from 'zod';
import { admission_decision_status } from '@prisma/client';

export const recordDecisionSchema = z.object({
  decision_status: z.nativeEnum(admission_decision_status),
  decision_date: z.string().optional().nullable().or(z.literal('')),
  decided_by: z.string().uuid().optional().nullable().or(z.literal('')),
  reason: z.string().optional().nullable().or(z.literal('')),
  remarks: z.string().optional().nullable().or(z.literal('')),
  offer_expiry_date: z.string().optional().nullable().or(z.literal('')),
  waitlist_position: z
    .union([z.number().int().min(1, 'Waitlist position must be at least 1'), z.string()])
    .optional()
    .nullable()
    .transform((val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const num = typeof val === 'string' ? parseInt(val, 10) : val;
      return isNaN(num) ? undefined : num;
    }),
  scholarship_percentage: z
    .union([z.number().min(0).max(100), z.string()])
    .optional()
    .nullable()
    .transform((val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? undefined : num;
    }),
});

export type RecordDecisionDto = z.infer<typeof recordDecisionSchema>;
