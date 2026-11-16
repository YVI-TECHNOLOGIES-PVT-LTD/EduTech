import { z } from 'zod';
import { admission_payment_status, admission_payment_mode } from '@prisma/client';

export const recordPaymentSchema = z.object({
  payment_status: z
    .nativeEnum(admission_payment_status)
    .optional()
    .default(admission_payment_status.pending),
  amount: z.number().positive('Amount must be greater than zero').optional(),
  payment_date: z.string().optional().nullable(),
  transaction_reference: z.string().max(100).optional().nullable(),
  payment_mode: z.nativeEnum(admission_payment_mode).optional().nullable(),
  card_name: z.string().max(100).optional().nullable(),
  card_last_four: z.string().max(4).optional().nullable(),
  remarks: z.string().optional().nullable(),
});

export type RecordPaymentDto = z.infer<typeof recordPaymentSchema>;
