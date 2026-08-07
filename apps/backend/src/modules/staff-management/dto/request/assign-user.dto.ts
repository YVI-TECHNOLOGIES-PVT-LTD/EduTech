import { z } from 'zod';

export const assignUserSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
});

export type AssignUserDto = z.infer<typeof assignUserSchema>;
