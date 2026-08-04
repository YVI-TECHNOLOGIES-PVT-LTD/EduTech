import { Request, Response, NextFunction } from 'express';
import { CorrelatedRequest } from '../middlewares/request-id.middleware';

const SENSITIVE_KEYS = ['password', 'token', 'secret', 'authorization', 'refreshtoken', 'creditcard'];

const maskSensitiveData = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(maskSensitiveData);

  const masked: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.some(sensitive => key.toLowerCase().includes(sensitive))) {
      masked[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
};

export const logger = {
  info: (message: string, meta?: Record<string, any>) => {
    const logObject = {
      level: 'info',
      timestamp: new Date().toISOString(),
      message,
      ...(meta && { meta: maskSensitiveData(meta) }),
    };
    console.log(JSON.stringify(logObject));
  },
  error: (message: string, error?: any, meta?: Record<string, any>) => {
    const logObject = {
      level: 'error',
      timestamp: new Date().toISOString(),
      message,
      error: error?.message || error,
      ...(error?.stack && { stack: error.stack }),
      ...(meta && { meta: maskSensitiveData(meta) }),
    };
    console.error(JSON.stringify(logObject));
  },
  warn: (message: string, meta?: Record<string, any>) => {
    const logObject = {
      level: 'warn',
      timestamp: new Date().toISOString(),
      message,
      ...(meta && { meta: maskSensitiveData(meta) }),
    };
    console.warn(JSON.stringify(logObject));
  },
};

export const requestLoggerMiddleware = (req: CorrelatedRequest, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    logger.info(`HTTP ${req.method} ${req.originalUrl || req.url}`, {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });

  next();
};
