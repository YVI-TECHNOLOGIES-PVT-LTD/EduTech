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
export function handleControllerError(res: Response, err: any) {
    if (err instanceof ValidationError) {
        return res.status(400).json({ error: err.message, details: err.errors });
    }
    if (err instanceof NotFoundError) {
        return res.status(404).json({ error: err.message });
    }
    if (err instanceof PermissionError) {
        return res.status(403).json({ error: err.message });
    }
    if (err instanceof ConflictError) {
        return res.status(409).json({ error: err.message, details: err.details });
    }
    if (err instanceof BusinessRuleError) {
        return res.status(409).json({ error: err.message });
    }
    if (err instanceof AdmissionError) {
        return res.status(500).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
}
