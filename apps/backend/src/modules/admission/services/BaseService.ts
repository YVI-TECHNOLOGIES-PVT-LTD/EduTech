import { z } from 'zod';
import { ValidationError } from '../errors/ValidationError';
import { logger } from '../../../config/logger';

export abstract class BaseService {
    /**
     * Helper to validate a payload using a Zod schema, throwing a ValidationError if invalid.
     */
    protected validate<T>(schema: z.Schema<T>, data: any): T {
        const result = schema.safeParse(data);
        if (!result.success) {
            const errorsList = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
            throw new ValidationError(`Validation failed: ${errorsList}`, result.error.format());
        }
        return result.data;
    }

    protected logInfo(message: string, correlationId?: string) {
        const prefix = correlationId ? `[Corr: ${correlationId}] ` : '';
        logger.info(`${prefix}${message}`);
    }

    protected logError(message: string, error?: any, correlationId?: string) {
        const prefix = correlationId ? `[Corr: ${correlationId}] ` : '';
        const detail = error instanceof Error ? error.message : JSON.stringify(error);
        logger.error(`${prefix}${message} - Detail: ${detail}`);
    }

    /** status_history / audit_logs.correlation_id is UUID — ignore non-UUID trace strings */
    protected sanitizeCorrelationId(correlationId?: string | null): string | null {
        if (!correlationId) return null;
        const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRe.test(correlationId) ? correlationId : null;
    }
}
