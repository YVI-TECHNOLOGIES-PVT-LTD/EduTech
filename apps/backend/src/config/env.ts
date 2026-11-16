import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

export const DEV_DEFAULT_JWT_SECRET = 'edutrack-enterprise-jwt-secret-2026';
export const DEV_DEFAULT_JWT_REFRESH_SECRET = 'edutrack-enterprise-jwt-refresh-secret-2026';
const MIN_PRODUCTION_SECRET_LENGTH = 32;

const envSchema = z
  .object({
    PORT: z.string().default('3000'),
    NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
    SUPABASE_URL: z.string().min(1, 'SUPABASE_URL is required'),
    SUPABASE_KEY: z.string().min(1, 'SUPABASE_KEY or SUPABASE_SERVICE_ROLE_KEY is required'),
    SYSTEM_MODE: z.enum(['UAT', 'PRODUCTION']).default('UAT'),
    FRONTEND_URL: z.string().optional(),
    JWT_SECRET: z.string().optional(),
    JWT_REFRESH_SECRET: z.string().optional(),
    SUPABASE_ADMISSION_DOCUMENTS_BUCKET: z.string().default('admission-documents'),
  })
  .superRefine((val, ctx) => {
    const isStrictRuntime =
      val.NODE_ENV === 'production' ||
      val.NODE_ENV === 'staging' ||
      val.SYSTEM_MODE === 'PRODUCTION';

    if (isStrictRuntime) {
      if (!val.JWT_SECRET || val.JWT_SECRET.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_SECRET'],
          message: 'JWT_SECRET must be explicitly configured in staging/production modes.',
        });
      } else if (val.JWT_SECRET === DEV_DEFAULT_JWT_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_SECRET'],
          message: 'JWT_SECRET cannot use the known development default in staging/production.',
        });
      } else if (val.JWT_SECRET.length < MIN_PRODUCTION_SECRET_LENGTH) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_SECRET'],
          message: `JWT_SECRET must be at least ${MIN_PRODUCTION_SECRET_LENGTH} characters in staging/production.`,
        });
      }

      if (!val.JWT_REFRESH_SECRET || val.JWT_REFRESH_SECRET.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_REFRESH_SECRET'],
          message: 'JWT_REFRESH_SECRET must be explicitly configured in staging/production modes.',
        });
      } else if (val.JWT_REFRESH_SECRET === DEV_DEFAULT_JWT_REFRESH_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_REFRESH_SECRET'],
          message:
            'JWT_REFRESH_SECRET cannot use the known development default in staging/production.',
        });
      } else if (val.JWT_REFRESH_SECRET.length < MIN_PRODUCTION_SECRET_LENGTH) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_REFRESH_SECRET'],
          message: `JWT_REFRESH_SECRET must be at least ${MIN_PRODUCTION_SECRET_LENGTH} characters in staging/production.`,
        });
      } else if (val.JWT_SECRET && val.JWT_REFRESH_SECRET === val.JWT_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_REFRESH_SECRET'],
          message: 'JWT_REFRESH_SECRET must be distinct from JWT_SECRET in staging/production.',
        });
      }
    }
  });

export function validateEnvConfig(rawEnv: Record<string, string | undefined>) {
  const rawSupabaseKey = rawEnv.SUPABASE_SERVICE_ROLE_KEY || rawEnv.SUPABASE_KEY;

  const parseResult = envSchema.safeParse({
    PORT: rawEnv.PORT,
    NODE_ENV: rawEnv.NODE_ENV,
    SUPABASE_URL: rawEnv.SUPABASE_URL,
    SUPABASE_KEY: rawSupabaseKey,
    SYSTEM_MODE: rawEnv.SYSTEM_MODE,
    FRONTEND_URL: rawEnv.FRONTEND_URL,
    JWT_SECRET: rawEnv.JWT_SECRET,
    JWT_REFRESH_SECRET: rawEnv.JWT_REFRESH_SECRET,
    SUPABASE_ADMISSION_DOCUMENTS_BUCKET:
      rawEnv.SUPABASE_ADMISSION_DOCUMENTS_BUCKET || 'admission-documents',
  });

  if (!parseResult.success) {
    throw new Error(
      `Configuration validation failed on startup: ${JSON.stringify(parseResult.error.format())}`,
    );
  }

  const data = parseResult.data;
  const effectiveJwtSecret = data.JWT_SECRET || DEV_DEFAULT_JWT_SECRET;
  const effectiveRefreshSecret = data.JWT_REFRESH_SECRET || DEV_DEFAULT_JWT_REFRESH_SECRET;

  return {
    ...data,
    SUPABASE_KEY: data.SUPABASE_KEY,
    JWT_SECRET: effectiveJwtSecret,
    JWT_REFRESH_SECRET: effectiveRefreshSecret,
  };
}

let validatedEnv: ReturnType<typeof validateEnvConfig>;
try {
  validatedEnv = validateEnvConfig(process.env);
} catch (err: any) {
  console.error('[Fatal] Configuration validation failed on startup:', err?.message || err);
  process.exit(1);
}

if (
  validatedEnv.JWT_SECRET === DEV_DEFAULT_JWT_SECRET ||
  validatedEnv.JWT_REFRESH_SECRET === DEV_DEFAULT_JWT_REFRESH_SECRET
) {
  console.warn(
    '[Security Notice] Using fallback development JWT secret(s). Do not deploy without explicit strong JWT_SECRET and JWT_REFRESH_SECRET.',
  );
}

export const env = validatedEnv;
