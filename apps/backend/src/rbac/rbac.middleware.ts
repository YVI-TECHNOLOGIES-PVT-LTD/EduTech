import { Request, Response, NextFunction } from 'express';
import { PermissionCode } from './permissions';
import { logger } from '../utils/logger';

const ROLE_ALIASES: Record<string, string[]> = {
  SUPERADMIN: ['SUPERADMIN', 'SUPER_ADMIN'],
  SUPER_ADMIN: ['SUPERADMIN', 'SUPER_ADMIN'],
  ADMIN: ['ADMIN', 'ORG_ADMIN'],
  ORG_ADMIN: ['ADMIN', 'ORG_ADMIN'],
  FRONT_OFFICE: ['FRONT_OFFICE', 'RECEPTIONIST', 'ADMISSION_OFFICER', 'ADMISSIONS_OFFICER', 'STAFF'],
  RECEPTIONIST: ['FRONT_OFFICE', 'RECEPTIONIST', 'STAFF'],
  ADMISSION_OFFICER: ['FRONT_OFFICE', 'ADMISSION_OFFICER', 'ADMISSIONS_OFFICER', 'STAFF'],
  ADMISSIONS_OFFICER: ['FRONT_OFFICE', 'ADMISSION_OFFICER', 'ADMISSIONS_OFFICER', 'STAFF'],
  HEAD_OF_INSTITUTE: ['HOI', 'HEAD_OF_INSTITUTE', 'PRINCIPAL'],
  HOI: ['HOI', 'HEAD_OF_INSTITUTE', 'PRINCIPAL'],
  PRINCIPAL: ['HOI', 'HEAD_OF_INSTITUTE', 'PRINCIPAL'],
  COUNSELLOR: ['COUNSELOR', 'COUNSELLOR'],
  COUNSELOR: ['COUNSELOR', 'COUNSELLOR'],
  ACCOUNTANT: ['FINANCE_OFFICER', 'ACCOUNTANT'],
  FINANCE_OFFICER: ['FINANCE_OFFICER', 'ACCOUNTANT'],
  DRIVER: ['BUS_DRIVER', 'DRIVER'],
  BUS_DRIVER: ['BUS_DRIVER', 'DRIVER'],
  EXAM_CELL: ['EXAM_CELL', 'EXAM_CELL_ADMIN'],
  EXAM_CELL_ADMIN: ['EXAM_CELL', 'EXAM_CELL_ADMIN'],
};

export const getEffectiveRoles = (roles: string[]): string[] => {
  const effective = new Set<string>();
  for (const role of roles) {
    effective.add(role);
    const aliases = ROLE_ALIASES[role];
    if (aliases) {
      aliases.forEach((alias) => effective.add(alias));
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
    if (!req.context?.user) {
      return res.status(401).json({ error: 'Unauthorized: No session context' });
    }

    const permissions = req.context.user.permissions;
    const roles = getEffectiveRoles(req.context.user.roles);
    console.log(
      `[RBAC] User: ${req.context.user.email}, Required: ${requiredPermission}, Has: ${permissions.length} perms`,
    );

    // 2. Super Admin & Parent Self-Service Bypass
    if (roles.includes('SUPERADMIN')) {
      return next();
    }
    if (
      roles.includes('PARENT') &&
      [
        'admission.view_own',
        'admission.create',
        'admission.application.create',
        'admission.application.view_own',
        'admission.application.view',
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
      ((requiredPermission === 'admission.leads.manage' ||
        requiredPermission === 'admission.enquiry.view') &&
        (permissions.includes('admission.leads.manage') ||
          permissions.includes('admission.enquiry.view') ||
          permissions.includes('admission.review') ||
          permissions.includes('admission.view_all')))
    ) {
      return next();
    }

    // 4. Deny Access — Dynamic RBAC Enforcement
    logger.warn(
      `[RBAC Access Denied] User ${req.context.user.email} (Roles: ${roles.join(',')}) missing required permission: ${requiredPermission}`,
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
    if (!req.context?.user) {
      return res.status(401).json({ error: 'Unauthorized: No session context' });
    }

    const userRoles = getEffectiveRoles(req.context.user.roles);
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
