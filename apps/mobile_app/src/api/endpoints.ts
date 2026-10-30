/**
 * EduTrack ERP Mobile V1 — Canonical API Endpoints
 * Source of Truth: MOBILE_IMPLEMENTATION_GATE.md
 */

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/v1/auth/login',
    REGISTER: '/v1/admission/register',
    VERIFY_OTP: '/v1/admission/verify-otp',
  },
  METADATA: {
    CONFIG: '/public/admission/config',
    ACADEMIC_YEARS: '/public/academic-years',
    CLASSES: '/public/classes',
    DOCUMENT_TYPES: '/v1/applications/document-types',
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
  TIMELINE: {
    BY_APPLICATION: (appId: string) => `/v1/applications/${appId}/timeline`,
  },
  NOTIFICATIONS: {
    LIST: '/v1/notifications',
    UNREAD_COUNT: '/v1/notifications/unread-count',
    MARK_READ: (id: string) => `/v1/notifications/${id}/read`,
    MARK_ALL_READ: '/v1/notifications/mark-all-read',
  },
} as const;
