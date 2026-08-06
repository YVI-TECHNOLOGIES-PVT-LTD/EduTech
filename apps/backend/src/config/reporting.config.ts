import { z } from 'zod';

export const ReportingConfigSchema = z.object({
  engine: z.enum(['tabular', 'aggregated', 'memory', 'noop']).default('memory'),
  defaultFormat: z.enum(['csv', 'pdf', 'excel', 'json']).default('csv'),
  exportDir: z.string().default('./exports'),
  cacheTtlSeconds: z.coerce.number().default(600), // 10 min cache
});

export type ReportingConfig = z.infer<typeof ReportingConfigSchema>;
