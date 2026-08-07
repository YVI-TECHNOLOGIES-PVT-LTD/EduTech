import { z } from 'zod';

export const searchParentSchema = z.object({
  searchText: z.string().optional(),
  org_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  sort: z
    .enum(['created_at', 'updated_at', 'first_name', 'phone', 'email'])
    .optional()
    .default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type SearchParentDto = z.infer<typeof searchParentSchema>;
