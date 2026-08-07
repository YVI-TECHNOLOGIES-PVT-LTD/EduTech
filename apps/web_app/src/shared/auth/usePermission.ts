import { useAppSelector } from '@/app/store';
import { ROLES } from '@/shared/constants/roles';

export const usePermission = () => {
  const user = useAppSelector((state) => state.auth.user);
  const userRole = user?.role || '';
  const userPermissions = user?.permissions || [];

  const isSuperAdmin = userRole === ROLES.SUPER_ADMIN;

  const hasPermission = (permission: string): boolean => {
    if (isSuperAdmin) return true;
    return userPermissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (isSuperAdmin) return true;
    return permissions.some((perm) => userPermissions.includes(perm));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (isSuperAdmin) return true;
    return permissions.every((perm) => userPermissions.includes(perm));
  };

  const hasRole = (role: string): boolean => {
    if (isSuperAdmin) return true;
    return userRole === role;
  };

  return {
    user,
    userRole,
    userPermissions,
    isSuperAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    canRead: (resource: string) => hasPermission(`${resource}:read`),
    canWrite: (resource: string) => hasPermission(`${resource}:write`),
    canDelete: (resource: string) => hasPermission(`${resource}:delete`),
    canApprove: (resource: string) => hasPermission(`${resource}:approve`),
    canExport: (resource: string) => hasPermission(`${resource}:export`),
  };
};
