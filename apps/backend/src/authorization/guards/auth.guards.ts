import { Request, Response, NextFunction } from 'express';
import { RbacService } from '../services/auth.services';
import { AuthorizationException } from '../../common/exceptions/domain.exceptions';

export class RbacGuard {
  private rbacService = new RbacService();

  public canActivate(req: Request, requiredRoles: string[], requiredPermissions?: string): boolean {
    const user = (req as any).user;
    if (!user) throw new AuthorizationException('User context missing');

    const hasRole = this.rbacService.hasRole([user.role], requiredRoles);
    if (!hasRole) return false;

    if (requiredPermissions) {
      return this.rbacService.hasPermission(user.permissions || [], requiredPermissions);
    }

    return true;
  }
}

export class AbacGuard {
  public canActivate(req: Request, policyName: string): boolean {
    const user = (req as any).user;
    if (!user) throw new AuthorizationException('User context missing');
    return true; // Policy evaluation placeholder
  }
}
