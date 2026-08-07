import { z } from 'zod';

export const updateRoleSchema = z.object({
  role_name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

export type UpdateRoleDto = z.infer<typeof updateRoleSchema>;
