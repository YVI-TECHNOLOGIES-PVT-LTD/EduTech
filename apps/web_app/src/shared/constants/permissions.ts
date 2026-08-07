export const PERMISSIONS = {
  // System & Tenant Administration
  ORGANIZATION_READ: 'organization:read',
  ORGANIZATION_WRITE: 'organization:write',
  ORGANIZATION_DELETE: 'organization:delete',

  // Users & RBAC
  USER_READ: 'user:read',
  USER_WRITE: 'user:write',
  USER_DELETE: 'user:delete',
  ROLE_READ: 'role:read',
  ROLE_WRITE: 'role:write',
  PERMISSION_ASSIGN: 'permission:assign',

  // HR & Staff
  DEPARTMENT_READ: 'department:read',
  DEPARTMENT_WRITE: 'department:write',
  DESIGNATION_READ: 'designation:read',
  DESIGNATION_WRITE: 'designation:write',
  STAFF_READ: 'staff:read',
  STAFF_WRITE: 'staff:write',

  // Academics
  ACADEMIC_YEAR_READ: 'academic_year:read',
  ACADEMIC_YEAR_WRITE: 'academic_year:write',
  GRADE_READ: 'grade:read',
  GRADE_WRITE: 'grade:write',
  SECTION_READ: 'section:read',
  SECTION_WRITE: 'section:write',

  // CRM Leads
  LEAD_READ: 'lead:read',
  LEAD_WRITE: 'lead:write',
  LEAD_DELETE: 'lead:delete',
  LEAD_ACTIVITY_WRITE: 'lead_activity:write',

  // Admissions Pipeline
  APPLICATION_READ: 'application:read',
  APPLICATION_WRITE: 'application:write',
  APPLICATION_DECIDE: 'application:decide',
  ASSESSMENT_WRITE: 'assessment:write',
  FEE_PAYMENT_COLLECT: 'fee_payment:collect',

  // Students & Parents
  STUDENT_READ: 'student:read',
  STUDENT_WRITE: 'student:write',
  STUDENT_ENROLL: 'student:enroll',
  PARENT_READ: 'parent:read',
  PARENT_WRITE: 'parent:write',

  // System & Reports
  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write',
  REPORTS_VIEW: 'reports:view',
  AUDIT_READ: 'audit:read',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
