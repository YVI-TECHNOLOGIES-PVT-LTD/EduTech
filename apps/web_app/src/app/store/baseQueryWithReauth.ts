import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { API_CONFIG } from '@/config/api';
import type { RootState } from './index';
import { logout, setCredentials } from '@/shared/store/authSlice';
import { mapApiError } from '@/shared/errors/apiErrorMapper';

import { resetAuthenticatedClientState } from '@/lib/auth/sessionReset';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_CONFIG.baseUrl,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.accessToken || localStorage.getItem(API_CONFIG.tokenKeys.accessToken);
    const tenantId =
      state.tenant.activeTenantId || localStorage.getItem(API_CONFIG.tokenKeys.tenantId);

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (tenantId) {
      headers.set('x-tenant-id', tenantId);
    }
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    return headers;
  },
});

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const requestUrl = typeof args === 'string' ? args : args.url;
  const isLoginEndpoint = requestUrl.includes('/auth/login');

  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401 && !isLoginEndpoint) {
    // Attempt Token Refresh
    const state = api.getState() as RootState;
    const refreshToken =
      state.auth.refreshToken || localStorage.getItem(API_CONFIG.tokenKeys.refreshToken);

    if (refreshToken) {
      const refreshResult = await rawBaseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions,
      );

      if (refreshResult.data) {
        const refreshData = refreshResult.data as {
          accessToken: string;
          refreshToken?: string;
          user?: any;
        };

        const currentUser = state.auth.user || refreshData.user;
        if (currentUser) {
          api.dispatch(
            setCredentials({
              user: currentUser,
              accessToken: refreshData.accessToken,
              refreshToken: refreshData.refreshToken || refreshToken,
            }),
          );
          // Retry the original query with the new access token
          result = await rawBaseQuery(args, api, extraOptions);
        } else {
          void resetAuthenticatedClientState('token_refresh_failed_no_user');
          api.dispatch(logout());
        }
      } else {
        void resetAuthenticatedClientState('token_refresh_failed_invalid_data');
        api.dispatch(logout());
      }
    } else {
      void resetAuthenticatedClientState('token_refresh_failed_no_token');
      api.dispatch(logout());
    }
  }

  if (result.error) {
    const mapped = mapApiError(result.error);
    (result.error as any).mapped = mapped;
  }

  return result;
};
