import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { Platform } from 'react-native';
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
    (config as any).__startTime = Date.now();

    // Fast path: In-memory access token priority (0ms latency, zero Keychain IPC)
    const token =
      useAuthStore.getState().tokens?.accessToken || (await SecureStorage.getAccessToken());
    const workspaceId = await SecureStorage.getWorkspaceId();

    const isPublicAuthRoute =
      config.url?.includes('/auth/login') ||
      config.url?.includes('/admission/register') ||
      config.url?.includes('/admission/verify-otp') ||
      config.url?.includes('/public/');

    if (!isPublicAuthRoute && token && typeof token === 'string' && token.trim()) {
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

// Token Refresh Concurrency Queue
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Error Normalization & 401 Session Handling
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    const startTime = (response.config as any)?.__startTime;
    const duration = startTime ? Date.now() - startTime : undefined;

    if (ENV.ENABLE_LOGGING) {
      const perfTag = duration !== undefined ? ` [${duration}ms]` : '';
      console.log(
        `[API Response] ${response.status} ${sanitizeUrlForLog(response.config.url)}${perfTag}`,
      );
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
    const requestUrl = error.config?.url || '';

    if (ENV.ENABLE_LOGGING) {
      if (status >= 500) {
        console.warn(
          `[API Server Error ${status}] ${sanitizeUrlForLog(error.config?.url)}:`,
          serverMessage,
        );
      } else {
        console.log(
          `[API Error ${status}] ${sanitizeUrlForLog(error.config?.url)}:`,
          serverMessage,
        );
      }
    }

    // 1. Payment Gateway Error Protection:
    // If error is GATEWAY_AUTH_ERROR or from Razorpay payment endpoints, DO NOT log out the user!
    const isGatewayError =
      serverCode === 'GATEWAY_AUTH_ERROR' ||
      serverMessage?.includes('Razorpay') ||
      requestUrl.includes('/create-order') ||
      requestUrl.includes('/verify-payment') ||
      requestUrl.includes('/razorpay/config');

    if (isGatewayError && (status === 401 || status === 503)) {
      return Promise.reject(
        new ApiError(
          status,
          serverMessage || 'Payment gateway configuration error. Please contact school finance.',
          'GATEWAY_ERROR',
          details,
        ),
      );
    }

    // 2. 401 Unauthorized Handling with Automatic Token Refresh
    if (status === 401) {
      const isAuthRoute =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/refresh') ||
        requestUrl.includes('/admission/register') ||
        requestUrl.includes('/admission/verify-otp');

      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (!isAuthRoute && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;

        if (isRefreshing) {
          return new Promise<AxiosResponse>((resolve, reject) => {
            failedQueue.push({
              resolve: (token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(axiosInstance(originalRequest));
              },
              reject: (err: any) => {
                reject(err);
              },
            });
          });
        }

        isRefreshing = true;

        try {
          const storedRefreshToken =
            (await SecureStorage.getRefreshToken()) || useAuthStore.getState().tokens?.refreshToken;

          if (!storedRefreshToken) {
            throw new Error('No refresh token available');
          }

          // Use raw axios to prevent interceptor loops
          const refreshResponse = await axios.post(
            `${ENV.API_URL}/v1/auth/refresh`,
            { refreshToken: storedRefreshToken },
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: 10000,
            },
          );

          const newAccessToken =
            refreshResponse.data?.accessToken ||
            refreshResponse.data?.data?.accessToken ||
            refreshResponse.data?.access_token;
          const newRefreshToken =
            refreshResponse.data?.refreshToken ||
            refreshResponse.data?.data?.refreshToken ||
            storedRefreshToken;

          if (!newAccessToken) {
            throw new Error('Invalid refresh response');
          }

          await SecureStorage.setAccessToken(newAccessToken);
          if (newRefreshToken) {
            await SecureStorage.setRefreshToken(newRefreshToken);
          }

          useAuthStore.getState().setTokens({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          });

          processQueue(null, newAccessToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest);
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          await SecureStorage.clearSession();
          useAuthStore.getState().logout();
          const message = 'Session expired. Please sign in again.';
          return Promise.reject(new ApiError(401, message, 'SESSION_EXPIRED'));
        } finally {
          isRefreshing = false;
        }
      }

      if (!isAuthRoute) {
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

// In-Flight Request Deduplication Map for Concurrent GET Requests
const inFlightGetRequests = new Map<string, Promise<any>>();

export const apiClient = {
  instance: axiosInstance,

  /**
   * Create an AbortController instance for screen unmount or lifecycle cancellation
   */
  createAbortController(): AbortController {
    return new AbortController();
  },

  /**
   * Perform an idempotent, in-flight deduplicated GET request
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const dedupKey = `GET:${url}:${JSON.stringify(config?.params || {})}`;

    // Return in-flight promise if identical request is already underway
    if (inFlightGetRequests.has(dedupKey)) {
      return inFlightGetRequests.get(dedupKey) as Promise<T>;
    }

    const requestPromise = (async () => {
      try {
        const response = await axiosInstance.get<T>(url, config);
        return response.data;
      } finally {
        inFlightGetRequests.delete(dedupKey);
      }
    })();

    inFlightGetRequests.set(dedupKey, requestPromise);
    return requestPromise;
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
    const headers = { ...(config?.headers || {}) };
    if (Platform.OS !== 'web') {
      headers['Content-Type'] = 'multipart/form-data';
    } else {
      delete (headers as any)['Content-Type'];
      delete (headers as any)['content-type'];
    }
    const response = await axiosInstance.post<T>(url, formData, {
      ...config,
      headers,
    });
    return response.data;
  },
};
