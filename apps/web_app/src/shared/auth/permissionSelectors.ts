import type { RootState } from '@/app/store';
import { LandingResolver } from '@/services/LandingResolver';

export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectIsInitializing = (state: RootState) => state.auth.isInitializing;

export const selectUserRoles = (state: RootState): string[] => {
  const user = state.auth.user;
  if (user && Array.isArray(user.roles) && user.roles.length > 0) {
    return user.roles;
  }
  return state.permission.roles || [];
};

export const selectUserPermissions = (state: RootState): string[] => {
  const user = state.auth.user;
  if (user && Array.isArray(user.permissions)) return user.permissions;
  return state.permission.permissions || [];
};

export const selectHasPermission = (state: RootState, permissionCode: string): boolean => {
  const user = state.auth.user;
  if (!user) return false;

  const roles = selectUserRoles(state).map((r) => LandingResolver.normalizeRole(r));
  if (
    roles.some(
      (r) => r === 'SUPERADMIN' || r === 'SUPER_ADMIN' || r === 'ADMIN' || r === 'ORG_ADMIN',
    )
  ) {
    return true;
  }

  const permissions = selectUserPermissions(state);
  return permissions.includes(permissionCode);
};

export const selectHasRole = (state: RootState, roleName: string): boolean => {
  const target = LandingResolver.normalizeRole(roleName);
  const roles = selectUserRoles(state).map((r) => LandingResolver.normalizeRole(r));
  return roles.some((r) => r === target);
};

export const selectCanAccessModule = (state: RootState, moduleKey: string): boolean => {
  if (state.permission.moduleAccess[moduleKey] !== undefined) {
    return state.permission.moduleAccess[moduleKey];
  }
  return selectIsAuthenticated(state);
};
