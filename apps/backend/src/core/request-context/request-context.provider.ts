import { AsyncLocalStorage } from 'async_hooks';
import { RequestContext } from './request-context';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

const contextStorage = new AsyncLocalStorage<RequestContext>();

export class RequestContextProviderStore {
  public static run(context: RequestContext, callback: () => void): void {
    contextStorage.run(context, callback);
  }

  public static current(): RequestContext | undefined {
    return contextStorage.getStore();
  }
}

export function requestContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string) || (req as any).id || uuidv4();
  const correlationId = (req.headers['x-correlation-id'] as string) || requestId;
  const tenantId = (req.headers['x-tenant-id'] as string) || undefined;
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'unknown';

  const user = (req as any).user
    ? Object.freeze({
        id: (req as any).user.id,
        orgId: (req as any).user.orgId || tenantId || '',
        email: (req as any).user.email || '',
        role: (req as any).user.role || 'user',
      })
    : undefined;

  const roles = user ? Object.freeze([user.role]) : Object.freeze([]);
  const permissions = (req as any).user?.permissions
    ? Object.freeze([...(req as any).user.permissions])
    : Object.freeze([]);

  const context: RequestContext = Object.freeze({
    requestId,
    correlationId,
    tenantId,
    user,
    roles,
    permissions,
    ip,
    userAgent,
    timestamp: new Date(),
    locale: req.headers['accept-language'],
    timezone: req.headers['x-timezone'] as string,
  });

  (req as any).requestContext = context;
  RequestContextProviderStore.run(context, () => next());
}
