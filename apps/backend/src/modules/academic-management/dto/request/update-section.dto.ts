import { z } from 'zod';

export const updateSectionSchema = z.object({
  section_name: z
    .string()
    .trim()
    .min(1, 'Section name cannot be empty')
    .max(20, 'Section name must not exceed 20 characters')
    .optional(),
  class_teacher_id: z.string().uuid('Invalid staff UUID').optional().nullable(),
  room_no: z
    .string()
    .trim()
    .max(30, 'Room number must not exceed 30 characters')
    .optional()
    .nullable(),
  capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1').optional().nullable(),
  is_active: z.boolean().optional(),
});

export type UpdateSectionDto = z.infer<typeof updateSectionSchema>;
