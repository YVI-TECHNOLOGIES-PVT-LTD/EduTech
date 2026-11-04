/**
 * EduTrack ERP Mobile V1 — Canonical API Endpoints
 * Source of Truth: schema.prisma & Backend Routes
 */

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/v1/auth/login',
    REGISTER: '/v1/admission/register',
    VERIFY_OTP: '/v1/admission/verify-otp',
    REFRESH: '/v1/auth/refresh',
    LOGOUT: '/v1/auth/logout',
  },
  METADATA: {
    CONFIG: '/public/admission/config',
    ACADEMIC_YEARS: '/public/academic-years',
    CLASSES: '/public/classes',
    DOCUMENT_TYPES: '/v1/applications/document-types',
  },
  PARENTS: {
    MY_STUDENTS: (parentId: string) => `/v1/parents/${parentId}/students`,
    PROFILE: (id: string) => `/v1/parents/${id}`,
  },
  APPLICATIONS: {
    LIST_MINE: '/v1/applications?mine=true',
    BY_ID: (id: string) => `/v1/applications/${id}`,
    CREATE: '/v1/applications',
    UPDATE_STATUS: (id: string) => `/v1/applications/${id}/status`,
  },
  DOCUMENTS: {
    LIST: (appId: string) => `/v1/applications/${appId}/documents`,
    UPLOAD: (appId: string) => `/v1/applications/${appId}/documents`,
    SIGNED_URL: (docId: string) => `/v1/applications/documents/${docId}/signed-url`,
  },
  ASSESSMENT: {
    BY_APPLICATION: (appId: string) => `/v1/applications/${appId}/assessment`,
  },
  DECISION: {
    BY_APPLICATION: (appId: string) => `/v1/applications/${appId}/decision`,
  },
  FEES: {
    SUMMARY: (appId: string) => `/v1/applications/${appId}/fee`,
    PAYMENT: (appId: string) => `/v1/applications/${appId}/payment`,
    RECEIPT: (appId: string) => `/v1/applications/${appId}/receipt`,
    MY_CHILDREN: '/v1/fees/my',
    CHILD_DETAILS: (studentId: string) => `/v1/fees/my/children/${studentId}`,
    CREATE_PAYMENT_ORDER: '/v1/fees/my/payments/create-order',
    VERIFY_PAYMENT: '/v1/fees/my/payments/verify',
    RECEIPT_BY_TX: (id: string) => `/v1/fees/my/receipts/${id}`,
  },
  ADMISSION_FEES: {
    SUMMARY: (appId: string) => `/v1/applications/${appId}/fee`,
    PAYMENT: (appId: string) => `/v1/applications/${appId}/payment`,
    RECEIPT: (appId: string) => `/v1/applications/${appId}/receipt`,
  },
  TIMELINE: {
    BY_APPLICATION: (appId: string) => `/v1/applications/${appId}/timeline`,
  },
  FINANCE: {
    MY_FEES: '/v1/fees/my',
    CHILD_FEES: (studentId: string) => `/v1/fees/my/children/${studentId}`,
    RAZORPAY_CONFIG: '/razorpay/config',
    CREATE_ORDER: '/create-order',
    VERIFY_PAYMENT: '/verify-payment',
    RECEIPT_BY_ID: (id: string) => `/v1/fees/receipts/${id}`,
  },
  NOTIFICATIONS: {
    LIST: '/v1/notifications',
    UNREAD_COUNT: '/v1/notifications/unread-count',
    MARK_READ: (id: string) => `/v1/notifications/${id}/read`,
    MARK_ALL_READ: '/v1/notifications/mark-all-read',
    DELETE: (id: string) => `/v1/notifications/${id}`,
  },
  ACADEMICS: {
    ATTENDANCE_SUMMARY: (studentId: string) => `/v1/students/${studentId}/attendance/summary`,
    ATTENDANCE_TIMELINE: (studentId: string) => `/v1/students/${studentId}/attendance/timeline`,
    TIMETABLE_TODAY: (studentId: string) => `/v1/students/${studentId}/timetable/today`,
    TIMETABLE_WEEK: (studentId: string) => `/v1/students/${studentId}/timetable/week`,
    HOMEWORK: (studentId: string) => `/v1/students/${studentId}/homework`,
    ASSIGNMENTS: (studentId: string) => `/v1/students/${studentId}/assignments`,
    EXAMS: (studentId: string) => `/v1/students/${studentId}/exams`,
    RESULTS: (studentId: string) => `/v1/students/${studentId}/results`,
  },
  HELPDESK: {
    TICKETS: '/v1/helpdesk/tickets',
    BY_ID: (id: string) => `/v1/helpdesk/tickets/${id}`,
    CREATE_TICKET: '/v1/helpdesk/tickets',
    REPLIES: (id: string) => `/v1/helpdesk/tickets/${id}/replies`,
  },
  TRANSPORT: {
    ALLOCATION: (studentId: string) => `/v1/students/${studentId}/transport`,
    ROUTES: '/public/transport-routes',
  },
  LIBRARY: {
    ISSUED_BOOKS: (studentId: string) => `/v1/students/${studentId}/library`,
    BORROWING_HISTORY: (studentId: string) => `/v1/students/${studentId}/library/history`,
  },
  COMMUNICATION: {
    FEEDS: '/communication/feeds',
    FEED_BY_ID: (id: string) => `/communication/feeds/${id}`,
    REACT: (id: string) => `/communication/feeds/${id}/react`,
    REACTIONS_CATALOG: (id: string) => `/communication/reactions/catalog`,
    COMMENTS: (id: string) => `/communication/feeds/${id}/comments`,
    DELETE_COMMENT: (id: string) => `/communication/comments/${id}`,
  },
  HELPDESK: {
    CATEGORIES: '/communication/helpdesk/categories',
    TICKETS: '/communication/helpdesk/tickets',
    TICKET_BY_ID: (id: string) => `/communication/helpdesk/tickets/${id}`,
    CREATE_TICKET: '/communication/helpdesk/tickets',
    UPDATE_STATUS: (id: string) => `/communication/helpdesk/tickets/${id}/status`,
    MESSAGES: (id: string) => `/communication/helpdesk/tickets/${id}/messages`,
  },
} as const;
