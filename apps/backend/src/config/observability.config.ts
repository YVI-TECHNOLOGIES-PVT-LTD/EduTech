import { z } from 'zod';

export const ObservabilityConfigSchema = z.object({
  logLevel: z.enum(['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']).default('INFO'),
  slowRequestThresholdMs: z.coerce.number().default(500),
  enableMetrics: z.coerce.boolean().default(true),
  enableTracing: z.coerce.boolean().default(true),
  enableStructuredLogging: z.coerce.boolean().default(true),
});

export type ObservabilityConfig = z.infer<typeof ObservabilityConfigSchema>;
