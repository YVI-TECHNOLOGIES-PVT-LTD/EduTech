import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { API_CONFIG } from '@/config/api';

export interface UserPermissions {
  roles: string[];
  permissions: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId?: string;
  tenantId?: string;
  permissions?: string[];
}

export interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
}

const getStoredItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const getStoredUser = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(API_CONFIG.tokenKeys.userProfile);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialAccessToken = getStoredItem(API_CONFIG.tokenKeys.accessToken);
const initialRefreshToken = getStoredItem(API_CONFIG.tokenKeys.refreshToken);
const initialUser = getStoredUser();

const initialState: AuthState = {
  user: initialUser,
  accessToken: initialAccessToken,
  refreshToken: initialRefreshToken,
  isAuthenticated: Boolean(initialAccessToken && initialUser),
  isInitializing: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: UserProfile;
        accessToken: string;
        refreshToken?: string;
      }>,
    ) => {
      const { user, accessToken, refreshToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      if (refreshToken) state.refreshToken = refreshToken;
      state.isAuthenticated = true;

      try {
        localStorage.setItem(API_CONFIG.tokenKeys.accessToken, accessToken);
        if (refreshToken) {
          localStorage.setItem(API_CONFIG.tokenKeys.refreshToken, refreshToken);
        }
        localStorage.setItem(API_CONFIG.tokenKeys.userProfile, JSON.stringify(user));
        if (user.organizationId || user.tenantId) {
          localStorage.setItem(
            API_CONFIG.tokenKeys.tenantId,
            user.tenantId || user.organizationId || '',
          );
        }
      } catch (err) {
        console.error('Failed to persist auth credentials', err);
      }
    },
    updateUser: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        try {
          localStorage.setItem(API_CONFIG.tokenKeys.userProfile, JSON.stringify(state.user));
        } catch (err) {
          console.error('Failed to persist user profile update', err);
        }
      }
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;

      try {
        localStorage.removeItem(API_CONFIG.tokenKeys.accessToken);
        localStorage.removeItem(API_CONFIG.tokenKeys.refreshToken);
        localStorage.removeItem(API_CONFIG.tokenKeys.userProfile);
        localStorage.removeItem(API_CONFIG.tokenKeys.tenantId);
      } catch (err) {
        console.error('Failed to clear stored auth credentials', err);
      }
    },
    setInitializing: (state, action: PayloadAction<boolean>) => {
      state.isInitializing = action.payload;
    },
  },
});

export const { setCredentials, updateUser, logout, setInitializing } = authSlice.actions;
export default authSlice.reducer;
