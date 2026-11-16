import { z } from 'zod';

export const updateGradeSchema = z.object({
  grade_code: z.string().min(1).optional(),
  grade_name: z.string().min(1).optional(),
  board: z.string().optional().nullable(),
  display_order: z.coerce.number().int().optional(),
  is_active: z.boolean().optional(),
});

export type UpdateGradeDto = z.infer<typeof updateGradeSchema>;
