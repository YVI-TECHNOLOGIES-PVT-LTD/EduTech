import { UserProfile } from './user.types';

export type { UserProfile };

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

export interface LoginRequest {
  email: string;
  password?: string;
  passwordHash?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  user: UserProfile;
}

export interface RegisterParentRequest {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  org_id?: string;
  source?: string;
}

export interface RegisterParentResponse {
  success: boolean;
  user_id?: string;
  parent_id?: string;
  lead_id?: string;
  claimed?: boolean;
  message?: string;
}

export interface VerifyOtpRequest {
  email: string;
  phone?: string;
  otp: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isHydrating: boolean;
  user: UserProfile | null;
  tokens: AuthTokens | null;
}
