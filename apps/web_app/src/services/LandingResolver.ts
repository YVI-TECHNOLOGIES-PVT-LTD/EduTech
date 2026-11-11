import { ErpModule } from '../config/module_registry';

let lastLoggedResolutionKey: string | null = null;

function logResolutionOnce(normalizedRoles: string[], destination: string, label: string) {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') return;
  const key = `${normalizedRoles.join(',')}=>${destination}`;
  if (lastLoggedResolutionKey === key) return;
  lastLoggedResolutionKey = key;
  console.debug(`[LandingResolver] ${label}:`, { roles: normalizedRoles, destination });
}

export const LandingResolver = {
  /**
   * Authoritative role normalization function aligned with backend SessionService/role-normalization.
   */
  normalizeRole(role?: string | null): string {
    if (!role || typeof role !== 'string') return '';
    const trimmed = role.trim();
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
  },

  resolveLandingRoute(
    roles: string[] = [],
    visibleModules: ErpModule[] = [],
    userContext?: any,
  ): string {
    const rawRoles: string[] =
      Array.isArray(roles) && roles.length > 0
        ? roles
        : Array.isArray(userContext?.roles) && userContext.roles.length > 0
          ? userContext.roles
          : userContext?.role
            ? [userContext.role]
            : [];

    const normalizedRoles = rawRoles
      .map((r: string) => LandingResolver.normalizeRole(r))
      .filter(Boolean);

    // 1. Super Admin Roles (Enterprise Institutional Oversight)
    const isSuperAdmin = normalizedRoles.some((r: string) =>
      ['SUPERADMIN', 'SUPER_ADMIN'].includes(r),
    );

    if (isSuperAdmin) {
      const destination = '/app/super-admin/dashboard';
      logResolutionOnce(normalizedRoles, destination, 'Super Admin resolved');
      return destination;
    }

    // 2. Admin / Institutional Leadership Roles
    const isAdmin = normalizedRoles.some((r: string) =>
      ['ADMIN', 'ORG_ADMIN', 'HOI', 'PRINCIPAL', 'HEAD_OF_INSTITUTE'].includes(r),
    );

    if (isAdmin) {
      const destination = '/app/admin/dashboard';
      logResolutionOnce(normalizedRoles, destination, 'Admin resolved');
      return destination;
    }

    // 3. Faculty / Teaching Staff Roles (Explicit priority for instructional staff)
    const isTeacher = normalizedRoles.some((r: string) => ['FACULTY', 'TEACHER'].includes(r));
    if (isTeacher) {
      const destination = '/app/teacher/dashboard';
      logResolutionOnce(normalizedRoles, destination, 'Teacher resolved');
      return destination;
    }

    // 4. Finance / Accounting Persona Roles
    const isFinance = normalizedRoles.some((r: string) =>
      ['FINANCE', 'FINANCE_OFFICER', 'ACCOUNTANT', 'FINANCE_MANAGER', 'BURSAR'].includes(r),
    );

    if (isFinance) {
      const destination = '/app/finance/dashboard';
      logResolutionOnce(normalizedRoles, destination, 'Finance resolved');
      return destination;
    }

    // 5. Front Office / Operations / Admissions Desk / Staff Roles
    const isFrontOffice = normalizedRoles.some((r: string) =>
      [
        'FRONT_OFFICE',
        'FO',
        'RECEPTIONIST',
        'STAFF',
        'ADMISSION_OFFICER',
        'ADMISSIONS_OFFICER',
        'COUNSELLOR',
        'COUNSELOR',
      ].includes(r),
    );

    if (isFrontOffice) {
      const destination = '/app/front-office/dashboard';
      logResolutionOnce(normalizedRoles, destination, 'Front Office resolved');
      return destination;
    }

    // 6. Student Persona Roles
    const isStudent = normalizedRoles.some((r: string) => ['STUDENT'].includes(r));
    if (isStudent) {
      const destination = '/app/student/dashboard';
      logResolutionOnce(normalizedRoles, destination, 'Student resolved');
      return destination;
    }

    // 7. Examination Cell Roles
    const isExamCell = normalizedRoles.some((r: string) =>
      ['EXAM_CELL', 'EXAM_CELL_ADMIN'].includes(r),
    );
    if (isExamCell) {
      const destination = '/app/exam-admin/dashboard';
      logResolutionOnce(normalizedRoles, destination, 'Exam Cell resolved');
      return destination;
    }

    // 8. Parent / Guardian Persona Roles
    const isParent = normalizedRoles.some((r: string) =>
      ['PARENT', 'GUARDIAN', 'ENROLLED_PARENT'].includes(r),
    );
    if (isParent) {
      const destination = '/app/parent/dashboard';
      logResolutionOnce(normalizedRoles, destination, 'Parent resolved');
      return destination;
    }

    // Module-based fallback if roles not explicitly mapped
    if (visibleModules && visibleModules.length > 0) {
      const sorted = [...visibleModules].sort((a, b) => b.priority - a.priority);
      const destination = sorted[0].route;
      logResolutionOnce(normalizedRoles, destination, 'Module priority fallback');
      return destination;
    }

    // Fallback: Default to Parent dashboard (Safe default, never silently classify unknown as Front Office)
    const fallbackDestination = '/app/parent/dashboard';
    logResolutionOnce(normalizedRoles, fallbackDestination, 'Fallback resolved');
    return fallbackDestination;
  },
};
