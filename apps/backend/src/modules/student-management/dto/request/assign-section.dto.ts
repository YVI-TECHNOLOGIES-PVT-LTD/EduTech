import { z } from 'zod';

export const assignSectionSchema = z.object({
  section_id: z.string().uuid('Invalid section ID'),
  roll_number: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

export type AssignSectionDto = z.infer<typeof assignSectionSchema>;
