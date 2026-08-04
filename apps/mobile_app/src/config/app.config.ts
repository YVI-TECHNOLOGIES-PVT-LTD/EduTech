import { ENV } from './env';

export const APP_CONFIG = {
  name: ENV.APP_NAME,
  version: '1.0.0',
  apiTimeoutMs: 15000,
  maxRetryAttempts: 3,
  supportedLanguages: ['en', 'te', 'hi', 'ar'],
  defaultLanguage: 'en',
  defaultTheme: 'system' as const,
};
