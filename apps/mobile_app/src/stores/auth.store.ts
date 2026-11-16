import { create } from 'zustand';
import { AuthTokens, UserProfile } from '../types/auth.types';

interface AuthStoreState {
  isAuthenticated: boolean;
  isHydrating: boolean;
  user: UserProfile | null;
  tokens: AuthTokens | null;
  setAuth: (user: UserProfile, tokens: AuthTokens) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setHydrating: (hydrating: boolean) => void;
  updateUser: (user: Partial<UserProfile>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  isAuthenticated: false,
  isHydrating: true,
  user: null,
  tokens: null,
  setAuth: (user, tokens) =>
    set({
      isAuthenticated: true,
      isHydrating: false,
      user,
      tokens,
    }),
  setTokens: (tokens) =>
    set((state) => ({
      tokens,
      isAuthenticated: !!tokens?.accessToken,
    })),
  setHydrating: (isHydrating) => set({ isHydrating }),
  updateUser: (updatedFields) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updatedFields } : null,
    })),
  logout: () =>
    set({
      isAuthenticated: false,
      isHydrating: false,
      user: null,
      tokens: null,
    }),
}));
