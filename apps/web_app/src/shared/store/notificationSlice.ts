import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface NotificationUiState {
  isOpen: boolean;
  activeFilter: string;
  unreadCount: number;
}

const initialState: NotificationUiState = {
  isOpen: false,
  activeFilter: 'all',
  unreadCount: 0,
};

export const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    openPanel: (state) => {
      state.isOpen = true;
    },
    closePanel: (state) => {
      state.isOpen = false;
    },
    togglePanel: (state) => {
      state.isOpen = !state.isOpen;
    },
    setFilter: (state, action: PayloadAction<string>) => {
      state.activeFilter = action.payload;
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
    incrementUnreadCount: (state) => {
      state.unreadCount += 1;
    },
    clearUnreadCount: (state) => {
      state.unreadCount = 0;
    },
  },
});

export const {
  openPanel,
  closePanel,
  togglePanel,
  setFilter,
  setUnreadCount,
  incrementUnreadCount,
  clearUnreadCount,
} = notificationSlice.actions;

export default notificationSlice.reducer;
