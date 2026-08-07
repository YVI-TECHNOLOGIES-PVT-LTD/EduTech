import { apiSlice } from '@/app/store/apiSlice';
import { ENDPOINTS } from './endpoints';
import { ApiBuilder } from '@/types/rtk-query';

export interface LoginRequest {
  email: string;
  passwordHash: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    organizationId?: string;
    tenantId?: string;
    permissions?: string[];
  };
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPasswordHash: string;
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder: ApiBuilder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials: LoginRequest) => ({
        url: ENDPOINTS.AUTH.LOGIN,
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),
    logoutApi: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: ENDPOINTS.AUTH.LOGOUT,
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),
    getCurrentUser: builder.query<LoginResponse['user'], void>({
      query: () => ENDPOINTS.AUTH.ME,
      providesTags: ['User'],
    }),
    forgotPassword: builder.mutation<{ message: string }, ForgotPasswordRequest>({
      query: (body: ForgotPasswordRequest) => ({
        url: ENDPOINTS.AUTH.FORGOT_PASSWORD,
        method: 'POST',
        body,
      }),
    }),
    resetPassword: builder.mutation<{ message: string }, ResetPasswordRequest>({
      query: (body: ResetPasswordRequest) => ({
        url: ENDPOINTS.AUTH.RESET_PASSWORD,
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutApiMutation,
  useGetCurrentUserQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
