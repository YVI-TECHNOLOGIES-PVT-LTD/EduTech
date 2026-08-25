import { ErpModule } from '../config/module_registry';

export const LandingResolver = {
  resolveLandingRoute(
    roles: string[] = [],
    visibleModules: ErpModule[] = [],
    userContext?: any,
  ): string {
    const rawRoles =
      roles.length > 0
        ? roles
        : userContext?.roles || (userContext?.role ? [userContext.role] : []);
    const normalizedRoles = rawRoles.map((r: string) =>
      String(r)
        .toUpperCase()
        .replace(/[\s_-]+/g, '_'),
    );

    const isStaff = normalizedRoles.some((r: string) =>
      [
        'ADMIN',
        'SUPERADMIN',
        'SUPER_ADMIN',
        'ORG_ADMIN',
        'FRONT_OFFICE',
        'FO',
        'FRONT_OFFICE_STAFF',
        'RECEPTIONIST',
        'STAFF',
        'FACULTY',
        'ADMISSION_OFFICER',
        'ADMISSIONS_OFFICER',
        'COUNSELLOR',
        'COUNSELOR',
        'HOI',
        'PRINCIPAL',
        'HEAD_OF_INSTITUTE',
        'TEACHER',
        'FINANCE',
        'FINANCE_OFFICER',
        'EXAM_CELL_ADMIN',
        'EXAM_CELL',
      ].includes(r),
    );

    if (isStaff) {
      const destination = '/app/workspace';
      console.log('[PortalRouting]', {
        userId: userContext?.id || userContext?.userId || 'unknown',
        role: normalizedRoles.join(','),
        organizationId: userContext?.school_id || userContext?.org_id || 'unknown',
        portalState: 'STAFF_WORKSPACE',
        destination,
        reason: 'Staff user resolved to School Operations Workspace',
      });
      return destination;
    }

    const isParent = normalizedRoles.some((r: string) =>
      ['PARENT', 'GUARDIAN', 'ENROLLED_PARENT'].includes(r),
    );

    if (isParent) {
      const hasEnrolledStudent = Boolean(
        userContext?.hasEnrolledStudent ||
        userContext?.isPostAdmission ||
        normalizedRoles.includes('ENROLLED_PARENT'),
      );

      if (hasEnrolledStudent) {
        const destination = '/app/parent/dashboard';
        console.log('[PortalRouting]', {
          userId: userContext?.id || userContext?.userId || 'unknown',
          role: normalizedRoles.join(','),
          organizationId: userContext?.school_id || userContext?.org_id || 'unknown',
          portalState: 'POST_ADMISSION_PARENT',
          destination,
          reason: 'Post-admission parent with active enrolled student',
        });
        return destination;
      }

      // Pre-admission applicant/parent
      const destination = '/app/admissions/my';
      console.log('[PortalRouting]', {
        userId: userContext?.id || userContext?.userId || 'unknown',
        role: normalizedRoles.join(','),
        organizationId: userContext?.school_id || userContext?.org_id || 'unknown',
        portalState: 'PRE_ADMISSION_PORTAL',
        destination,
        reason: 'Pre-admission applicant resolved to Admission Portal (My Applications)',
      });
      return destination;
    }

    // Module-based fallback if roles not explicitly mapped
    if (visibleModules && visibleModules.length > 0) {
      const sorted = [...visibleModules].sort((a, b) => b.priority - a.priority);
      const destination = sorted[0].route;
      console.log('[PortalRouting]', {
        userId: userContext?.id || 'unknown',
        role: normalizedRoles.join(','),
        organizationId: userContext?.school_id || userContext?.org_id || 'unknown',
        portalState: 'MODULE_PRIORITY_FALLBACK',
        destination,
        reason: `Module priority resolution: ${sorted[0].name}`,
      });
      return destination;
    }

    const destination = '/app/workspace';
    console.log('[PortalRouting]', {
      userId: userContext?.id || 'unknown',
      role: normalizedRoles.join(','),
      organizationId: userContext?.school_id || userContext?.org_id || 'unknown',
      portalState: 'DEFAULT_FALLBACK',
      destination,
      reason: 'General fallback to workspace',
    });
    return destination;
  },
};
