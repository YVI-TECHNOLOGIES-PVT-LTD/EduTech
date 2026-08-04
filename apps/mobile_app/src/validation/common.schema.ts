import { z } from 'zod';

export const searchSchema = z.object({
  query: z.string().optional(),
});

export type SearchFormData = z.infer<typeof searchSchema>;
