import { z } from 'zod';

export const SecurityConfigSchema = z.object({
  enableHelmet: z.coerce.boolean().default(true),
  enableCsp: z.coerce.boolean().default(true),
  hstsMaxAgeSeconds: z.coerce.number().default(31536000),
  globalRateLimitWindowMs: z.coerce.number().default(60000),
  globalRateLimitMax: z.coerce.number().default(100),
  loginRateLimitWindowMs: z.coerce.number().default(900000),
  loginRateLimitMax: z.coerce.number().default(5),
  enableCsrf: z.coerce.boolean().default(false), // Optional for cookie auth; false for JWT
  maxPayloadSizeBytes: z.coerce.number().default(10485760), // 10MB
  secretKey: z.string().default('edutrack-enterprise-secret-key-32chars!!'),
});

export type SecurityConfig = z.infer<typeof SecurityConfigSchema>;
