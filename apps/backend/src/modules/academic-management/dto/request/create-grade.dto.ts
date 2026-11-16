import { z } from 'zod';

export const createGradeSchema = z.object({
  org_id: z.string().uuid('Invalid organization ID').optional(),
  grade_code: z
    .string({ required_error: 'Grade code is required' })
    .trim()
    .min(1, 'Grade code cannot be empty')
    .max(20, 'Grade code must not exceed 20 characters'),
  grade_name: z
    .string({ required_error: 'Grade name is required' })
    .trim()
    .min(1, 'Grade name cannot be empty')
    .max(50, 'Grade name must not exceed 50 characters'),
  board: z
    .string()
    .trim()
    .max(50, 'Board must not exceed 50 characters')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  display_order: z.coerce.number().int().min(0).default(1),
  is_active: z.boolean().optional().default(true),
});

export type CreateGradeDto = z.input<typeof createGradeSchema> & {
  org_id: string;
};
