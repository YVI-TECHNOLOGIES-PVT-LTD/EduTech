import { Request, Response, NextFunction } from 'express';
import { AuthorizationService } from '../services/authorization.service';
import { AttributeResolver } from '../abac/abac-engine';
import { AuthorizationContext } from '../interfaces/authz.interfaces';

const authzService = new AuthorizationService();

export function createAuthorizationContext(req: Request): AuthorizationContext | undefined {
  const user = req.context?.user || (req as any).user;
  if (!user || !user.id) return undefined;

  return {
    userId: user.id,
    email: user.email,
    orgId: user.school_id || user.orgId,
    tenantId: (req.headers['x-tenant-id'] as string) || (req as any).tenantId,
    roles: user.roles || [],
    permissions: user.permissions || [],
    timestamp: new Date(),
  };
}

export function authorizeRequest(options: { roles?: string[]; permissions?: string[] }) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const context = createAuthorizationContext(req);
    const attributes = AttributeResolver.extractAttributes(req);

    const decision = await authzService.authorize({
      context,
      requiredRoles: options.roles,
      requiredPermissions: options.permissions,
      attributes,
    });

    if (decision === 'DENY') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Forbidden: Access denied by authorization engine',
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
}

export const requirePermissions = (...permissions: string[]) => authorizeRequest({ permissions });
export const requireRoles = (...roles: string[]) => authorizeRequest({ roles });
