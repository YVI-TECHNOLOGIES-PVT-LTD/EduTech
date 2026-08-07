import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  SUPABASE_URL: z.string().min(1, 'SUPABASE_URL is required'),
  SUPABASE_KEY: z.string().min(1, 'SUPABASE_KEY or SUPABASE_SERVICE_ROLE_KEY is required'),
  SYSTEM_MODE: z.enum(['UAT', 'PRODUCTION']).default('UAT'),
  FRONTEND_URL: z.string().optional(),

  // -----------------------------------------------------------------------
  // Caching Platform (ADR-009) — Redis is fully optional. When CACHE_PROVIDER
  // is left at its default ("memory"), the app behaves exactly as before and
  // no Redis connection is attempted.
  // -----------------------------------------------------------------------
  CACHE_PROVIDER: z.enum(['memory', 'redis']).default('memory'),
  REDIS_URL: z.string().optional(),
  REDIS_CONNECT_TIMEOUT_MS: z.string().default('5000'),
  REDIS_MAX_RETRIES_PER_REQUEST: z.string().default('3'),
});

const rawSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

const parseResult = envSchema.safeParse({
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: rawSupabaseKey,
  SYSTEM_MODE: process.env.SYSTEM_MODE,
  FRONTEND_URL: process.env.FRONTEND_URL,
  CACHE_PROVIDER: process.env.CACHE_PROVIDER,
  REDIS_URL: process.env.REDIS_URL,
  REDIS_CONNECT_TIMEOUT_MS: process.env.REDIS_CONNECT_TIMEOUT_MS,
  REDIS_MAX_RETRIES_PER_REQUEST: process.env.REDIS_MAX_RETRIES_PER_REQUEST,
});

if (!parseResult.success) {
  console.error('🚨 [Fatal] Configuration validation failed on startup:');
  console.error(parseResult.error.format());
  process.exit(1);
}

export const env = {
  ...parseResult.data,
  SUPABASE_KEY: parseResult.data.SUPABASE_KEY,
  REDIS_CONNECT_TIMEOUT_MS: Number(parseResult.data.REDIS_CONNECT_TIMEOUT_MS),
  REDIS_MAX_RETRIES_PER_REQUEST: Number(parseResult.data.REDIS_MAX_RETRIES_PER_REQUEST),
};
