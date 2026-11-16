import { z } from 'zod';

export const createStaffSchema = z.object({
  org_id: z.string().uuid('Invalid organization ID'),
  user_id: z.string().uuid('Invalid user ID'),
  employee_code: z.string().min(1, 'Employee code is required'),
  designation_id: z.string().uuid().optional().nullable(),
  department_id: z.string().uuid().optional().nullable(),
  joining_date: z.string().optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

export type CreateStaffDto = z.infer<typeof createStaffSchema>;
