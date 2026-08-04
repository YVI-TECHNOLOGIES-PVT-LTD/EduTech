import { create } from 'zustand';
import { AuthTokens, UserProfile } from '../types';

interface AuthStoreState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  tokens: AuthTokens | null;
  setAuth: (user: UserProfile, tokens: AuthTokens) => void;
  updateUser: (user: Partial<UserProfile>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  isAuthenticated: false,
  user: null,
  tokens: null,
  setAuth: (user, tokens) => set({ isAuthenticated: true, user, tokens }),
  updateUser: (updatedFields) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updatedFields } : null,
    })),
  logout: () => set({ isAuthenticated: false, user: null, tokens: null }),
}));
