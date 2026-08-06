import { Request, Response, NextFunction } from 'express';
import { BaseException } from '../../common/exceptions/base.exception';
import { ResponseHelper } from '../../common/helpers/response.helper';
import { v4 as uuidv4 } from 'uuid';

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const correlationId = (req.headers['x-request-id'] as string) || uuidv4();
  (req as any).id = correlationId;
  res.setHeader('x-request-id', correlationId);
  next();
}

export function transformResponseInterceptor(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const originalJson = res.json;
  res.json = function (body: any) {
    if (body && typeof body === 'object' && 'success' in body) {
      return originalJson.call(this, body);
    }
    const formatted = ResponseHelper.success(body);
    return originalJson.call(this, formatted);
  };
  next();
}

export function globalExceptionFilter(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const requestId = (req as any).id || 'req-unknown';

  if (err instanceof BaseException) {
    res
      .status(err.statusCode)
      .json(
        ResponseHelper.error(
          [{ code: err.errorCode, message: err.message, field: err.details?.field }],
          err.message,
          requestId,
        ),
      );
    return;
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res
    .status(statusCode)
    .json(ResponseHelper.error([{ code: 'INTERNAL_SERVER_ERROR', message }], message, requestId));
}
