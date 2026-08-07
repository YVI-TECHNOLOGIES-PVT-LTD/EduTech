import { z } from 'zod';

export const updateParentSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().optional().nullable(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  occupation: z.string().optional().nullable(),
  user_id: z.string().uuid().optional().nullable(),
});

export type UpdateParentDto = z.infer<typeof updateParentSchema>;
