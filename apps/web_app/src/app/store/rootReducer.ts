import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '@/shared/store/authSlice';
import permissionReducer from '@/shared/store/permissionSlice';
import uiReducer from '@/shared/store/uiSlice';
import notificationReducer from '@/shared/store/notificationSlice';
import tenantReducer from '@/shared/store/tenantSlice';
import { apiSlice } from './apiSlice';

export const rootReducer = combineReducers({
  auth: authReducer,
  permission: permissionReducer,
  ui: uiReducer,
  notification: notificationReducer,
  tenant: tenantReducer,
  [apiSlice.reducerPath]: apiSlice.reducer,
});
