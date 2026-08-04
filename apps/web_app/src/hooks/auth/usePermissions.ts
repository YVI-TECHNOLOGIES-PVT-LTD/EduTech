import { useAuth } from '../../context/AuthContext';
import { PermissionService } from '../../services/auth/PermissionService';

/**
 * Convenience hook exposing permission and role checks.
 * Delegates to AuthContext which already holds the enriched user.
 */
export const usePermissions = () => {
    const { user, hasPermission, hasRole } = useAuth();

    return {
        user,
        hasPermission,
        hasRole,

        /** Check if the user has ANY of the given roles */
        hasAnyRole: (roles: string[]) => {
            if (!user) return false;
            return PermissionService.hasAnyRole(user, roles);
        },

        /** Check if the user has ALL of the given permissions */
        hasAllPermissions: (permissions: string[]) => {
            if (!user) return false;
            return PermissionService.hasAllPermissions(user, permissions);
        },

        /** True if user is ADMIN or SUPERADMIN */
        isAdmin: hasRole('ADMIN') || hasRole('SUPERADMIN'),
        isFaculty: hasRole('FACULTY'),
        isStudent: hasRole('STUDENT'),
        isParent: hasRole('PARENT'),
        isExamAdmin: hasRole('EXAM_CELL_ADMIN'),
        isTransportAdmin: hasRole('TRANSPORT_ADMIN'),
    };
};
