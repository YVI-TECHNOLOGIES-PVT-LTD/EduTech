export const ROUTES = {
  AUTH: {
    SPLASH: '/(auth)/splash',
    LOGIN: '/(auth)/login',
    FORGOT_PASSWORD: '/(auth)/forgot-password',
    OTP: '/(auth)/otp',
    WORKSPACE: '/(auth)/workspace',
  },
  TABS: {
    DASHBOARD: '/(tabs)/dashboard',
    PROFILE: '/(tabs)/profile',
    SETTINGS: '/(tabs)/settings',
  },
  COMMON: {
    NOTIFICATIONS: '/(common)/notifications',
    NO_INTERNET: '/(common)/no-internet',
    MAINTENANCE: '/(common)/maintenance',
    UNEXPECTED_ERROR: '/(common)/unexpected-error',
  },
  MODULES: {
    ADMISSION: '/(admission)',
    STUDENT: '/(student)',
    TEACHER: '/(teacher)',
    PARENT: '/(parent)',
  },
} as const;
