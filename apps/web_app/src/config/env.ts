/**
 * Centralized Environment Configuration
 * Enforces zero direct `import.meta.env` references in application business logic.
 */
export const ENV = {
  NODE_ENV: import.meta.env.MODE || 'development',
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  APP_TITLE: import.meta.env.VITE_APP_TITLE || 'EduTrack ERP Admin Portal',
  ENABLE_MOCK_API: import.meta.env.VITE_ENABLE_MOCK_API === 'true',
  SESSION_TIMEOUT_MINS: Number(import.meta.env.VITE_SESSION_TIMEOUT_MINS) || 60,
  DEFAULT_TENANT_ID: import.meta.env.VITE_DEFAULT_TENANT_ID || '',
} as const;

export type EnvConfig = typeof ENV;
