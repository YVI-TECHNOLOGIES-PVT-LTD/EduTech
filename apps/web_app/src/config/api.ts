import { ENV } from './env';

export const API_CONFIG = {
  baseUrl: ENV.API_BASE_URL,
  timeoutMs: 30000,
  headers: {
    contentType: 'application/json',
    accept: 'application/json',
  },
  retryAttempts: 2,
  tokenKeys: {
    accessToken: 'edutrack_access_token',
    refreshToken: 'edutrack_refresh_token',
    tenantId: 'edutrack_tenant_id',
    userProfile: 'edutrack_user_profile',
  },
} as const;
