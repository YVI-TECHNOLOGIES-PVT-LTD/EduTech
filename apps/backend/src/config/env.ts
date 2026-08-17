import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Non-secret, clearly-labeled fallbacks for LOCAL DEVELOPMENT ONLY. These must
// never be reachable in a production process — see the hard production check
// below, which fails startup instead of ever falling back to these.
const DEV_ONLY_JWT_SECRET = 'dev-only-insecure-jwt-secret-DO-NOT-USE-IN-PRODUCTION';
const DEV_ONLY_JWT_REFRESH_SECRET = 'dev-only-insecure-jwt-refresh-secret-DO-NOT-USE-IN-PRODUCTION';

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  SUPABASE_URL: z.string().min(1, 'SUPABASE_URL is required'),
  SUPABASE_KEY: z.string().min(1, 'SUPABASE_KEY or SUPABASE_SERVICE_ROLE_KEY is required'),
  // Read by Prisma directly via `env()` in schema.prisma, but validated here
  // too so a missing value fails fast at startup with a clear message
  // instead of surfacing later as an opaque Prisma connection error.
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL is required'),
  SYSTEM_MODE: z.enum(['UAT', 'PRODUCTION']).default('UAT'),
  FRONTEND_URL: z.string().optional(),
  // No production defaults for JWT secrets — see the hard check below.
  JWT_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),
});

const rawSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

const parseResult = envSchema.safeParse({
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: rawSupabaseKey,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  SYSTEM_MODE: process.env.SYSTEM_MODE,
  FRONTEND_URL: process.env.FRONTEND_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
});

if (!parseResult.success) {
  console.error('🚨 [Fatal] Configuration validation failed on startup:');
  console.error(parseResult.error.format());
  process.exit(1);
}

const data = parseResult.data;

// Hard production gate: these must be explicitly supplied in production.
// Never silently fall back to a hardcoded/predictable value for a real
// deployment — that would let anyone who has read this source forge valid
// tokens or bypass the intended CORS origin restriction.
if (data.NODE_ENV === 'production') {
  const missingForProduction: string[] = [];
  if (!data.JWT_SECRET) missingForProduction.push('JWT_SECRET');
  if (!data.JWT_REFRESH_SECRET) missingForProduction.push('JWT_REFRESH_SECRET');
  if (!data.FRONTEND_URL) missingForProduction.push('FRONTEND_URL');

  if (missingForProduction.length > 0) {
    console.error(
      `🚨 [Fatal] Missing required production environment variable(s): ${missingForProduction.join(', ')}. ` +
        'Refusing to start with an insecure/incomplete production configuration. ' +
        'Set these in the Render dashboard (never commit real values to source control).',
    );
    process.exit(1);
  }
}

export const env = {
  ...data,
  SUPABASE_KEY: data.SUPABASE_KEY,
  // Outside production, fall back to clearly-labeled dev-only values so
  // local development stays convenient without ever using a production
  // default.
  JWT_SECRET: data.JWT_SECRET || DEV_ONLY_JWT_SECRET,
  JWT_REFRESH_SECRET: data.JWT_REFRESH_SECRET || DEV_ONLY_JWT_REFRESH_SECRET,
};
