import { z } from 'zod';

const envSchema = z.object({
    VITE_API_URL: z.string().url().optional(),
    VITE_SUPABASE_URL: z.string().url(),
    VITE_SUPABASE_ANON_KEY: z.string().min(10),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const getEnvVars = () => {
    try {
        return envSchema.parse({
            VITE_API_URL: import.meta.env.VITE_API_URL,
            VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
            VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
            NODE_ENV: import.meta.env.MODE,
        });
    } catch (error) {
        console.error('[Config] Invalid environment configuration variables:', error);
        // Default fallbacks for compilation safety
        return {
            VITE_API_URL: 'http://127.0.0.1:3000/api',
            VITE_SUPABASE_URL: 'https://placeholder.supabase.co',
            VITE_SUPABASE_ANON_KEY: 'placeholder-anon-key',
            NODE_ENV: 'development',
        };
    }
};

export const ENV = getEnvVars();
