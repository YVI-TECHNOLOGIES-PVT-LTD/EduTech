import { z } from 'zod';
import { user_status } from '../../constants/user.constants';

export const updateUserStatusSchema = z.object({
  status: z.nativeEnum(user_status as any),
});

export type UpdateUserStatusDto = z.infer<typeof updateUserStatusSchema>;
