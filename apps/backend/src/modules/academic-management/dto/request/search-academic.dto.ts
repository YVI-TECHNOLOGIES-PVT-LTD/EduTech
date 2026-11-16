import { z } from 'zod';

export const searchAcademicSchema = z.object({
  searchText: z.string().optional(),
  org_id: z.string().uuid().optional(),
  academic_year_id: z.string().uuid().optional(),
  grade_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  sort: z.string().optional().default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type SearchAcademicDto = z.infer<typeof searchAcademicSchema>;
