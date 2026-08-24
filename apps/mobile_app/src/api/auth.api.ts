import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import {
  LoginRequest,
  LoginResponse,
  RegisterParentRequest,
  RegisterParentResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '../types/auth.types';
import { SecureStorage } from '../storage/secure-store';

export const authApi = {
  /**
   * Parent Login: POST /v1/auth/login
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const data = await apiClient.post<LoginResponse>(ENDPOINTS.AUTH.LOGIN, credentials);
    if (data.accessToken) {
      await SecureStorage.setAccessToken(data.accessToken);
    }
    if (data.refreshToken) {
      await SecureStorage.setRefreshToken(data.refreshToken);
    }
    return data;
  },

  /**
   * Parent Self-Registration: POST /v1/admission/register
   */
  async registerParent(payload: RegisterParentRequest): Promise<RegisterParentResponse> {
    return apiClient.post<RegisterParentResponse>(ENDPOINTS.AUTH.REGISTER, payload);
  },

  /**
   * 6-Digit OTP Verification: POST /v1/admission/verify-otp
   */
  async verifyOtp(payload: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    return apiClient.post<VerifyOtpResponse>(ENDPOINTS.AUTH.VERIFY_OTP, payload);
  },

  /**
   * Clear session & tokens
   */
  async logout(): Promise<void> {
    await SecureStorage.clearSession();
  },
};
