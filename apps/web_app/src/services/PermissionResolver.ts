import { EnrichedUser } from '../types/auth';

export const PermissionResolver = {
    resolvePermissions(user: EnrichedUser | null): string[] {
        if (!user) return [];
        return user.permissions || [];
    },
    
    resolveRoles(user: EnrichedUser | null): string[] {
        if (!user) return [];
        return user.roles || [];
    },
    
    hasPermission(user: EnrichedUser | null, permission: string): boolean {
        if (!user) return false;
        // Super admin bypasses all permission checks
        if (user.roles?.some(r => r.toUpperCase() === 'SUPERADMIN')) return true;
        return user.permissions?.includes(permission) || false;
    }
};
