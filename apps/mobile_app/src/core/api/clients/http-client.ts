import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ENV } from '../../../config/env';
import { useAuthStore } from '../../../stores/auth.store';
import { useTenantStore } from '../../../stores/tenant.store';
import { Logger } from '../../logging/logger';

export const apiClient: AxiosInstance = axios.create({
  baseURL: ENV.API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach Auth Token & Multi-Tenant Headers
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const tokens = useAuthStore.getState().tokens;
    const tenantInfo = useTenantStore.getState().tenantInfo;

    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }

    if (tenantInfo) {
      config.headers['X-Tenant-ID'] = tenantInfo.tenantId;
      config.headers['Workspace-ID'] = tenantInfo.workspaceId;
      config.headers['School-ID'] = tenantInfo.schoolId;
      config.headers['Academic-Year-ID'] = tenantInfo.academicYearId;
    }

    Logger.info(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error: AxiosError) => {
    Logger.error('[API Request Error]', error);
    return Promise.reject(error);
  },
);

// Response Interceptor: Token Refresh & Unauthorized Redirect
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        Logger.info('[API Token Refresh] Attempting to refresh access token...');
        // Refresh token logic placeholder
        return apiClient(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    Logger.error(`[API Response Error] ${error.response?.status} - ${error.config?.url}`, error.response?.data);
    return Promise.reject(error);
  },
);
