import { create } from 'zustand';
import { UserProfile, UserRole } from '../types';

interface UserState {
  profile: UserProfile | null;
  activeRole: UserRole | null;
  setProfile: (profile: UserProfile | null) => void;
  setActiveRole: (role: UserRole) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  activeRole: null,
  setProfile: (profile) =>
    set({
      profile,
      activeRole: (profile?.role as UserRole) || (profile?.roles?.[0] as UserRole) || null,
    }),
  setActiveRole: (role) => set({ activeRole: role }),
  clearUser: () => set({ profile: null, activeRole: null }),
}));
