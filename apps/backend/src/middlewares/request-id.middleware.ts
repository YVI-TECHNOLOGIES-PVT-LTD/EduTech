import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface CorrelatedRequest extends Request {
  id?: string;
}

export const requestIdMiddleware = (req: CorrelatedRequest, res: Response, next: NextFunction) => {
  const incomingId = (req.headers['x-request-id'] as string) || (req.headers['x-correlation-id'] as string);
  const requestId = incomingId || `req-${uuidv4()}`;

  req.id = requestId;
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-Id', requestId);

  next();
};
