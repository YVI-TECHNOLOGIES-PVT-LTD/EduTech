import { z } from 'zod';

export const createParentSchema = z.object({
  org_id: z.string().uuid('Invalid organization ID'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().optional().nullable(),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email address').optional().nullable(),
  occupation: z.string().optional().nullable(),
  user_id: z.string().uuid().optional().nullable(),
});

export type CreateParentDto = z.infer<typeof createParentSchema>;
