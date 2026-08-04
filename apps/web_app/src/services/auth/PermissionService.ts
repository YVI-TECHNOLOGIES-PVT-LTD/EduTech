import { apiClient } from '../../lib/api-client';
import type { EnrichedUser } from '../../types/auth';

export const PermissionService = {
    /**
     * Fetch the enriched user profile + permissions from the backend.
     */
    fetchUserPermissions: async (): Promise<{ permissions: string[]; roles: string[] }> => {
        const res = await apiClient.get('/me');
        const user: EnrichedUser = res.data.user;
        return {
            permissions: user.permissions ?? [],
            roles: user.roles ?? [],
        };
    },

    /**
     * Check if a user has a specific permission.
     * Admins and SuperAdmins bypass all permission checks.
     */
    checkPermission: (user: EnrichedUser, permission: string): boolean => {
        if (!user) return false;
        if (user.roles?.some(r => r === 'SUPERADMIN')) return true;
        return user.permissions?.includes(permission) ?? false;
    },

    /**
     * Check if a user has a specific role.
     */
    checkRole: (user: EnrichedUser, role: string): boolean => {
        return user?.roles?.includes(role) ?? false;
    },

    /**
     * Check if a user has ANY of the provided roles.
     */
    hasAnyRole: (user: EnrichedUser, roles: string[]): boolean => {
        return roles.some(role => PermissionService.checkRole(user, role));
    },

    /**
     * Check if a user has ALL of the provided permissions.
     */
    hasAllPermissions: (user: EnrichedUser, permissions: string[]): boolean => {
        return permissions.every(p => PermissionService.checkPermission(user, p));
    },
};
