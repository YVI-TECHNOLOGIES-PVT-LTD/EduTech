import { z } from 'zod';

export const updateSectionSchema = z.object({
  section_name: z.string().min(1).optional(),
  class_teacher_id: z.string().uuid().optional().nullable(),
  room_no: z.string().optional().nullable(),
  capacity: z.coerce.number().int().optional().nullable(),
  is_active: z.boolean().optional(),
});

export type UpdateSectionDto = z.infer<typeof updateSectionSchema>;
