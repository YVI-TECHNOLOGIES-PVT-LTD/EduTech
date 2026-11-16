import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { API_CONFIG } from '@/config/api';

export interface TenantState {
  activeTenantId: string | null;
  tenantName: string | null;
  selectedSchoolId: string | null;
  selectedAcademicYearId: string | null;
  activeRole: string | null;
}

const getStoredTenantId = (): string | null => {
  try {
    return localStorage.getItem(API_CONFIG.tokenKeys.tenantId);
  } catch {
    return null;
  }
};

const initialState: TenantState = {
  activeTenantId: getStoredTenantId(),
  tenantName: null,
  selectedSchoolId: null,
  selectedAcademicYearId: null,
  activeRole: null,
};

export const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    setActiveTenant: (state, action: PayloadAction<{ id: string; name?: string }>) => {
      state.activeTenantId = action.payload.id;
      if (action.payload.name) state.tenantName = action.payload.name;
      try {
        localStorage.setItem(API_CONFIG.tokenKeys.tenantId, action.payload.id);
      } catch (err) {
        console.error('Failed to persist tenant ID', err);
      }
    },
    clearTenant: (state) => {
      state.activeTenantId = null;
      state.tenantName = null;
      try {
        localStorage.removeItem(API_CONFIG.tokenKeys.tenantId);
      } catch (err) {
        console.error('Failed to clear stored tenant ID', err);
      }
    },
    setSchoolId: (state, action: PayloadAction<string | null>) => {
      state.selectedSchoolId = action.payload;
    },
    setAcademicYearId: (state, action: PayloadAction<string | null>) => {
      state.selectedAcademicYearId = action.payload;
    },
    setActiveRole: (state, action: PayloadAction<string | null>) => {
      state.activeRole = action.payload;
    },
  },
});

export const { setActiveTenant, clearTenant, setSchoolId, setAcademicYearId, setActiveRole } =
  tenantSlice.actions;

export default tenantSlice.reducer;
