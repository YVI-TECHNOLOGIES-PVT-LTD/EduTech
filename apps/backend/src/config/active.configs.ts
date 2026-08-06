import { z } from 'zod';

export const AuthConfigSchema = z.object({
  jwtSecret: z.string().default('edutrack-default-jwt-secret-change-in-prod'),
  jwtExpiresIn: z.string().default('8h'),
  sessionTtlSeconds: z.coerce.number().default(28800),
});

export type AuthConfig = z.infer<typeof AuthConfigSchema>;

export const SecurityConfigSchema = z.object({
  corsAllowedOrigins: z
    .array(z.string())
    .default(['http://localhost:5173', 'http://127.0.0.1:5173']),
  rateLimitWindowMs: z.coerce.number().default(900000), // 15 mins
  rateLimitMax: z.coerce.number().default(100),
});

export type SecurityConfig = z.infer<typeof SecurityConfigSchema>;

export const ObservabilityConfigSchema = z.object({
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  enableMetrics: z.coerce.boolean().default(true),
});

export type ObservabilityConfig = z.infer<typeof ObservabilityConfigSchema>;
