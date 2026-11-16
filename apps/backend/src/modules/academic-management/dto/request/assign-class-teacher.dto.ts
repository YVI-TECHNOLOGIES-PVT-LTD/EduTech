import { z } from 'zod';

export const assignClassTeacherSchema = z.object({
  staff_id: z.string().uuid('Invalid staff UUID').nullable().optional(),
});

export type AssignClassTeacherDto = z.infer<typeof assignClassTeacherSchema>;
