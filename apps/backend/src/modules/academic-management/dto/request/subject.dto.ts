import { z } from 'zod';

export const listSubjectsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  category_id: z.string().uuid().optional(),
  is_active: z
    .union([z.boolean(), z.string()])
    .transform((val) => {
      if (typeof val === 'boolean') return val;
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    })
    .optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(['subject_name', 'subject_code', 'created_at']).default('subject_name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type ListSubjectsInput = z.infer<typeof listSubjectsSchema>;
export type ListSubjectsRawInput = z.input<typeof listSubjectsSchema>;
