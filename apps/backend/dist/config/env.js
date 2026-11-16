"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = exports.DEV_DEFAULT_JWT_REFRESH_SECRET = exports.DEV_DEFAULT_JWT_SECRET = void 0;
exports.validateEnvConfig = validateEnvConfig;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
exports.DEV_DEFAULT_JWT_SECRET = 'edutrack-enterprise-jwt-secret-2026';
exports.DEV_DEFAULT_JWT_REFRESH_SECRET = 'edutrack-enterprise-jwt-refresh-secret-2026';
const MIN_PRODUCTION_SECRET_LENGTH = 32;
const envSchema = zod_1.z
    .object({
    PORT: zod_1.z.string().default('3000'),
    NODE_ENV: zod_1.z.enum(['development', 'staging', 'production', 'test']).default('development'),
    SUPABASE_URL: zod_1.z.string().min(1, 'SUPABASE_URL is required'),
    SUPABASE_KEY: zod_1.z.string().min(1, 'SUPABASE_KEY or SUPABASE_SERVICE_ROLE_KEY is required'),
    SYSTEM_MODE: zod_1.z.enum(['UAT', 'PRODUCTION']).default('UAT'),
    FRONTEND_URL: zod_1.z.string().optional(),
    JWT_SECRET: zod_1.z.string().optional(),
    JWT_REFRESH_SECRET: zod_1.z.string().optional(),
    SUPABASE_ADMISSION_DOCUMENTS_BUCKET: zod_1.z.string().default('admission-documents'),
})
    .superRefine((val, ctx) => {
    const isStrictRuntime = val.NODE_ENV === 'production' ||
        val.NODE_ENV === 'staging' ||
        val.SYSTEM_MODE === 'PRODUCTION';
    if (isStrictRuntime) {
        if (!val.JWT_SECRET || val.JWT_SECRET.trim() === '') {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                path: ['JWT_SECRET'],
                message: 'JWT_SECRET must be explicitly configured in staging/production modes.',
            });
        }
        else if (val.JWT_SECRET === exports.DEV_DEFAULT_JWT_SECRET) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                path: ['JWT_SECRET'],
                message: 'JWT_SECRET cannot use the known development default in staging/production.',
            });
        }
        else if (val.JWT_SECRET.length < MIN_PRODUCTION_SECRET_LENGTH) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                path: ['JWT_SECRET'],
                message: `JWT_SECRET must be at least ${MIN_PRODUCTION_SECRET_LENGTH} characters in staging/production.`,
            });
        }
        if (!val.JWT_REFRESH_SECRET || val.JWT_REFRESH_SECRET.trim() === '') {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                path: ['JWT_REFRESH_SECRET'],
                message: 'JWT_REFRESH_SECRET must be explicitly configured in staging/production modes.',
            });
        }
        else if (val.JWT_REFRESH_SECRET === exports.DEV_DEFAULT_JWT_REFRESH_SECRET) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                path: ['JWT_REFRESH_SECRET'],
                message: 'JWT_REFRESH_SECRET cannot use the known development default in staging/production.',
            });
        }
        else if (val.JWT_REFRESH_SECRET.length < MIN_PRODUCTION_SECRET_LENGTH) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                path: ['JWT_REFRESH_SECRET'],
                message: `JWT_REFRESH_SECRET must be at least ${MIN_PRODUCTION_SECRET_LENGTH} characters in staging/production.`,
            });
        }
        else if (val.JWT_SECRET && val.JWT_REFRESH_SECRET === val.JWT_SECRET) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                path: ['JWT_REFRESH_SECRET'],
                message: 'JWT_REFRESH_SECRET must be distinct from JWT_SECRET in staging/production.',
            });
        }
    }
});
function validateEnvConfig(rawEnv) {
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
        SUPABASE_ADMISSION_DOCUMENTS_BUCKET: rawEnv.SUPABASE_ADMISSION_DOCUMENTS_BUCKET || 'admission-documents',
    });
    if (!parseResult.success) {
        throw new Error(`Configuration validation failed on startup: ${JSON.stringify(parseResult.error.format())}`);
    }
    const data = parseResult.data;
    const effectiveJwtSecret = data.JWT_SECRET || exports.DEV_DEFAULT_JWT_SECRET;
    const effectiveRefreshSecret = data.JWT_REFRESH_SECRET || exports.DEV_DEFAULT_JWT_REFRESH_SECRET;
    return {
        ...data,
        SUPABASE_KEY: data.SUPABASE_KEY,
        JWT_SECRET: effectiveJwtSecret,
        JWT_REFRESH_SECRET: effectiveRefreshSecret,
    };
}
let validatedEnv;
try {
    validatedEnv = validateEnvConfig(process.env);
}
catch (err) {
    console.error('[Fatal] Configuration validation failed on startup:', err?.message || err);
    process.exit(1);
}
if (validatedEnv.JWT_SECRET === exports.DEV_DEFAULT_JWT_SECRET ||
    validatedEnv.JWT_REFRESH_SECRET === exports.DEV_DEFAULT_JWT_REFRESH_SECRET) {
    console.warn('[Security Notice] Using fallback development JWT secret(s). Do not deploy without explicit strong JWT_SECRET and JWT_REFRESH_SECRET.');
}
exports.env = validatedEnv;
