import { z } from 'zod';

export const AppConfigSchema = z.object({
  name: z.string().default('EduTrack ERP'),
  port: z.coerce.number().default(3000),
  nodeEnv: z.enum(['development', 'production', 'test', 'staging']).default('development'),
  apiPrefix: z.string().default('/api'),
  frontendUrl: z.string().optional(),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
