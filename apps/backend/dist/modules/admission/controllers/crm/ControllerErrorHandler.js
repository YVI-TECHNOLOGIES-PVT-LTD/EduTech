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
function handleControllerError(res, err) {
    if (err instanceof ValidationError_1.ValidationError) {
        return res.status(400).json({ error: err.message, details: err.errors });
    }
    if (err instanceof NotFoundError_1.NotFoundError) {
        return res.status(404).json({ error: err.message });
    }
    if (err instanceof PermissionError_1.PermissionError) {
        return res.status(403).json({ error: err.message });
    }
    if (err instanceof ConflictError_1.ConflictError) {
        return res.status(409).json({ error: err.message, details: err.details });
    }
    if (err instanceof BusinessRuleError_1.BusinessRuleError) {
        return res.status(409).json({ error: err.message });
    }
    if (err instanceof AdmissionError_1.AdmissionError) {
        return res.status(500).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
}
exports.handleControllerError = handleControllerError;
