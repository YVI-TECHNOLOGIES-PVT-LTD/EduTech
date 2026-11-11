import { z } from 'zod';

export const createResourceSchema = z
  .object({
    title: z
      .string({ required_error: 'Title is required' })
      .trim()
      .min(1, 'Title cannot be blank')
      .max(200, 'Title must not exceed 200 characters'),
    description: z
      .string()
      .trim()
      .max(5000, 'Description must not exceed 5000 characters')
      .optional()
      .nullable()
      .transform((val) => (val === '' ? null : val)),
    resource_type: z.enum(['file', 'external_link']).default('file'),
    external_url: z
      .string()
      .trim()
      .url('Invalid URL format')
      .regex(/^https?:\/\/[^\s/$.?#].[^\s]*$/, 'URL must be a valid HTTP/HTTPS web address')
      .max(2048, 'URL must not exceed 2048 characters')
      .optional()
      .nullable()
      .transform((val) => (val === '' ? null : val)),
    category_id: z
      .string()
      .uuid('Category ID must be a valid UUID')
      .optional()
      .nullable()
      .transform((val) => (val === '' ? null : val)),
    uploaded_by_staff_id: z
      .string()
      .uuid('Uploaded by staff ID must be a valid UUID')
      .optional()
      .nullable()
      .transform((val) => (val === '' ? null : val)),
    resource_status: z.enum(['draft', 'published', 'archived']).default('draft'),
    grade_ids: z
      .union([
        z.array(z.string().uuid('Each grade ID must be a valid UUID')),
        z.string().transform((val) => {
          if (!val) return [];
          try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) ? parsed : [val];
          } catch {
            return val
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);
          }
        }),
      ])
      .optional()
      .default([]),
  })
  .refine(
    (data) => {
      if (data.resource_type === 'external_link') {
        return !!data.external_url;
      }
      return true;
    },
    {
      message: 'external_url is required when resource_type is external_link',
      path: ['external_url'],
    },
  );

export type CreateResourceDto = z.infer<typeof createResourceSchema>;
export type CreateResourceInput = z.input<typeof createResourceSchema>;
