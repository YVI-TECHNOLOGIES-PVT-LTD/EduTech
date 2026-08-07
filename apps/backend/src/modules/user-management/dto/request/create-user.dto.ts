import { z } from 'zod';
import { user_status } from '../../constants/user.constants';

export const createUserSchema = z.object({
  org_id: z.string().uuid('Invalid organization ID'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().optional().nullable(),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  status: z.nativeEnum(user_status as any).optional().default(user_status.active as any),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
