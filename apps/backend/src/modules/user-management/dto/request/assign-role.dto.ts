import { z } from 'zod';

export const assignRoleSchema = z.object({
  role_id: z.string().uuid('Invalid role ID'),
});

export type AssignRoleDto = z.infer<typeof assignRoleSchema>;
