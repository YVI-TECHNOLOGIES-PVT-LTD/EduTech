/**
 * Canonical role normalization shared across authentication, session resolution,
 * RBAC enforcement, and token minting.
 */
export const ADMIN_DASHBOARD_ROLES = [
  'SUPERADMIN',
  'SUPER_ADMIN',
  'ADMIN',
  'ORG_ADMIN',
  'HOI',
  'HEAD_OF_INSTITUTE',
  'PRINCIPAL',
] as const;

export const FACULTY_DASHBOARD_ROLES = [
  'TEACHER',
  'FACULTY',
  'SUPERADMIN',
  'SUPER_ADMIN',
  'ADMIN',
  'ORG_ADMIN',
  'HOI',
  'HEAD_OF_INSTITUTE',
  'PRINCIPAL',
] as const;

export function normalizeRoleName(rawRole?: string | null): string {
  if (!rawRole || typeof rawRole !== 'string') return '';
  const trimmed = rawRole.trim();
  if (!trimmed) return '';

  const collapsed = trimmed.toLowerCase().replace(/[\s\-_]+/g, '');

  if (
    collapsed === 'frontoffice' ||
    collapsed === 'fo' ||
    collapsed === 'receptionist' ||
    collapsed === 'admissionofficer' ||
    collapsed === 'admissionsofficer' ||
    collapsed === 'frontofficeexecutive' ||
    collapsed === 'frontofficestaff' ||
    collapsed === 'admissionsdesk'
  ) {
    return 'FRONT_OFFICE';
  }
  if (collapsed === 'parent' || collapsed === 'guardian') {
    return 'PARENT';
  }
  if (collapsed === 'enrolledparent') {
    return 'ENROLLED_PARENT';
  }
  if (collapsed === 'superadmin' || collapsed === 'superadministrator') {
    return 'SUPERADMIN';
  }
  if (
    collapsed === 'admin' ||
    collapsed === 'administrator' ||
    collapsed === 'orgadmin' ||
    collapsed === 'organizationadmin'
  ) {
    return 'ADMIN';
  }
  if (collapsed === 'counselor' || collapsed === 'counsellor') {
    return 'COUNSELLOR';
  }
  if (collapsed === 'hoi' || collapsed === 'headofinstitute' || collapsed === 'principal') {
    return 'HOI';
  }
  if (
    collapsed === 'financemanager' ||
    collapsed === 'financehead' ||
    collapsed === 'financeadmin'
  ) {
    return 'FINANCE_MANAGER';
  }
  if (collapsed === 'finance' || collapsed === 'financeofficer' || collapsed === 'bursar') {
    return 'FINANCE_OFFICER';
  }
  if (
    collapsed === 'accountant' ||
    collapsed === 'cashier' ||
    collapsed === 'accountsclerk' ||
    collapsed === 'bookkeeper'
  ) {
    return 'ACCOUNTANT';
  }
  if (collapsed === 'teacher' || collapsed === 'faculty') {
    return 'TEACHER';
  }
  if (collapsed === 'staff') {
    return 'STAFF';
  }
  if (collapsed === 'student') {
    return 'STUDENT';
  }
  if (collapsed === 'examcell') {
    return 'EXAM_CELL';
  }
  if (collapsed === 'examcelladmin') {
    return 'EXAM_CELL_ADMIN';
  }

  return trimmed.toUpperCase().replace(/[\s-]+/g, '_');
}

export function normalizeRoles(roles?: Array<string | null | undefined> | null): string[] {
  if (!Array.isArray(roles)) return [];
  const unique: string[] = [];
  for (const role of roles) {
    const canonical = normalizeRoleName(role);
    if (canonical && !unique.includes(canonical)) {
      unique.push(canonical);
    }
  }
  return unique;
}
