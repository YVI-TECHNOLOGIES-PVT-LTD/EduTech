import { z } from 'zod';

export const updateStaffSchema = z.object({
  employee_code: z.string().min(1).optional(),
  designation_id: z.string().uuid().optional().nullable(),
  department_id: z.string().uuid().optional().nullable(),
  joining_date: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

export type UpdateStaffDto = z.infer<typeof updateStaffSchema>;
