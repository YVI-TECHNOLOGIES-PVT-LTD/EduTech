import { ErpModule } from '../config/module_registry';

export const LandingResolver = {
  /**
   * Authoritative role normalization function
   */
  normalizeRole(role?: string | null): string {
    if (!role || typeof role !== 'string') return '';
    return role
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, '_');
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

    // 1. Admin / Institutional Leadership Roles
    const isAdmin = normalizedRoles.some((r: string) =>
      [
        'ADMIN',
        'SUPERADMIN',
        'SUPER_ADMIN',
        'ORG_ADMIN',
        'HOI',
        'PRINCIPAL',
        'HEAD_OF_INSTITUTE',
      ].includes(r),
    );

    if (isAdmin) {
      const destination = '/app/admin/dashboard';
      console.log('[LandingResolver] Admin resolved:', { roles: normalizedRoles, destination });
      return destination;
    }

    // 2. Front Office / Operations / Admissions Desk / Staff Roles
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
        'FINANCE',
        'FINANCE_OFFICER',
      ].includes(r),
    );

    if (isFrontOffice) {
      const destination = '/app/front-office/dashboard';
      console.log('[LandingResolver] Front Office resolved:', {
        roles: normalizedRoles,
        destination,
      });
      return destination;
    }

    // 3. Faculty / Teaching Staff Roles
    const isFaculty = normalizedRoles.some((r: string) => ['FACULTY', 'TEACHER'].includes(r));
    if (isFaculty) {
      const destination = '/app/faculty/dashboard';
      console.log('[LandingResolver] Faculty resolved:', { roles: normalizedRoles, destination });
      return destination;
    }

    // 4. Student Persona Roles
    const isStudent = normalizedRoles.some((r: string) => ['STUDENT'].includes(r));
    if (isStudent) {
      const destination = '/app/student/dashboard';
      console.log('[LandingResolver] Student resolved:', { roles: normalizedRoles, destination });
      return destination;
    }

    // 5. Examination Cell Roles
    const isExamCell = normalizedRoles.some((r: string) =>
      ['EXAM_CELL', 'EXAM_CELL_ADMIN'].includes(r),
    );
    if (isExamCell) {
      const destination = '/app/exam-admin/dashboard';
      console.log('[LandingResolver] Exam Cell resolved:', { roles: normalizedRoles, destination });
      return destination;
    }

    // 6. Parent / Guardian Persona Roles
    const isParent = normalizedRoles.some((r: string) =>
      ['PARENT', 'GUARDIAN', 'ENROLLED_PARENT'].includes(r),
    );
    if (isParent) {
      const destination = '/app/parent/dashboard';
      console.log('[LandingResolver] Parent resolved:', { roles: normalizedRoles, destination });
      return destination;
    }

    // Module-based fallback if roles not explicitly mapped
    if (visibleModules && visibleModules.length > 0) {
      const sorted = [...visibleModules].sort((a, b) => b.priority - a.priority);
      const destination = sorted[0].route;
      console.log('[LandingResolver] Module priority fallback:', { destination });
      return destination;
    }

    // Fallback: Default to Parent dashboard (Safe default, never silently classify unknown as Front Office)
    const fallbackDestination = '/app/parent/dashboard';
    console.log('[LandingResolver] Fallback resolved:', {
      roles: normalizedRoles,
      fallbackDestination,
    });
    return fallbackDestination;
  },
};
