import { UserRole, PermissionAction, PermissionResource } from '../../types/role.types';
import { useAuthStore } from '../../stores/auth.store';

export class PermissionEngine {
  static can(action: PermissionAction, resource: PermissionResource): boolean {
    const user = useAuthStore.getState().user;
    if (!user) return false;

    if (user.role === 'SUPER_ADMIN' || user.role === 'SCHOOL_ADMIN') {
      return true;
    }

    const permission = user.permissions.find((p) => p.resource === resource);
    if (!permission) return false;

    return permission.actions.includes(action);
  }

  static hasRole(role: UserRole | UserRole[]): boolean {
    const user = useAuthStore.getState().user;
    if (!user) return false;

    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  }
}
