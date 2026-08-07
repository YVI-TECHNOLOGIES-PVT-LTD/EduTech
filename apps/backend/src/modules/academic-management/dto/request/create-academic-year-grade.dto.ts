import { z } from 'zod';

export const createAcademicYearGradeSchema = z.object({
  academic_year_id: z.string().uuid('Invalid academic year ID'),
  grade_id: z.string().uuid('Invalid grade ID'),
  intake_capacity: z.coerce.number().int().optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

export type CreateAcademicYearGradeDto = z.infer<typeof createAcademicYearGradeSchema>;
