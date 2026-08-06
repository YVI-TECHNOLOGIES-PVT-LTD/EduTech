import { z } from 'zod';

export const QueueConfigSchema = z.object({
  provider: z.enum(['bullmq', 'memory', 'noop']).default('memory'),
  redisHost: z.string().default('127.0.0.1'),
  redisPort: z.coerce.number().default(6379),
  redisPassword: z.string().optional(),
  redisDb: z.coerce.number().default(0),
  defaultRetries: z.coerce.number().default(3),
  defaultBackoffMs: z.coerce.number().default(1000),
  workerConcurrency: z.coerce.number().default(5),
  schedulerEnabled: z.coerce.boolean().default(true),
  metricsEnabled: z.coerce.boolean().default(true),
  prefix: z.string().default('edutrack:queue'),
});

export type QueueConfig = z.infer<typeof QueueConfigSchema>;
