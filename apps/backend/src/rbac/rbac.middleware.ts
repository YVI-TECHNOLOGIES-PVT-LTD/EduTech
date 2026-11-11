import { Request, Response, NextFunction } from 'express';
import { PermissionCode } from './permissions';
import { logger } from '../utils/logger';
import { ADMIN_DASHBOARD_ROLES, normalizeRoleName } from './role-normalization';

const ROLE_ALIASES: Record<string, string[]> = {
  SUPERADMIN: ['SUPERADMIN', 'SUPER_ADMIN'],
  SUPER_ADMIN: ['SUPERADMIN', 'SUPER_ADMIN'],
  SUPER_ADMINISTRATOR: ['SUPERADMIN', 'SUPER_ADMIN'],
  ADMIN: ['ADMIN', 'ORG_ADMIN'],
  ADMINISTRATOR: ['ADMIN', 'ORG_ADMIN'],
  ORG_ADMIN: ['ADMIN', 'ORG_ADMIN'],
  FRONT_OFFICE: [
    'FRONT_OFFICE',
    'RECEPTIONIST',
    'ADMISSION_OFFICER',
    'ADMISSIONS_OFFICER',
    'STAFF',
  ],
  RECEPTIONIST: ['FRONT_OFFICE', 'RECEPTIONIST', 'STAFF'],
  ADMISSION_OFFICER: ['FRONT_OFFICE', 'ADMISSION_OFFICER', 'ADMISSIONS_OFFICER', 'STAFF'],
  ADMISSIONS_OFFICER: ['FRONT_OFFICE', 'ADMISSION_OFFICER', 'ADMISSIONS_OFFICER', 'STAFF'],
  HEAD_OF_INSTITUTE: ['HOI', 'HEAD_OF_INSTITUTE', 'PRINCIPAL'],
  HOI: ['HOI', 'HEAD_OF_INSTITUTE', 'PRINCIPAL'],
  PRINCIPAL: ['HOI', 'HEAD_OF_INSTITUTE', 'PRINCIPAL'],
  COUNSELLOR: ['COUNSELOR', 'COUNSELLOR'],
  COUNSELOR: ['COUNSELOR', 'COUNSELLOR'],
  ACCOUNTANT: ['ACCOUNTANT'],
  FINANCE: ['FINANCE', 'FINANCE_OFFICER'],
  FINANCE_OFFICER: ['FINANCE_OFFICER', 'FINANCE'],
  FINANCE_MANAGER: ['FINANCE_MANAGER', 'FINANCE_OFFICER', 'FINANCE'],
  DRIVER: ['BUS_DRIVER', 'DRIVER'],
  BUS_DRIVER: ['BUS_DRIVER', 'DRIVER'],
  EXAM_CELL: ['EXAM_CELL', 'EXAM_CELL_ADMIN'],
  EXAM_CELL_ADMIN: ['EXAM_CELL', 'EXAM_CELL_ADMIN'],
  TEACHER: ['TEACHER', 'FACULTY'],
  FACULTY: ['TEACHER', 'FACULTY'],
  STAFF: ['STAFF'],
};

export const getEffectiveRoles = (roles: string[] = []): string[] => {
  const effective = new Set<string>();
  for (const role of roles) {
    if (!role) continue;
    const rawUpper = String(role)
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, '_');
    const canonical = normalizeRoleName(role);
    if (canonical) effective.add(canonical);
    if (rawUpper) effective.add(rawUpper);

    for (const key of [canonical, rawUpper]) {
      const aliases = key ? ROLE_ALIASES[key] : undefined;
      if (aliases) {
        aliases.forEach((alias) => effective.add(alias));
      }
    }
  }
  return Array.from(effective);
};

/** Read-only Applicant360 enrichment GETs — allowed when user can view the application. */
const APPLICANT360_READ_GET_PERMISSIONS = new Set<string>([
  'admission.exam.evaluate',
  'admission.confirm.enroll',
  'admission.fees.initialize',
  'admission.merit.generate',
  'admission.document.view',
  'admission.document.checklist',
]);

function canViewAdmissionApplication(permissions: string[], roles: string[]): boolean {
  if (roles.includes('COUNSELOR')) return true;
  if (roles.includes('ACCOUNTANT')) return true;
  if (permissions.includes('admission.application.view')) return true;
  if (permissions.includes('admission.view_own')) return true;
  if (permissions.includes('admission.review') || permissions.includes('admission.view_all'))
    return true;
  return false;
}

