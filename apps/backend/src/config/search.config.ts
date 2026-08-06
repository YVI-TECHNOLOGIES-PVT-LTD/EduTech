import { z } from 'zod';

export const SearchConfigSchema = z.object({
  provider: z.enum(['postgres', 'elasticsearch', 'memory', 'noop']).default('memory'),
  defaultLimit: z.coerce.number().default(20),
  maxLimit: z.coerce.number().default(100),
  enableSuggestions: z.coerce.boolean().default(true),
  highlightTag: z.string().default('mark'),
});

export type SearchConfig = z.infer<typeof SearchConfigSchema>;
