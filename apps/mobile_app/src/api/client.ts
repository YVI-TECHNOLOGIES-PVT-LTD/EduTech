import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { ENV } from '../config/env';
import { SecureStorage } from '../storage/secure-store';
import { useAuthStore } from '../stores/auth.store';

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const sanitizeUrlForLog = (url?: string): string => {
  if (!url) return '';
  // Redact any query params that might look sensitive
  return url.replace(/([?&](token|key|secret|otp|password)=)[^&]+/gi, '$1[REDACTED]');
};

const axiosInstance: AxiosInstance = axios.create({
  baseURL: ENV.API_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach JWT Token & Correlation ID
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStorage.getAccessToken();
    const workspaceId = await SecureStorage.getWorkspaceId();

    if (token && typeof token === 'string' && token.trim()) {
      config.headers.Authorization = `Bearer ${token.trim()}`;
    }

    if (workspaceId && typeof workspaceId === 'string' && workspaceId.trim()) {
      config.headers['X-Workspace-Id'] = workspaceId.trim();
    }

    const requestId = `req-mob-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    config.headers['X-Request-Id'] = requestId;

    if (ENV.ENABLE_LOGGING) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${sanitizeUrlForLog(config.url)}`);
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// Response Interceptor: Error Normalization & 401 Session Handling
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    if (ENV.ENABLE_LOGGING) {
      console.log(`[API Response] ${response.status} ${sanitizeUrlForLog(response.config.url)}`);
    }
    return response;
  },
  async (error: AxiosError<any>) => {
    if (!error.response) {
      // Network failure or timeout
      const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
      const networkMessage = isTimeout
        ? 'Request timed out. Please check your internet connection and try again.'
        : 'Unable to connect to server. Please check your network connection.';

      if (ENV.ENABLE_LOGGING) {
        console.warn(`[API Network Error] ${error.message}`);
      }

      return Promise.reject(
        new ApiError(0, networkMessage, isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR'),
      );
    }

    const status = error.response.status;
    const responseData = error.response.data || {};
    const serverMessage =
      responseData.error || responseData.message || responseData.details?.error || null;
    const serverCode = responseData.code || undefined;
    const details = responseData.details || undefined;

    if (ENV.ENABLE_LOGGING) {
      console.warn(`[API Error ${status}] ${sanitizeUrlForLog(error.config?.url)}:`, serverMessage);
    }

    // 401 Unauthorized Handling
    if (status === 401) {
      const isAuthRoute =
        error.config?.url?.includes('/auth/login') ||
        error.config?.url?.includes('/admission/register') ||
        error.config?.url?.includes('/admission/verify-otp');

      if (!isAuthRoute) {
        // Invalidate session cleanly
        await SecureStorage.clearSession();
        useAuthStore.getState().logout();
      }

      const message = serverMessage || 'Session expired. Please sign in again.';
      return Promise.reject(new ApiError(401, message, serverCode || 'UNAUTHORIZED', details));
    }

    // 403 Forbidden Handling
    if (status === 403) {
      const message = serverMessage || 'You do not have permission to access this resource.';
      return Promise.reject(new ApiError(403, message, serverCode || 'FORBIDDEN', details));
    }

    // 404 Not Found Handling
    if (status === 404) {
      const message = serverMessage || 'The requested resource could not be found.';
      return Promise.reject(new ApiError(404, message, serverCode || 'NOT_FOUND', details));
    }

    // 409 Conflict Handling
    if (status === 409) {
      const message = serverMessage || 'A conflict occurred. The resource may have been updated.';
      return Promise.reject(new ApiError(409, message, serverCode || 'CONFLICT', details));
    }

    // 422 / 400 Validation Error Handling
    if (status === 422 || (status === 400 && serverMessage?.toLowerCase().includes('validation'))) {
      const message =
        serverMessage || 'Validation failed. Please check your submitted information.';
      return Promise.reject(
        new ApiError(status, message, serverCode || 'VALIDATION_ERROR', details),
      );
    }

    // 429 Rate Limiting
    if (status === 429) {
      const message = serverMessage || 'Too many requests. Please wait a moment and try again.';
      return Promise.reject(new ApiError(429, message, serverCode || 'RATE_LIMITED', details));
    }

    // 5xx Server Errors
    if (status >= 500) {
      const message =
        status === 503
          ? 'Service is temporarily unavailable. Please try again shortly.'
          : 'A server error occurred. Please try again later.';
      return Promise.reject(new ApiError(status, message, serverCode || 'SERVER_ERROR', details));
    }

    // Generic fallback for any other HTTP status
    const message = serverMessage || `Request failed with status ${status}`;
    return Promise.reject(new ApiError(status, message, serverCode, details));
  },
);

export const apiClient = {
  instance: axiosInstance,

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.get<T>(url, config);
    return response.data;
  },

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.post<T>(url, data, config);
    return response.data;
  },

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.patch<T>(url, data, config);
    return response.data;
  },

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.put<T>(url, data, config);
    return response.data;
  },

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.delete<T>(url, config);
    return response.data;
  },

  async upload<T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.post<T>(url, formData, {
      ...config,
      headers: {
        ...(config?.headers || {}),
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
