import { useAppSelector } from '@/app/store';
import { ROLES } from '@/shared/constants/roles';

export const usePermission = () => {
  const user = useAppSelector((state) => state.auth.user);
  const userRoles = user?.roles || [];
  const userRole = userRoles[0] || '';
  const userPermissions = user?.permissions || [];

  const isSuperAdmin = userRoles.some(
    (r) =>
      r.toUpperCase() === 'SUPERADMIN' ||
      r.toUpperCase() === 'SUPER_ADMIN' ||
      r.toUpperCase() === 'ADMIN' ||
      r.toUpperCase() === 'ORG_ADMIN',
  );

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
    const searchNorm = role.toUpperCase().replace(/[\s_-]+/g, '_');
    return userRoles.some((r) => r.toUpperCase().replace(/[\s_-]+/g, '_') === searchNorm);
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
