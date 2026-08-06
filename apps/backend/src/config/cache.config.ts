import { z } from 'zod';

export const CacheConfigSchema = z.object({
  provider: z.enum(['redis', 'memory', 'noop']).default('memory'),
  redisHost: z.string().default('127.0.0.1'),
  redisPort: z.coerce.number().default(6379),
  redisPassword: z.string().optional(),
  redisDb: z.coerce.number().default(0),
  defaultTtlSeconds: z.coerce.number().default(300),
  keyPrefix: z.string().default('edutrack:cache'),
  enabled: z.coerce.boolean().default(true),
  preventStampede: z.coerce.boolean().default(true),
});

export type CacheConfig = z.infer<typeof CacheConfigSchema>;
