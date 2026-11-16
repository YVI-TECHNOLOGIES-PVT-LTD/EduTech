import { z } from 'zod';

export const createDesignationSchema = z.object({
  org_id: z.string().uuid('Invalid organization ID'),
  designation_name: z.string().min(1, 'Designation name is required'),
  description: z.string().optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

export type CreateDesignationDto = z.infer<typeof createDesignationSchema>;
