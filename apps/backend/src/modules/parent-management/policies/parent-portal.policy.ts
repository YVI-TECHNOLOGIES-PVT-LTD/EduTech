import { NextFunction, Request, Response } from 'express';
import { getEffectiveRoles } from '../../../rbac/rbac.middleware';

export const ALLOWED_PARENT_PORTAL_ROLES = ['PARENT', 'GUARDIAN', 'ENROLLED_PARENT'];

/**
 * Extracts authenticated user context strictly from session token (never trusting client org overrides).
 */
export function extractParentSessionContext(req: Request): {
  orgId: string;
  userId: string;
  email: string | null;
  roles: string[];
} {
  const reqContext = (req as any).context?.user || (req as any).user;
  const userId = reqContext?.id || reqContext?.user_id || '';
  const orgId = reqContext?.org_id || reqContext?.school_id || (req as any).tenantOrgId || '';
  const email = reqContext?.email ? String(reqContext.email).trim() : null;
  const roles = getEffectiveRoles(Array.isArray(reqContext?.roles) ? reqContext.roles : []);

  return { orgId, userId, email, roles };
}

export class ParentPortalPolicy {
  /**
   * Enforces Parent Portal RBAC role segregation.
   * Non-parent accounts (Admin, Teacher, Staff, Student without a Parent role) are rejected with 403.
   */
  static requireParentRole() {
    return (req: Request, res: Response, next: NextFunction) => {
      const { orgId, userId, roles } = extractParentSessionContext(req);
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

      const hasParentRole = roles.some((role) => ALLOWED_PARENT_PORTAL_ROLES.includes(role));
      if (!hasParentRole) {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message:
            'Forbidden: Parent Portal endpoints require an authorized parent or guardian role.',
        });
      }

      return next();
    };
  }
}
