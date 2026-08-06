import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandlerMiddleware = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const statusCode = err?.statusCode || err?.status || 500;
  const requestId = (req as any).id || (req.headers['x-request-id'] as string) || 'req-unknown';

  let errorCode = err?.errorCode || err?.code || 'INTERNAL_SERVER_ERROR';
  if (!err?.errorCode && !err?.code) {
    if (statusCode === 400) errorCode = 'VALIDATION_ERROR';
    else if (statusCode === 401) errorCode = 'UNAUTHORIZED_ACCESS';
    else if (statusCode === 403) errorCode = 'FORBIDDEN';
    else if (statusCode === 404) errorCode = 'RESOURCE_NOT_FOUND';
    else if (statusCode === 409) errorCode = 'CONFLICT';
    else if (statusCode === 429) errorCode = 'RATE_LIMIT_EXCEEDED';
  }

  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal Server Error'
      : err?.message || 'An unexpected error occurred';

  logger.error('[Global Error]', err, {
    requestId,
    statusCode,
    errorCode,
    ...(err?.details && { details: err.details }),
  });

  res.status(statusCode).json({
    success: false,
    error: errorCode,
    message,
    ...(err?.details && { details: err.details }),
    timestamp: new Date().toISOString(),
    requestId,
  });
};
