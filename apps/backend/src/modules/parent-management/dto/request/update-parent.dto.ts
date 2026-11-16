import { z } from 'zod';
import { optionalPhoneSchema, optionalEmailSchema } from '@edutrack/validation';

export const updateParentSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().optional().nullable(),
  phone: optionalPhoneSchema.optional(),
  email: optionalEmailSchema.optional(),
  occupation: z.string().optional().nullable(),
  user_id: z.string().uuid().optional().nullable(),
});

export type UpdateParentDto = z.infer<typeof updateParentSchema>;
