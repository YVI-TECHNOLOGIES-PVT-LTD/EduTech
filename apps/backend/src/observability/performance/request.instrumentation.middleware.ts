import { Request, Response, NextFunction } from 'express';
import { MetricsRegistry } from '../metrics/metrics.engine';
import { LogSanitizer } from '../sanitizer/log.sanitizer';

export class RequestTimer {
  private startTime = process.hrtime.bigint();

  public getElapsedMs(): number {
    const end = process.hrtime.bigint();
    return Number(end - this.startTime) / 1000000;
  }
}

export class SlowRequestDetector {
  public static check(durationMs: number, req: Request, thresholdMs = 500): boolean {
    if (durationMs > thresholdMs) {
      console.warn(
        `⚠️ [Slow Request Detected] ${req.method} ${req.originalUrl || req.url} took ${durationMs.toFixed(2)}ms (threshold: ${thresholdMs}ms)`,
      );
      return true;
    }
    return false;
  }
}

export function requestInstrumentationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const timer = new RequestTimer();
  const metrics = MetricsRegistry.getInstance();

  metrics.incrementCounter('http_requests_total');

  res.on('finish', () => {
    const durationMs = Math.round(timer.getElapsedMs() * 100) / 100;
    const statusCode = res.statusCode;

    metrics.recordDuration('http_request_duration_ms', durationMs, {
      method: req.method,
      path: req.path,
      status: String(statusCode),
    });
    if (statusCode >= 400) {
      metrics.incrementCounter('http_requests_failed_total');
    } else {
      metrics.incrementCounter('http_requests_success_total');
    }

    SlowRequestDetector.check(durationMs, req);
  });

  next();
}
