import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '@/shared/store/authSlice';
import tenantReducer from '@/shared/store/tenantSlice';
import uiReducer from '@/shared/store/uiSlice';
import { apiSlice } from './apiSlice';

export const rootReducer = combineReducers({
  auth: authReducer,
  tenant: tenantReducer,
  ui: uiReducer,
  [apiSlice.reducerPath]: apiSlice.reducer,
});