/**
 * Middleware to enforce RBAC permissions using cached context.
 */
export const checkPermission = (requiredPermission: PermissionCode) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. Ensure Auth Middleware ran
    const reqContext = (req as any).context;
    if (!reqContext?.user) {
      return res.status(401).json({ error: 'Unauthorized: No session context' });
    }

    const permissions: string[] = Array.isArray(reqContext.user.permissions)
      ? reqContext.user.permissions
      : [];
    const roles = getEffectiveRoles(reqContext.user.roles || []);
    console.log(
      `[RBAC] User: ${reqContext.user.email}, Required: ${requiredPermission}, Has: ${permissions.length} perms`,
    );

    // 2. Super Admin & Parent Self-Service Bypass
    if (roles.includes('SUPERADMIN') || roles.includes('SUPER_ADMIN')) {
      return next();
    }
    if (
      roles.includes('PARENT') &&
      [
        'admission.view_own',
        'admission.create',
        'admission.application.create',
        'admission.application.update',
        'admission.application.view_own',
        'admission.application.view',
        'DASHBOARD_VIEW_PARENT',
      ].includes(requiredPermission)
    ) {
      return next();
    }

    // 3. Dynamic Permission Hierarchy Evaluation
    // Allow higher-level permission hierarchies (e.g., view_all grants view_own)
    if (
      permissions.includes(requiredPermission) ||
      (requiredPermission === 'admission.view_own' &&
        (permissions.includes('admission.view_all') || permissions.includes('admission.review'))) ||
      // Dedicated Fees Domain Permission Evaluation
      (requiredPermission === 'fees.structure.manage' &&
        (permissions.includes('fees.structure.manage') ||
          roles.includes('ADMIN') ||
          roles.includes('FINANCE_OFFICER') ||
          roles.includes('FINANCE_MANAGER'))) ||
      (requiredPermission === 'fees.demand.generate' &&
        (permissions.includes('fees.demand.generate') ||
          roles.includes('ADMIN') ||
          roles.includes('FINANCE_OFFICER') ||
          roles.includes('FINANCE_MANAGER') ||
          roles.includes('ACCOUNTANT'))) ||
      ((requiredPermission === 'fees.structure.view' ||
        requiredPermission === 'fees.view' ||
        requiredPermission === 'fees.demand.view' ||
        requiredPermission === 'fees.payment.view') &&
        (permissions.includes(requiredPermission) ||
          permissions.includes('fees.view') ||
          permissions.includes('fees.structure.manage') ||
          roles.includes('ADMIN') ||
          roles.includes('FINANCE_OFFICER') ||
          roles.includes('FINANCE_MANAGER') ||
          roles.includes('ACCOUNTANT'))) ||
      (requiredPermission === 'fees.payment.collect' &&
        (permissions.includes('fees.payment.collect') ||
          roles.includes('ADMIN') ||
          roles.includes('FINANCE_OFFICER') ||
          roles.includes('FINANCE_MANAGER') ||
          roles.includes('ACCOUNTANT') ||
          roles.includes('FRONT_OFFICE'))) ||
      // Dedicated Academic Domain Permission Evaluation
      ((requiredPermission === 'ACADEMIC_VIEW' ||
        requiredPermission === 'CLASS_VIEW' ||
        requiredPermission === 'SECTION_VIEW') &&
        (permissions.includes('ACADEMIC_VIEW') ||
          permissions.includes('ACADEMIC_SETUP') ||
          permissions.includes('CLASS_VIEW') ||
          permissions.includes('CLASS_CREATE') ||
          permissions.includes('SECTION_VIEW') ||
          permissions.includes('SECTION_CREATE') ||
          roles.includes('ADMIN') ||
          roles.includes('ORG_ADMIN') ||
          roles.includes('SUPERADMIN') ||
          roles.includes('PRINCIPAL') ||
          roles.includes('HOI') ||
          roles.includes('STAFF') ||
          roles.includes('TEACHER'))) ||
      ((requiredPermission === 'ACADEMIC_SETUP' ||
        requiredPermission === 'CLASS_CREATE' ||
        requiredPermission === 'SECTION_CREATE' ||
        requiredPermission === 'ACADEMIC_ASSIGN_FACULTY') &&
        (permissions.includes('ACADEMIC_SETUP') ||
          permissions.includes(requiredPermission) ||
          roles.includes('ADMIN') ||
          roles.includes('ORG_ADMIN') ||
          roles.includes('SUPERADMIN') ||
          roles.includes('PRINCIPAL') ||
          roles.includes('HOI'))) ||
      ((requiredPermission === 'TIMETABLE_VIEW' || requiredPermission === 'TIMETABLE_CREATE') &&
        (permissions.includes(requiredPermission) ||
          permissions.includes('ACADEMIC_VIEW') ||
          permissions.includes('ACADEMIC_SETUP') ||
          roles.includes('ADMIN') ||
          roles.includes('ORG_ADMIN') ||
          roles.includes('SUPERADMIN') ||
          roles.includes('PRINCIPAL') ||
          roles.includes('HOI') ||
          (requiredPermission === 'TIMETABLE_VIEW' &&
            (roles.includes('TEACHER') || roles.includes('STAFF'))))) ||
      ((requiredPermission === 'DASHBOARD_VIEW_ADMIN' ||
        requiredPermission === 'admin.dashboard.view') &&
        (permissions.includes('DASHBOARD_VIEW_ADMIN') ||
          permissions.includes('admin.dashboard.view') ||
          roles.some((r) => (ADMIN_DASHBOARD_ROLES as readonly string[]).includes(r)))) ||
      ((requiredPermission === 'DASHBOARD_VIEW_FACULTY' ||
        requiredPermission === 'faculty.dashboard.view') &&
        (permissions.includes('DASHBOARD_VIEW_FACULTY') ||
          permissions.includes('faculty.dashboard.view') ||
          roles.includes('TEACHER') ||
          roles.includes('FACULTY') ||
          roles.includes('ADMIN') ||
          roles.includes('ORG_ADMIN') ||
          roles.includes('SUPERADMIN') ||
          roles.includes('SUPER_ADMIN') ||
          roles.includes('PRINCIPAL') ||
          roles.includes('HOI'))) ||
      ((requiredPermission === 'admission.leads.manage' ||
        requiredPermission === 'admission.enquiry.view' ||
        requiredPermission === 'admission.recommend' ||
        requiredPermission === 'admission.approve' ||
        requiredPermission === 'admission.enrol' ||
        requiredPermission === 'admission.assessment.evaluate' ||
        requiredPermission === 'admission.assessment.config.manage' ||
        requiredPermission === 'admission.assessment.dashboard.view') &&
        (permissions.includes('admission.leads.manage') ||
          permissions.includes('admission.enquiry.view') ||
          permissions.includes('admission.review') ||
          permissions.includes('admission.view_all') ||
          permissions.includes('admission.recommend') ||
          permissions.includes('admission.approve') ||
          permissions.includes('admission.enrol') ||
          roles.includes('ADMIN') ||
          roles.includes('SUPERADMIN') ||
          roles.includes('FRONT_OFFICE') ||
          roles.includes('COUNSELLOR') ||
          roles.includes('ADMISSION_OFFICER') ||
          roles.includes('EXAM_CELL_ADMIN')))
    ) {
      return next();
    }

    // 4. Deny Access — Dynamic RBAC Enforcement
    logger.warn(
      `[RBAC Access Denied] User ${reqContext.user.email} (Roles: ${roles.join(',')}) missing required permission: ${requiredPermission}`,
    );
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: `Forbidden: Insufficient permissions for ${requiredPermission}`,
      requiredPermission,
      timestamp: new Date().toISOString(),
      requestId: (req as any).id || 'req-unknown',
    });
  };
};

/**
 * Middleware to enforce Role-based access.
 * Returns 403 if user does not have ANY of the required roles.
 */
export const checkRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const reqContext = (req as any).context;
    if (!reqContext?.user) {
      return res.status(401).json({ error: 'Unauthorized: No session context' });
    }

    const userRoles = getEffectiveRoles(reqContext.user.roles);
    const hasRole = userRoles.some((r) => allowedRoles.includes(r));

    if (hasRole || userRoles.includes('SUPERADMIN')) {
      return next();
    }

    console.error(`[RBAC] Role Denied. Required: ${allowedRoles}. User has: ${userRoles}`);
    return res.status(403).json({
      error: 'Forbidden: Insufficient Permissions',
      required_roles: allowedRoles,
      user_roles: userRoles,
    });
  };
};

// Alias for compatibility if needed (user prompt called it "checkPermission", previous file was "requirePermission")
export const requirePermission = checkPermission;
export const requireRole = checkRole;
