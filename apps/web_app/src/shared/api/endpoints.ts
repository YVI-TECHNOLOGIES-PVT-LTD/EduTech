export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  ORGANIZATION: {
    PROFILE: '/organization/profile',
    UPDATE: '/organization/update',
    SETTINGS: '/organization/settings',
  },
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    ROLES: '/users/roles',
    PERMISSIONS: '/users/permissions',
  },
  HR: {
    DEPARTMENTS: '/hr/departments',
    DESIGNATIONS: '/hr/designations',
    STAFF: '/hr/staff',
    STAFF_BY_ID: (id: string) => `/hr/staff/${id}`,
  },
  ACADEMICS: {
    YEARS: '/academics/years',
    GRADES: '/academics/grades',
    SECTIONS: '/academics/sections',
  },
  CRM: {
    LEADS: '/crm/leads',
    LEAD_BY_ID: (id: string) => `/crm/leads/${id}`,
    LEAD_ACTIVITIES: (leadId: string) => `/crm/leads/${leadId}/activities`,
    CAMPUS_VISITS: '/crm/campus-visits',
    AI_SCORE: (leadId: string) => `/crm/leads/${leadId}/score`,
  },
  ADMISSIONS: {
    APPLICATIONS: '/admissions/applications',
    APPLICATION_BY_ID: (id: string) => `/admissions/applications/${id}`,
    DOCUMENTS: (appId: string) => `/admissions/applications/${appId}/documents`,
    ASSESSMENT: (appId: string) => `/admissions/applications/${appId}/assessment`,
    DECISION: (appId: string) => `/admissions/applications/${appId}/decision`,
    FEES: (appId: string) => `/admissions/applications/${appId}/fees`,
  },
  STUDENTS: {
    DIRECTORY: '/students',
    STUDENT_BY_ID: (id: string) => `/students/${id}`,
    PARENTS: '/students/parents',
    ENROLL: '/students/enroll',
  },
  REPORTS: {
    ADMISSIONS: '/reports/admissions',
    STUDENTS: '/reports/students',
    FINANCIAL: '/reports/financial',
  },
  AUDIT: {
    LOGS: '/audit/logs',
  },
} as const;
