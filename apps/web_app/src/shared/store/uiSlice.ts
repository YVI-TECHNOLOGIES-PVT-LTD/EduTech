import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorPreset = 'blue' | 'purple' | 'emerald' | 'slate' | 'corporate';
export type LayoutDensity = 'compact' | 'comfortable' | 'spacious' | 'normal';
export type FontSize = 'small' | 'medium' | 'large';
export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
export type Language = 'en' | 'te';

export interface NotificationPref {
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface UiState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  themeMode: ThemeMode;
  colorPreset: ColorPreset;
  density: LayoutDensity;
  fontSize: FontSize;
  language: Language;
  dateFormat: DateFormat;
  timezone: string;
  reducedMotion: boolean;
  highContrast: boolean;
  notificationsPref: NotificationPref;
  activeNotificationDrawer: boolean;
  globalSearchOpen: boolean;
  globalLoading: boolean;
}

const getStoredItem = (key: string, fallback: string): string => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};

const initialState: UiState = {
  sidebarOpen: true,
  sidebarCollapsed: getStoredItem('erp-sidebar-collapsed', 'false') === 'true',
  themeMode: (getStoredItem('erp-theme', 'light') as ThemeMode) || 'light',
  colorPreset: 'blue',
  density: (getStoredItem('erp-density', 'comfortable') as LayoutDensity) || 'comfortable',
  fontSize: (getStoredItem('erp-font-size', 'medium') as FontSize) || 'medium',
  language: 'en',
  dateFormat: 'DD/MM/YYYY',
  timezone: 'Asia/Kolkata',
  reducedMotion: false,
  highContrast: false,
  notificationsPref: { email: true, push: true, sms: false },
  activeNotificationDrawer: false,
  globalSearchOpen: false,
  globalLoading: false,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
      state.sidebarCollapsed = !state.sidebarOpen;
      try {
        localStorage.setItem('erp-sidebar-collapsed', String(state.sidebarCollapsed));
      } catch {}
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
      state.sidebarCollapsed = !action.payload;
      try {
        localStorage.setItem('erp-sidebar-collapsed', String(state.sidebarCollapsed));
      } catch {}
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
      state.sidebarOpen = !action.payload;
      try {
        localStorage.setItem('erp-sidebar-collapsed', String(action.payload));
      } catch {}
    },
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.themeMode = action.payload;
      try {
        localStorage.setItem('erp-theme', action.payload);
      } catch {}
    },
    setColorPreset: (state, action: PayloadAction<ColorPreset>) => {
      state.colorPreset = action.payload;
    },
    setDensity: (state, action: PayloadAction<LayoutDensity>) => {
      state.density = action.payload;
      try {
        localStorage.setItem('erp-density', action.payload);
      } catch {}
    },
    setFontSize: (state, action: PayloadAction<FontSize>) => {
      state.fontSize = action.payload;
      try {
        localStorage.setItem('erp-font-size', action.payload);
      } catch {}
    },
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.language = action.payload;
    },
    setDateFormat: (state, action: PayloadAction<DateFormat>) => {
      state.dateFormat = action.payload;
    },
    setTimezone: (state, action: PayloadAction<string>) => {
      state.timezone = action.payload;
    },
    toggleReducedMotion: (state) => {
      state.reducedMotion = !state.reducedMotion;
    },
    toggleHighContrast: (state) => {
      state.highContrast = !state.highContrast;
    },
    setNotificationPref: (
      state,
      action: PayloadAction<{ type: 'email' | 'push' | 'sms'; value: boolean }>,
    ) => {
      state.notificationsPref[action.payload.type] = action.payload.value;
    },
    toggleNotificationDrawer: (state) => {
      state.activeNotificationDrawer = !state.activeNotificationDrawer;
    },
    setGlobalSearchOpen: (state, action: PayloadAction<boolean>) => {
      state.globalSearchOpen = action.payload;
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload;
    },
    resetUiDefaults: (state) => {
      state.themeMode = 'light';
      state.colorPreset = 'blue';
      state.density = 'comfortable';
      state.fontSize = 'medium';
      state.language = 'en';
      state.dateFormat = 'DD/MM/YYYY';
      state.timezone = 'Asia/Kolkata';
      state.reducedMotion = false;
      state.highContrast = false;
      state.notificationsPref = { email: true, push: true, sms: false };
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setSidebarCollapsed,
  setThemeMode,
  setColorPreset,
  setDensity,
  setFontSize,
  setLanguage,
  setDateFormat,
  setTimezone,
  toggleReducedMotion,
  toggleHighContrast,
  setNotificationPref,
  toggleNotificationDrawer,
  setGlobalSearchOpen,
  setGlobalLoading,
  resetUiDefaults,
} = uiSlice.actions;

export default uiSlice.reducer;
