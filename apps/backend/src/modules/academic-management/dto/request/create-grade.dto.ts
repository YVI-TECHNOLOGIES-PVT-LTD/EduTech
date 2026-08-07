import { z } from 'zod';

export const createGradeSchema = z.object({
  org_id: z.string().uuid('Invalid organization ID'),
  grade_code: z.string().min(1, 'Grade code is required'),
  grade_name: z.string().min(1, 'Grade name is required'),
  board: z.string().optional().nullable(),
  display_order: z.coerce.number().int().default(1),
  is_active: z.boolean().optional().default(true),
});

export type CreateGradeDto = z.infer<typeof createGradeSchema>;
