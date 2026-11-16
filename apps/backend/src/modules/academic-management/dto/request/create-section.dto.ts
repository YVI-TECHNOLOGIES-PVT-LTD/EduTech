import { z } from 'zod';

export const createSectionSchema = z.object({
  academic_year_grade_id: z.string().uuid('Invalid academic year grade ID'),
  section_name: z.string().min(1, 'Section name is required'),
  class_teacher_id: z.string().uuid().optional().nullable(),
  room_no: z.string().optional().nullable(),
  capacity: z.coerce.number().int().optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

export type CreateSectionDto = z.infer<typeof createSectionSchema>;
