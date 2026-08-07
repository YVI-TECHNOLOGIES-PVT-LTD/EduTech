/**
 * Enterprise Feature Flags System
 * Allows enabling/disabling modular features without code restructuring.
 */
export const FEATURE_FLAGS = {
  // Core Stage-1 Features
  ORGANIZATION_MANAGEMENT: true,
  USERS_AND_RBAC: true,
  HR_MANAGEMENT: true,
  ACADEMIC_SETUP: true,
  CRM_LEADS: true,
  ADMISSIONS_PIPELINE: true,
  STUDENT_ENROLLMENT: true,
  SYSTEM_SETTINGS: true,
  REPORTS_AND_ANALYTICS: true,
  AUDIT_LOGS: true,

  // Advanced & Stage-2 Preparedness Flags
  AI_LEAD_SCORING: true,
  DARK_MODE: true,
  CSV_EXCEL_EXPORT: true,
  PDF_DOCUMENT_VIEWER: true,
  MULTI_TENANT_SWITCHER: true,
  NOTIFICATIONS_DRAWER: true,
  GLOBAL_SEARCH: true,

  // Stage-2 Portal Placeholders (Disabled in Stage-1 Admin Portal)
  PARENT_PORTAL: false,
  STUDENT_PORTAL: false,
  TEACHER_PORTAL: false,
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

export const isFeatureEnabled = (flag: FeatureFlagKey): boolean => {
  return FEATURE_FLAGS[flag] ?? false;
};
