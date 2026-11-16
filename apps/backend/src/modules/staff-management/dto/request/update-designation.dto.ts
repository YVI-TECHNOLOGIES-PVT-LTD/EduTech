import { z } from 'zod';

export const updateDesignationSchema = z.object({
  designation_name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

export type UpdateDesignationDto = z.infer<typeof updateDesignationSchema>;
