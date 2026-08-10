import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { API_CONFIG } from '@/config/api';
import type { EnrichedUser } from '@/types/auth';

export type UserProfile = EnrichedUser;

export interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  systemMode: 'UAT' | 'PRODUCTION';
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
  isAuthenticated: Boolean(initialUser),
  isInitializing: false,
  systemMode: 'UAT',
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: UserProfile;
        accessToken?: string | null;
        refreshToken?: string | null;
        systemMode?: 'UAT' | 'PRODUCTION';
      }>,
    ) => {
      const { user, accessToken, refreshToken, systemMode } = action.payload;
      state.user = user;
      if (accessToken !== undefined) state.accessToken = accessToken;
      if (refreshToken !== undefined) state.refreshToken = refreshToken;
      if (systemMode) state.systemMode = systemMode;
      state.isAuthenticated = Boolean(user);

      try {
        localStorage.setItem(API_CONFIG.tokenKeys.userProfile, JSON.stringify(user));
      } catch (err) {
        console.error('Failed to persist user profile in authSlice', err);
      }
    },
    setUser: (state, action: PayloadAction<UserProfile | null>) => {
      state.user = action.payload;
      state.isAuthenticated = Boolean(action.payload);
      try {
        if (action.payload) {
          localStorage.setItem(API_CONFIG.tokenKeys.userProfile, JSON.stringify(action.payload));
        } else {
          localStorage.removeItem(API_CONFIG.tokenKeys.userProfile);
        }
      } catch (err) {
        console.error('Failed to update user profile in authSlice', err);
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
        localStorage.removeItem(API_CONFIG.tokenKeys.userProfile);
      } catch (err) {
        console.error('Failed to clear stored auth profile', err);
      }
    },
    setInitializing: (state, action: PayloadAction<boolean>) => {
      state.isInitializing = action.payload;
    },
    setSystemMode: (state, action: PayloadAction<'UAT' | 'PRODUCTION'>) => {
      state.systemMode = action.payload;
    },
  },
});

export const { setCredentials, setUser, updateUser, logout, setInitializing, setSystemMode } =
  authSlice.actions;
export default authSlice.reducer;
