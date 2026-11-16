"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleControllerError = void 0;
const AdmissionError_1 = require("../../errors/AdmissionError");
const ValidationError_1 = require("../../errors/ValidationError");
const NotFoundError_1 = require("../../errors/NotFoundError");
const PermissionError_1 = require("../../errors/PermissionError");
const ConflictError_1 = require("../../errors/ConflictError");
const BusinessRuleError_1 = require("../../errors/BusinessRuleError");
/**
 * Maps custom Admissions CRM exceptions to standard HTTP response status codes.
 */
function handleControllerError(res, err, requestId) {
    if (err instanceof ValidationError_1.ValidationError) {
        console.error('[CRM-ERROR-400-VALIDATION]', {
            requestId,
            error: err.message,
            details: err.errors,
        });
        return res.status(400).json({ error: err.message, details: err.errors, requestId });
    }
    if (err instanceof NotFoundError_1.NotFoundError) {
        console.warn('[CRM-ERROR-404-NOT-FOUND]', {
            requestId,
            error: err.message,
        });
        return res.status(404).json({ error: err.message, requestId });
    }
    if (err instanceof PermissionError_1.PermissionError) {
        console.warn('[CRM-ERROR-403-PERMISSION]', {
            requestId,
            error: err.message,
        });
        return res.status(403).json({ error: err.message, requestId });
    }
    if (err instanceof ConflictError_1.ConflictError) {
        console.warn('[CRM-ERROR-409-CONFLICT]', {
            requestId,
            error: err.message,
            details: err.details,
        });
        return res.status(409).json({ error: err.message, details: err.details, requestId });
    }
    if (err instanceof BusinessRuleError_1.BusinessRuleError) {
        console.warn('[CRM-ERROR-409-BUSINESS-RULE]', {
            requestId,
            error: err.message,
        });
        return res.status(409).json({ error: err.message, requestId });
    }
    if (err instanceof AdmissionError_1.AdmissionError) {
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
exports.handleControllerError = handleControllerError;
