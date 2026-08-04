export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh-token',
    FORGOT_PASSWORD: '/auth/forgot-password',
    VERIFY_OTP: '/auth/verify-otp',
    WORKSPACES: '/auth/workspaces',
  },
  TENANT: {
    SELECT_WORKSPACE: '/tenant/select-workspace',
    DETAILS: '/tenant/details',
  },
  USER: {
    ME: '/users/me',
    PROFILE: '/users/profile',
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: '/notifications/mark-read',
    REGISTER_DEVICE: '/notifications/register-device',
  },
};
