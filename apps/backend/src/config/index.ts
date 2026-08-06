import { z } from 'zod';
import dotenv from 'dotenv';
import { AppConfigSchema, AppConfig } from './app.config';
import {
  AuthConfigSchema,
  SecurityConfigSchema,
  ObservabilityConfigSchema,
  AuthConfig,
  SecurityConfig,
  ObservabilityConfig,
} from './active.configs';

dotenv.config();

const GlobalEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test', 'staging']).default('development'),
  PORT: z.coerce.number().default(3000),
  FRONTEND_URL: z.string().optional(),
  JWT_SECRET: z.string().default('edutrack-default-jwt-secret-change-in-prod'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

function loadAndValidateConfig() {
  const envResult = GlobalEnvSchema.safeParse(process.env);

  if (!envResult.success) {
    console.error('❌ Invalid environment variables:', envResult.error.format());
    throw new Error('Environment configuration validation failed');
  }

  const rawEnv = envResult.data;

  const app: AppConfig = Object.freeze(
    AppConfigSchema.parse({
      name: 'EduTrack ERP',
      port: rawEnv.PORT,
      nodeEnv: rawEnv.NODE_ENV,
      apiPrefix: '/api',
      frontendUrl: rawEnv.FRONTEND_URL,
    }),
  );

  const auth: AuthConfig = Object.freeze(
    AuthConfigSchema.parse({
      jwtSecret: rawEnv.JWT_SECRET,
      jwtExpiresIn: '8h',
      sessionTtlSeconds: 28800,
    }),
  );

  const security: SecurityConfig = Object.freeze(
    SecurityConfigSchema.parse({
      corsAllowedOrigins: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        rawEnv.FRONTEND_URL,
      ].filter(Boolean) as string[],
      rateLimitWindowMs: 900000,
      rateLimitMax: 100,
    }),
  );

  const observability: ObservabilityConfig = Object.freeze(
    ObservabilityConfigSchema.parse({
      logLevel: rawEnv.LOG_LEVEL,
      enableMetrics: true,
    }),
  );

  return Object.freeze({
    app,
    auth,
    security,
    observability,
  });
}

export const configuration = loadAndValidateConfig();
export type ApplicationConfiguration = typeof configuration;
