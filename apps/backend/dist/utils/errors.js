"use strict";
/**
 * EduTrack Enterprise — Centralized AppError Hierarchy
 * ===================================================
 * Defines standard error classes for domain, HTTP, validation, and database errors.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitError = exports.InternalServerError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.ValidationError = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode = 500, errorCode = 'INTERNAL_SERVER_ERROR', details) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.details = details;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message = 'Validation failed', details) {
        super(message, 400, 'VALIDATION_ERROR', details);
    }
}
exports.ValidationError = ValidationError;
class UnauthorizedError extends AppError {
    constructor(message = 'Authentication required', details) {
        super(message, 401, 'UNAUTHORIZED', details);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Access denied', details) {
        super(message, 403, 'FORBIDDEN', details);
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError {
    constructor(resource = 'Resource', details) {
        super(`${resource} not found`, 404, 'NOT_FOUND', details);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message = 'Resource conflict', details) {
        super(message, 409, 'CONFLICT', details);
    }
}
exports.ConflictError = ConflictError;
class InternalServerError extends AppError {
    constructor(message = 'An unexpected internal error occurred', details) {
        super(message, 500, 'INTERNAL_SERVER_ERROR', details);
    }
}
exports.InternalServerError = InternalServerError;
class RateLimitError extends AppError {
    constructor(message = 'Rate limit exceeded', details) {
        super(message, 429, 'TOO_MANY_REQUESTS', details);
    }
}
exports.RateLimitError = RateLimitError;
