import { z } from 'zod';

export const FeatureFlagConfigSchema = z.object({
  provider: z.enum(['local', 'redis', 'memory', 'noop']).default('local'),
  cacheTtlSeconds: z.coerce.number().default(300), // 5 min cache
  defaultFallback: z.coerce.boolean().default(false),
  enableAuditLog: z.coerce.boolean().default(true),
});

export type FeatureFlagConfig = z.infer<typeof FeatureFlagConfigSchema>;
