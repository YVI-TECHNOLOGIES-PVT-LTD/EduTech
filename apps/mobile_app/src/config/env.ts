export const ENV = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  ENVIRONMENT: process.env.EXPO_PUBLIC_ENV || 'development',
  APP_NAME: process.env.EXPO_PUBLIC_APP_NAME || 'EduTrack',
  ENABLE_LOGGING: process.env.EXPO_PUBLIC_ENABLE_LOGGING === 'true',
  ENABLE_ANALYTICS: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
  IS_DEV: process.env.EXPO_PUBLIC_ENV === 'development',
};
