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
    LEADS: '/v1/leads',
    LEAD_BY_ID: (id: string) => `/v1/leads/${id}`,
    LEAD_ACTIVITIES: (leadId: string) => `/v1/leads/${leadId}/activities`,
    CAMPUS_VISITS: '/v1/leads/visits',
    QUALIFY: (leadId: string) => `/v1/leads/${leadId}/qualify`,
    CONVERT: (leadId: string) => `/v1/leads/${leadId}/convert`,
  },
  ADMISSIONS: {
    APPLICATIONS: '/v1/applications',
    APPLICATION_BY_ID: (id: string) => `/v1/applications/${id}`,
    DOCUMENTS: (appId: string) => `/v1/applications/${appId}/documents`,
    ASSESSMENT: (appId: string) => `/v1/applications/${appId}/assessment`,
    DECISION: (appId: string) => `/v1/applications/${appId}/decision`,
    FEES: (appId: string) => `/v1/applications/${appId}/fees`,
  },
  STUDENTS: {
    DIRECTORY: '/v1/students',
    STUDENT_BY_ID: (id: string) => `/v1/students/${id}`,
    APPROVED_APPLICATIONS: '/v1/students/approved-applications',
    CONVERT_APPLICATION: (appId: string) => `/v1/students/convert-application/${appId}`,
    ASSIGN_SECTION: (enrollmentId: string) => `/v1/students/enrollments/${enrollmentId}/section`,
    PARENTS: (studentId: string) => `/v1/students/${studentId}/parents`,
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
