import { z } from 'zod';

export const createSectionSchema = z.object({
  academic_year_grade_id: z.string().uuid('Invalid academic year grade ID'),
  section_name: z
    .string({ required_error: 'Section name is required' })
    .trim()
    .min(1, 'Section name cannot be empty')
    .max(20, 'Section name must not exceed 20 characters'),
  class_teacher_id: z.string().uuid('Invalid staff UUID').optional().nullable(),
  room_no: z
    .string()
    .trim()
    .max(30, 'Room number must not exceed 30 characters')
    .optional()
    .nullable(),
  capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1').optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

export type CreateSectionDto = z.input<typeof createSectionSchema>;
