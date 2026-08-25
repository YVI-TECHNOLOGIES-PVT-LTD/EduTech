import { Response } from 'express';
import { AdmissionError } from '../../errors/AdmissionError';
import { ValidationError } from '../../errors/ValidationError';
import { NotFoundError } from '../../errors/NotFoundError';
import { PermissionError } from '../../errors/PermissionError';
import { ConflictError } from '../../errors/ConflictError';
import { BusinessRuleError } from '../../errors/BusinessRuleError';

/**
 * Maps custom Admissions CRM exceptions to standard HTTP response status codes.
 */
export function handleControllerError(res: Response, err: any, requestId?: string) {
  if (err instanceof ValidationError) {
    console.error('[CRM-ERROR-400-VALIDATION]', {
      requestId,
      error: err.message,
      details: err.errors,
    });
    return res.status(400).json({ error: err.message, details: err.errors, requestId });
  }
  if (err instanceof NotFoundError) {
    console.warn('[CRM-ERROR-404-NOT-FOUND]', {
      requestId,
      error: err.message,
    });
    return res.status(404).json({ error: err.message, requestId });
  }
  if (err instanceof PermissionError) {
    console.warn('[CRM-ERROR-403-PERMISSION]', {
      requestId,
      error: err.message,
    });
    return res.status(403).json({ error: err.message, requestId });
  }
  if (err instanceof ConflictError) {
    console.warn('[CRM-ERROR-409-CONFLICT]', {
      requestId,
      error: err.message,
      details: err.details,
    });
    return res.status(409).json({ error: err.message, details: err.details, requestId });
  }
  if (err instanceof BusinessRuleError) {
    console.warn('[CRM-ERROR-409-BUSINESS-RULE]', {
      requestId,
      error: err.message,
    });
    return res.status(409).json({ error: err.message, requestId });
  }
  if (err instanceof AdmissionError) {
    console.error('[CRM-ERROR-500-ADMISSION-ERROR]', {
      requestId,
      error: err.message,
      stack: err.stack,
    });
    return res.status(500).json({ error: err.message, requestId });
  }

  console.error('[CRM-ERROR-500-UNCAUGHT]', {
    requestId,
    error: err?.message || err,
    stack: err?.stack,
  });
  return res.status(500).json({ error: err?.message || 'Internal Server Error', requestId });
}
