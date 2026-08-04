export const PERMISSIONS = {
    VIEW_DASHBOARD: 'view_dashboard',
    MANAGE_USERS: 'manage_users',
    // TODO: Add more permissions
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
