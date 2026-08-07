import { z } from 'zod';

export const assignDesignationSchema = z.object({
  designation_id: z.string().uuid('Invalid designation ID'),
});

export type AssignDesignationDto = z.infer<typeof assignDesignationSchema>;
