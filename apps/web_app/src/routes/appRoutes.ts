import { ROUTES } from '../constants/routes';

export const APP_ROUTES_REGISTRY = [
    {
        path: ROUTES.APP.DASHBOARD,
        component: 'Dashboard',
        roles: ['ADMIN', 'SUPERADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
    },
    {
        path: ROUTES.APP.PROFILE,
        component: 'Profile',
        roles: ['ADMIN', 'SUPERADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
    },
    {
        path: ROUTES.APP.SETTINGS,
        component: 'Settings',
        roles: ['ADMIN', 'SUPERADMIN'],
    }
];
