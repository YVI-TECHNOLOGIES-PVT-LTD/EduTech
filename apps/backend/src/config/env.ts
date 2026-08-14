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
  JWT_SECRET: z.string().default('edutrack-enterprise-jwt-secret-2026'),
  JWT_REFRESH_SECRET: z.string().default('edutrack-enterprise-jwt-refresh-secret-2026'),
  SUPABASE_ADMISSION_DOCUMENTS_BUCKET: z.string().default('admission-documents'),
});

const rawSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

const parseResult = envSchema.safeParse({
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: rawSupabaseKey,
  SYSTEM_MODE: process.env.SYSTEM_MODE,
  FRONTEND_URL: process.env.FRONTEND_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'edutrack-enterprise-jwt-secret-2026',
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET || 'edutrack-enterprise-jwt-refresh-secret-2026',
  SUPABASE_ADMISSION_DOCUMENTS_BUCKET:
    process.env.SUPABASE_ADMISSION_DOCUMENTS_BUCKET || 'admission-documents',
});

if (!parseResult.success) {
  console.error('🚨 [Fatal] Configuration validation failed on startup:');
  console.error(parseResult.error.format());
  process.exit(1);
}

export const env = {
  ...parseResult.data,
  SUPABASE_KEY: parseResult.data.SUPABASE_KEY,
};
