import { Response } from 'express';
import { AdmissionError } from '../../errors/AdmissionError';
import { ValidationError } from '../../errors/ValidationError';
import { NotFoundError } from '../../errors/NotFoundError';
import { PermissionError } from '../../errors/PermissionError';
import { ConflictError } from '../../errors/ConflictError';
import { BusinessRuleError } from '../../errors/BusinessRuleError';
import { ForbiddenError, AppError } from '../../../../utils/errors';

/**
 * Maps custom Admissions CRM exceptions to standard HTTP response status codes.
 */
export function handleControllerError(res: Response, err: any) {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message, details: err.errors });
  }
  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message });
  }
  if (err instanceof PermissionError || err instanceof ForbiddenError) {
    return res.status(403).json({ error: err.message });
  }
  if (err instanceof ConflictError) {
    return res.status(409).json({ error: err.message, details: err.details });
  }
  if (err instanceof BusinessRuleError) {
    return res.status(409).json({ error: err.message });
  }
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message, errorCode: err.errorCode });
  }
  if (err instanceof AdmissionError) {
    return res.status(500).json({ error: err.message });
  }
  return res.status(500).json({ error: err.message || 'Internal Server Error' });
}
