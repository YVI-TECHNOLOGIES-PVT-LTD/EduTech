import { NextFunction, Request, Response } from 'express';
import { getEffectiveRoles } from '../../rbac/rbac.middleware';

export const ALLOWED_TEACHER_ROLES = ['TEACHER', 'FACULTY'];
export const ALLOWED_ADMIN_ROLES = [
  'ADMIN',
  'ORG_ADMIN',
  'SUPERADMIN',
  'SUPER_ADMIN',
  'HOI',
  'HEAD_OF_INSTITUTE',
  'PRINCIPAL',
  'ACADEMIC_ADMIN',
];
export const ALLOWED_STUDENT_ROLES = ['STUDENT'];

export interface AiCopilotAuthContext {
  orgId: string;
  userId: string;
  email: string | null;
  roles: string[];
  permissions: string[];
}

export function extractAiCopilotAuthContext(req: Request): AiCopilotAuthContext {
  const reqContext = (req as any).context?.user || (req as any).user;
  const userId = String(reqContext?.id || reqContext?.user_id || '').trim();
  const orgId = String(
    reqContext?.org_id || reqContext?.school_id || (req as any).tenantOrgId || '',
  ).trim();
  const email = reqContext?.email ? String(reqContext.email).trim() : null;
  const rawRoles = Array.isArray(reqContext?.roles)
    ? reqContext.roles
    : reqContext?.role
      ? [reqContext.role]
      : [];
  const roles = getEffectiveRoles(rawRoles);
  const permissions = Array.isArray(reqContext?.permissions) ? reqContext.permissions : [];

  return { orgId, userId, email, roles, permissions };
}

function requireAuthenticatedRoles(allowedRoles: string[], message: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { orgId, userId, roles } = extractAiCopilotAuthContext(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Unauthorized: Valid authenticated session is required.',
      });
    }

    if (!orgId) {
      return res.status(401).json({
        success: false,
        error: 'TENANT_CONTEXT_REQUIRED',
        message: 'Unauthorized: Organization context is missing from session.',
      });
    }

    const authorized = roles.some((role) => allowedRoles.includes(role));
    if (!authorized) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message,
      });
    }

    return next();
  };
}

export class AiCopilotPolicy {
  static requireTeacherRole() {
    return requireAuthenticatedRoles(
      ALLOWED_TEACHER_ROLES,
      'Forbidden: AI Teacher Copilot operations require an authorized teacher or faculty role.',
    );
  }

  static requireAdminRole() {
    return requireAuthenticatedRoles(
      ALLOWED_ADMIN_ROLES,
      'Forbidden: AI oversight and operational metrics require institutional admin privileges.',
    );
  }

  static requireStudentRole() {
    return requireAuthenticatedRoles(
      ALLOWED_STUDENT_ROLES,
      'Forbidden: AI study assistant operations require a student account.',
    );
  }
}
