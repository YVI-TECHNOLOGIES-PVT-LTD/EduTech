import { PermissionEngine } from './permission-engine';

export const POLICIES = {
  canManageAdmission: () => PermissionEngine.can('CREATE', 'ADMISSION'),
  canViewStudents: () => PermissionEngine.can('READ', 'STUDENT'),
  canExportReports: () => PermissionEngine.can('EXPORT', 'REPORTS'),
  canApproveFeeWaivers: () => PermissionEngine.can('APPROVE', 'FINANCE'),
};
