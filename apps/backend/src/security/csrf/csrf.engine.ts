import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { SecurityAuditEventType } from '../contracts/security.contracts';
import { loggerService } from '../../observability/logger.service';

export class CsrfTokens {
  private static tokens = new Map<string, string>();

  public static generateToken(sessionId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    this.tokens.set(sessionId, token);
    return token;
  }

  public static validateToken(sessionId: string, token: string): boolean {
    const expected = this.tokens.get(sessionId);
    return Boolean(expected && expected === token);
  }
}

export function csrfMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Safe HTTP methods bypass CSRF check
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Bearer JWT APIs bypass cookie-based CSRF checks
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = (req.headers['x-csrf-token'] as string) || req.body?._csrf;
  const sessionId = (req as any).sessionID || req.cookies?.sessionId;

  if (!sessionId || !token || !CsrfTokens.validateToken(sessionId, token)) {
    loggerService.warn(`🚨 [CSRF Check Failed] ${req.method} ${req.path} from IP ${req.ip}`);
    res.status(403).json({
      success: false,
      error: 'CSRF Verification Failed',
      code: SecurityAuditEventType.CSRF_FAILED,
      message: 'Invalid or missing CSRF token',
    });
    return;
  }

  next();
}
