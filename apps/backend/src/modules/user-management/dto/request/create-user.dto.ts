import { z } from 'zod';
import { phoneSchema, emailSchema } from '@edutrack/validation';
import { user_status } from '../../constants/user.constants';

export const createUserSchema = z.object({
  org_id: z.string().uuid('Invalid organization ID'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().optional().nullable(),
  email: emailSchema,
  phone: phoneSchema,
  status: z
    .nativeEnum(user_status as any)
    .optional()
    .default(user_status.active as any),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
