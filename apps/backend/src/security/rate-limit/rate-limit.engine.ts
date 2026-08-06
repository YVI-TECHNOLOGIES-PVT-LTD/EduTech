import { Request, Response, NextFunction } from 'express';
import { IRateLimiter, SecurityAuditEventType } from '../contracts/security.contracts';
import { loggerService } from '../../observability/logger.service';
import { MetricsRegistry } from '../../observability/metrics/metrics.engine';

export class SlidingWindowRateLimiter implements IRateLimiter {
  private hits = new Map<string, number[]>();

  public async isRateLimited(key: string, limit: number, windowMs: number): Promise<{ limited: boolean; remaining: number; resetMs: number }> {
    const now = Date.now();
    const windowStart = now - windowMs;

    let timestamps = this.hits.get(key) || [];
    timestamps = timestamps.filter((t) => t > windowStart);
    timestamps.push(now);

    this.hits.set(key, timestamps);

    const limited = timestamps.length > limit;
    const remaining = Math.max(0, limit - timestamps.length);
    const resetMs = windowMs;

    return { limited, remaining, resetMs };
  }
}

export class RateLimiterFactory {
  private static limiter = new SlidingWindowRateLimiter();

  public static getLimiter(): IRateLimiter {
    return this.limiter;
  }
}

export function globalRateLimiterMiddleware(limit = 100, windowMs = 60000) {
  const limiter = RateLimiterFactory.getLimiter();
  const metrics = MetricsRegistry.getInstance();

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `ratelimit:global:${req.ip || '127.0.0.1'}`;
    const result = await limiter.isRateLimited(key, limit, windowMs);

    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', result.remaining);

    if (result.limited) {
      metrics.incrementCounter('rate_limit_exceeded_total');
      loggerService.warn(`⚠️ [Security Rate Limited] IP ${req.ip} exceeded rate limit on ${req.method} ${req.path}`);
      res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        code: SecurityAuditEventType.RATE_LIMITED,
        message: 'Rate limit exceeded. Please try again later.',
      });
      return;
    }

    next();
  };
}

export function loginRateLimiterMiddleware(limit = 5, windowMs = 15 * 60 * 1000) {
  const limiter = RateLimiterFactory.getLimiter();

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `ratelimit:login:${req.ip || '127.0.0.1'}:${req.body?.email || 'anon'}`;
    const result = await limiter.isRateLimited(key, limit, windowMs);

    if (result.limited) {
      loggerService.warn(`🚨 [Security Login Throttled] IP ${req.ip} throttled on login attempt for email: ${req.body?.email}`);
      res.status(429).json({
        success: false,
        error: 'Login Throttled',
        code: SecurityAuditEventType.LOGIN_THROTTLED,
        message: 'Too many failed login attempts. Account temporarily locked for 15 minutes.',
      });
      return;
    }

    next();
  };
}
