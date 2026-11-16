import {
  UserRole,
  PermissionAction,
  PermissionResource,
  UserPermission,
} from '../../types/role.types';
import { useAuthStore } from '../../stores/auth.store';

export class PermissionEngine {
  static can(action: PermissionAction, resource: PermissionResource): boolean {
    const user = useAuthStore.getState().user;
    if (!user) return false;

    const userRoles = user.roles || (user.role ? [user.role as string] : []);
    if (
      userRoles.includes('SUPER_ADMIN') ||
      userRoles.includes('SCHOOL_ADMIN') ||
      userRoles.includes('ADMIN')
    ) {
      return true;
    }

    if (!user.permissions || !Array.isArray(user.permissions)) {
      return false;
    }

    // Check if permissions are array of strings or UserPermission objects
    const hasObjectMatch = user.permissions.some((p: any) => {
      if (typeof p === 'object' && p?.resource === resource) {
        return Array.isArray(p.actions) && p.actions.includes(action);
      }
      if (typeof p === 'string') {
        const lowerRes = resource.toLowerCase();
        const lowerAct = action.toLowerCase();
        return p === `${lowerRes}.${lowerAct}` || p === `${lowerRes}.*` || p === '*';
      }
      return false;
    });

    return hasObjectMatch;
  }

  static hasRole(role: UserRole | UserRole[]): boolean {
    const user = useAuthStore.getState().user;
    if (!user) return false;

    const userRoles = user.roles || (user.role ? [user.role as string] : []);
    if (Array.isArray(role)) {
      return role.some((r) => userRoles.includes(r));
    }
    return userRoles.includes(role);
  }
}
