import { z } from 'zod';
import { admission_payment_status } from '@prisma/client';

export const recordPaymentSchema = z.object({
  payment_status: z
    .nativeEnum(admission_payment_status)
    .optional()
    .default(admission_payment_status.pending),
  amount: z.number().positive('Amount must be greater than zero'),
  payment_date: z.string().optional().nullable(),
  transaction_reference: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

export type RecordPaymentDto = z.infer<typeof recordPaymentSchema>;
