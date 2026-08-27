/**
 * EduTrack ERP — Single Canonical Route Configuration
 */

export const ROUTES = {
  PUBLIC: {
    HOME: '/',
    ABOUT: '/about',
    VISION: '/vision-mission',
    LEADERSHIP: '/leadership',
    ACADEMICS: '/academics',
    DEPARTMENTS: '/departments',
    FACULTY: '/faculty',
    ADMISSIONS: '/admissions',
    ADMISSION_PROCESS: '/admission-process',
    ENQUIRY: '/enquiry',
    REGISTER: '/admission/register',
    REGISTER_OTP: '/admission/register/otp',
    REGISTER_SUCCESS: '/admission/register/success',
    LOGIN: '/login',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    SESSION_EXPIRED: '/session-expired',
  },
  APP: {
    DASHBOARD: '/app/dashboard',
    FRONT_OFFICE_DASHBOARD: '/app/front-office/dashboard',
    PARENT_DASHBOARD: '/app/parent/dashboard',
    WORKSPACE: '/app/workspace',
    PROFILE: '/app/profile',
    SETTINGS: '/app/settings',
    UNAUTHORIZED: '/app/unauthorized',
  },
  ADMISSION_PORTAL: {
    DASHBOARD: '/app/admissions/dashboard',
    MY_APPLICATIONS: '/app/admissions/my',
    WIZARD: '/app/admissions/wizard',
    DOCUMENTS: '/app/admissions/documents',
    FEES: '/app/admissions/fees',
    STATUS: '/app/admissions/status',
  },
  FRONT_OFFICE: {
    INQUIRIES: '/app/admissions/inquiries',
    REVIEW: '/app/admissions/review',
    EXAMS: '/app/admissions/exams',
    QUEUES: '/app/admissions/queues',
    INTERVIEWS: '/app/admissions/interviews',
    VERIFICATION: '/app/admissions/verification',
    DECISIONS: '/app/admissions/decisions',
    ADMISSION_DECISIONS: '/app/admissions/decisions',
    PEOPLE_STUDENTS: '/app/people/students',
  },
};
