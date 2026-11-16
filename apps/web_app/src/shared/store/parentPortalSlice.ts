import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { logout } from './authSlice';

interface ParentPortalState {
  selectedChildId: string | null;
}

const initialState: ParentPortalState = {
  selectedChildId: null,
};

export const parentPortalSlice = createSlice({
  name: 'parentPortal',
  initialState,
  reducers: {
    setSelectedChildId: (state, action: PayloadAction<string | null>) => {
      state.selectedChildId = action.payload;
    },
    clearSelectedChild: (state) => {
      state.selectedChildId = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, (state) => {
      state.selectedChildId = null;
    });
  },
});

export const { setSelectedChildId, clearSelectedChild } = parentPortalSlice.actions;
export default parentPortalSlice.reducer;
