export const ROUTES = {
  AUTH: {
    SPLASH: '/(auth)/splash',
    LOGIN: '/(auth)/login',
    REGISTER: '/(auth)/register',
    FORGOT_PASSWORD: '/(auth)/forgot-password',
    OTP: '/(auth)/otp',
    WORKSPACE: '/(auth)/workspace',
  },
  PARENT: {
    ROOT: '/(parent)',
    DASHBOARD: '/(parent)',
    APPLICATIONS: '/(parent)/applications',
    WIZARD: '/(parent)/applications/wizard',
    DETAIL: (id: string) => `/(parent)/applications/${id}`,
    STATUS: (id: string) => `/(parent)/applications/status?id=${id}`,
    FEES: (id: string) => `/(parent)/applications/fees?id=${id}`,
    DOCUMENTS: '/(parent)/documents',
    NOTIFICATIONS: '/(parent)/notifications',
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
  },
} as const;
