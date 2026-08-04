import { PermissionEngine } from '../../core/permissions/permission-engine';
import { PermissionAction, PermissionResource, UserRole } from '../../types/role.types';

export const usePermissions = () => {
  return {
    can: (action: PermissionAction, resource: PermissionResource) =>
      PermissionEngine.can(action, resource),
    hasRole: (role: UserRole | UserRole[]) => PermissionEngine.hasRole(role),
  };
};
