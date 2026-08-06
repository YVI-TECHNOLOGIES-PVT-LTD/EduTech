import { Request, Response, NextFunction } from 'express';
import { RequestContextProviderStore } from '../core/request-context/request-context.provider';

export function authContextAdapter(req: Request, res: Response, next: NextFunction): void {
  const currentCtx = RequestContextProviderStore.current();

  if (currentCtx && (req as any).user) {
    const user = (req as any).user;
    (req as any).authenticatedUser = {
      id: user.id || user.user_id,
      orgId: user.orgId || user.org_id,
      email: user.email,
      role: user.role,
    };
  }

  next();
}
