"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('3000'),
    NODE_ENV: zod_1.z.enum(['development', 'staging', 'production', 'test']).default('development'),
    SUPABASE_URL: zod_1.z.string().min(1, 'SUPABASE_URL is required'),
    SUPABASE_KEY: zod_1.z.string().min(1, 'SUPABASE_KEY or SUPABASE_SERVICE_ROLE_KEY is required'),
    SYSTEM_MODE: zod_1.z.enum(['UAT', 'PRODUCTION']).default('UAT'),
    FRONTEND_URL: zod_1.z.string().optional(),
    JWT_SECRET: zod_1.z.string().default('edutrack-enterprise-jwt-secret-2026'),
    JWT_REFRESH_SECRET: zod_1.z.string().default('edutrack-enterprise-jwt-refresh-secret-2026'),
    SUPABASE_ADMISSION_DOCUMENTS_BUCKET: zod_1.z.string().default('admission-documents'),
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
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'edutrack-enterprise-jwt-refresh-secret-2026',
    SUPABASE_ADMISSION_DOCUMENTS_BUCKET: process.env.SUPABASE_ADMISSION_DOCUMENTS_BUCKET || 'admission-documents',
});
if (!parseResult.success) {
    console.error('🚨 [Fatal] Configuration validation failed on startup:');
    console.error(parseResult.error.format());
    process.exit(1);
}
exports.env = {
    ...parseResult.data,
    SUPABASE_KEY: parseResult.data.SUPABASE_KEY,
};
