import { z } from 'zod';

export const listResourcesSchema = z.object({
  search: z.string().trim().max(100).optional(),
  category_id: z.string().uuid().optional(),
  grade_id: z.string().uuid().optional(),
  mime_type: z.string().trim().max(100).optional(),
  resource_type: z.enum(['file', 'external_link']).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort_by: z.enum(['created_at', 'title', 'file_size_bytes']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type ListResourcesDto = z.infer<typeof listResourcesSchema>;
