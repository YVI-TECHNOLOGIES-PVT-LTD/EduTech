import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '@/shared/store/authSlice';
import permissionReducer from '@/shared/store/permissionSlice';
import uiReducer from '@/shared/store/uiSlice';
import notificationReducer from '@/shared/store/notificationSlice';
import tenantReducer from '@/shared/store/tenantSlice';
import parentPortalReducer from '@/shared/store/parentPortalSlice';
import { apiSlice } from './apiSlice';

export const rootReducer = combineReducers({
  auth: authReducer,
  permission: permissionReducer,
  ui: uiReducer,
  notification: notificationReducer,
  tenant: tenantReducer,
  parentPortal: parentPortalReducer,
  [apiSlice.reducerPath]: apiSlice.reducer,
});
