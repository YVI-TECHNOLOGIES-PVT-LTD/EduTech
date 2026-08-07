import { z } from 'zod';

export const updateAcademicYearGradeSchema = z.object({
  intake_capacity: z.coerce.number().int().optional().nullable(),
  is_active: z.boolean().optional(),
});

export type UpdateAcademicYearGradeDto = z.infer<typeof updateAcademicYearGradeSchema>;
