export const ROUTES = {
    PUBLIC: {
        HOME: '/',
        ABOUT: '/about',
        LOGIN: '/login',
    },
    APP: {
        DASHBOARD: '/app/dashboard',
        PROFILE: '/app/profile',
        SETTINGS: '/app/settings',
        UNAUTHORIZED: '/unauthorized',
    },
    ADMISSION: {
        APPLY: '/app/admissions/new',
        LIST: '/app/admissions/review',
        MY: '/app/admissions/my',
        DETAILS: (id: string) => `/app/admissions/${id}`,
        REVIEW: (id: string) => `/app/admissions/review/${id}`,
    },
    STUDENT: {
        LIST: '/app/students',
        PROMOTE: '/app/students/promote',
        MY_CHILDREN: '/app/students/my-children',
        HISTORY: '/app/student/academic-history',
    },
    ATTENDANCE: {
        MARK: '/app/attendance/mark',
        LEAVES: '/app/attendance/leaves',
        MY_ATTENDANCE: '/app/attendance/my',
    }
};
