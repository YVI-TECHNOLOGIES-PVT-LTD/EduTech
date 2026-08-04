"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseService = void 0;
const ValidationError_1 = require("../errors/ValidationError");
const logger_1 = require("../../../config/logger");
class BaseService {
    /**
     * Helper to validate a payload using a Zod schema, throwing a ValidationError if invalid.
     */
    validate(schema, data) {
        const result = schema.safeParse(data);
        if (!result.success) {
            const errorsList = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
            throw new ValidationError_1.ValidationError(`Validation failed: ${errorsList}`, result.error.format());
        }
        return result.data;
    }
    logInfo(message, correlationId) {
        const prefix = correlationId ? `[Corr: ${correlationId}] ` : '';
        logger_1.logger.info(`${prefix}${message}`);
    }
    logError(message, error, correlationId) {
        const prefix = correlationId ? `[Corr: ${correlationId}] ` : '';
        const detail = error instanceof Error ? error.message : JSON.stringify(error);
        logger_1.logger.error(`${prefix}${message} - Detail: ${detail}`);
    }
    /** status_history / audit_logs.correlation_id is UUID — ignore non-UUID trace strings */
    sanitizeCorrelationId(correlationId) {
        if (!correlationId)
            return null;
        const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRe.test(correlationId) ? correlationId : null;
    }
}
exports.BaseService = BaseService;
