import { ROLE_PERMISSIONS_MAPPING } from '../../config/permissions.config';

export const checkHasPermission = (
    userPermissions: string[],
    userRoles: string[],
    permission: string
): boolean => {
    // Global bypass for Super Admin
    if (userRoles.some(role => role === 'SUPERADMIN')) return true;

    // Check custom permissions list
    if (userPermissions.includes(permission)) return true;

    // Check inherited role permission lists
    return userRoles.some(role => {
        const allowed = ROLE_PERMISSIONS_MAPPING[role] || [];
        return allowed.includes(permission);
    });
};
