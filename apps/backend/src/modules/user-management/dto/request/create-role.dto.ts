import { z } from 'zod';

export const createRoleSchema = z.object({
  org_id: z.string().uuid('Invalid organization ID'),
  role_name: z.string().min(1, 'Role name is required'),
  description: z.string().optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

export type CreateRoleDto = z.infer<typeof createRoleSchema>;
