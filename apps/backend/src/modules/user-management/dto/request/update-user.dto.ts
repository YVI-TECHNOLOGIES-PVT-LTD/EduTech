import { z } from 'zod';
import { optionalPhoneSchema, optionalEmailSchema } from '@edutrack/validation';

export const updateUserSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().optional().nullable(),
  email: optionalEmailSchema.optional(),
  phone: optionalPhoneSchema.optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
