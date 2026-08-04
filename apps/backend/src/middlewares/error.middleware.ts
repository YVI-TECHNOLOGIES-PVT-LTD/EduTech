import { Request, Response, NextFunction } from 'express';
import { CorrelatedRequest } from './request-id.middleware';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
}

export const errorHandlerMiddleware = (
  err: AppError,
  req: CorrelatedRequest,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.status || err.statusCode || 500;
  const requestId = req.id || (req.headers['x-request-id'] as string) || 'req-unknown';

  let errorCode = 'INTERNAL_SERVER_ERROR';
  if (statusCode === 400) errorCode = 'VALIDATION_ERROR';
  else if (statusCode === 401) errorCode = 'UNAUTHORIZED_ACCESS';
  else if (statusCode === 403) errorCode = 'FORBIDDEN';
  else if (statusCode === 404) errorCode = 'RESOURCE_NOT_FOUND';
  else if (statusCode === 409) errorCode = 'CONFLICT';
  else if (statusCode === 429) errorCode = 'RATE_LIMIT_EXCEEDED';

  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal Server Error'
      : err.message || 'An unexpected error occurred';

  logger.error(`[Global Error] ${req.method} ${req.path}`, err, {
    requestId,
    statusCode,
    errorCode,
  });

  res.status(statusCode).json({
    success: false,
    error: errorCode,
    message,
    timestamp: new Date().toISOString(),
    requestId,
  });
};
