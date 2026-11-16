import { z } from 'zod';

export const searchStaffSchema = z.object({
  searchText: z.string().optional(),
  org_id: z.string().uuid().optional(),
  designation_id: z.string().uuid().optional(),
  department_id: z.string().uuid().optional(),
  role: z.string().optional(),
  role_name: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(50),
  sort: z
    .enum(['created_at', 'updated_at', 'employee_code', 'joining_date'])
    .optional()
    .default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type SearchStaffDto = z.infer<typeof searchStaffSchema>;
