import { z } from 'zod';

export const updateResourceSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title cannot be blank')
    .max(200, 'Title must not exceed 200 characters')
    .optional(),
  description: z
    .string()
    .trim()
    .max(5000, 'Description must not exceed 5000 characters')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  category_id: z
    .string()
    .uuid('Category ID must be a valid UUID')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  resource_status: z.enum(['draft', 'published', 'archived']).optional(),
  grade_ids: z.array(z.string().uuid('Each grade ID must be a valid UUID')).optional(),
});

export type UpdateResourceDto = z.infer<typeof updateResourceSchema>;
