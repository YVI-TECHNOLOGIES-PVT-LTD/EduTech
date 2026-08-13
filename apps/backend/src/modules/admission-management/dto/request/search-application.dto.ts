import { z } from 'zod';
import { application_status } from '@prisma/client';

export const searchApplicationSchema = z.object({
  searchText: z.string().optional(),
  status: z.nativeEnum(application_status).optional(),
  academic_year_id: z.string().uuid().optional(),
  org_id: z.string().uuid().optional(),
  created_by: z.string().uuid().optional(),
  mine: z.coerce.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  sort: z
    .enum(['created_at', 'updated_at', 'application_number', 'status'])
    .optional()
    .default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type SearchApplicationDto = z.infer<typeof searchApplicationSchema>;
