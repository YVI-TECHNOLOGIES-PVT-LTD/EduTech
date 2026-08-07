import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UiState {
  sidebarOpen: boolean;
  themeMode: 'light' | 'dark' | 'system';
  activeNotificationDrawer: boolean;
  globalSearchOpen: boolean;
}

const initialState: UiState = {
  sidebarOpen: true,
  themeMode: 'light',
  activeNotificationDrawer: false,
  globalSearchOpen: false,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setThemeMode: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.themeMode = action.payload;
    },
    toggleNotificationDrawer: (state) => {
      state.activeNotificationDrawer = !state.activeNotificationDrawer;
    },
    setGlobalSearchOpen: (state, action: PayloadAction<boolean>) => {
      state.globalSearchOpen = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setThemeMode,
  toggleNotificationDrawer,
  setGlobalSearchOpen,
} = uiSlice.actions;
export default uiSlice.reducer;
