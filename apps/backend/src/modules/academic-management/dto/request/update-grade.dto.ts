import { z } from 'zod';

export const updateGradeSchema = z.object({
  grade_code: z
    .string()
    .trim()
    .min(1, 'Grade code cannot be empty')
    .max(20, 'Grade code must not exceed 20 characters')
    .optional(),
  grade_name: z
    .string()
    .trim()
    .min(1, 'Grade name cannot be empty')
    .max(50, 'Grade name must not exceed 50 characters')
    .optional(),
  board: z
    .string()
    .trim()
    .max(50, 'Board must not exceed 50 characters')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  display_order: z.coerce.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

export type UpdateGradeDto = z.infer<typeof updateGradeSchema>;
