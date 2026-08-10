import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PermissionState {
  roles: string[];
  permissions: string[];
  moduleAccess: Record<string, boolean>;
}

const initialState: PermissionState = {
  roles: [],
  permissions: [],
  moduleAccess: {},
};

export const permissionSlice = createSlice({
  name: 'permission',
  initialState,
  reducers: {
    setPermissions: (
      state,
      action: PayloadAction<{
        roles?: string[];
        permissions?: string[];
        moduleAccess?: Record<string, boolean>;
      }>,
    ) => {
      if (action.payload.roles) state.roles = action.payload.roles;
      if (action.payload.permissions) state.permissions = action.payload.permissions;
      if (action.payload.moduleAccess) state.moduleAccess = action.payload.moduleAccess;
    },
    clearPermissions: (state) => {
      state.roles = [];
      state.permissions = [];
      state.moduleAccess = {};
    },
  },
});

export const { setPermissions, clearPermissions } = permissionSlice.actions;
export default permissionSlice.reducer;
