import { z } from 'zod';

export const AuthConfigSchema = z.object({
  jwtSecret: z.string().default('edutrack-default-jwt-secret-change-in-prod'),
  jwtRefreshSecret: z.string().default('edutrack-default-refresh-jwt-secret-change-in-prod'),
  accessTokenTtl: z.string().default('15m'),
  refreshTokenTtl: z.string().default('7d'),
  jwtIssuer: z.string().default('edutrack-api'),
  jwtAudience: z.string().default('edutrack-app'),
  clockSkewSeconds: z.coerce.number().default(5),
  argon2MemoryCost: z.coerce.number().default(65536),
  argon2TimeCost: z.coerce.number().default(3),
  passwordMinLength: z.coerce.number().default(8),
  maxSessionsPerUser: z.coerce.number().default(5),
  cookieSecure: z.coerce.boolean().default(false),
  cookieSameSite: z.enum(['lax', 'strict', 'none']).default('lax'),
});

export type AuthConfig = z.infer<typeof AuthConfigSchema>;
