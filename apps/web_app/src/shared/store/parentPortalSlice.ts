import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { logout } from './authSlice';

const SELECTED_CHILD_STORAGE_KEY = 'edutrack_parent_selected_child_id';

const getInitialSelectedChildId = (): string | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(SELECTED_CHILD_STORAGE_KEY);
    }
  } catch {
    // Ignore storage read failures in restricted environments
  }
  return null;
};

interface ParentPortalState {
  selectedChildId: string | null;
}

const initialState: ParentPortalState = {
  selectedChildId: getInitialSelectedChildId(),
};

export const parentPortalSlice = createSlice({
  name: 'parentPortal',
  initialState,
  reducers: {
    setSelectedChildId: (state, action: PayloadAction<string | null>) => {
      state.selectedChildId = action.payload;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          if (action.payload) {
            localStorage.setItem(SELECTED_CHILD_STORAGE_KEY, action.payload);
          } else {
            localStorage.removeItem(SELECTED_CHILD_STORAGE_KEY);
          }
        }
      } catch {
        // Ignore storage write failures
      }
    },
    clearSelectedChild: (state) => {
      state.selectedChildId = null;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem(SELECTED_CHILD_STORAGE_KEY);
        }
      } catch {
        // Ignore storage write failures
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, (state) => {
      state.selectedChildId = null;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem(SELECTED_CHILD_STORAGE_KEY);
        }
      } catch {
        // Ignore storage write failures
      }
    });
  },
});

export const { setSelectedChildId, clearSelectedChild } = parentPortalSlice.actions;
export default parentPortalSlice.reducer;
