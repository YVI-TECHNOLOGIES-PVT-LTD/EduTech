import { create } from 'zustand';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeMode } from '../types/theme.types';

const THEME_STORAGE_KEY = '@edutrack_theme_mode';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
  initializeTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'system',
  setMode: async (mode: ThemeMode) => {
    set({ mode });
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {
      console.warn('Failed to persist theme mode', e);
    }
  },
  toggleTheme: async () => {
    const current = get().mode;
    const nextMode: ThemeMode = current === 'light' ? 'dark' : 'light';
    await get().setMode(nextMode);
  },
  initializeTheme: async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode && (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system')) {
        set({ mode: savedMode as ThemeMode });
      }
    } catch (e) {
      console.warn('Failed to load persisted theme mode', e);
    }
  },
}));
