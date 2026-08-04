/**
 * EduTrack Enterprise — Centralized AppError Hierarchy
 * ===================================================
 * Defines standard error classes for domain, HTTP, validation, and database errors.
 */

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly errorCode: string;
    public readonly details?: any;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number = 500, errorCode: string = 'INTERNAL_SERVER_ERROR', details?: any) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.details = details;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message: string = 'Validation failed', details?: any) {
        super(message, 400, 'VALIDATION_ERROR', details);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Authentication required', details?: any) {
        super(message, 401, 'UNAUTHORIZED', details);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Access denied', details?: any) {
        super(message, 403, 'FORBIDDEN', details);
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource', details?: any) {
        super(`${resource} not found`, 404, 'NOT_FOUND', details);
    }
}

export class ConflictError extends AppError {
    constructor(message: string = 'Resource conflict', details?: any) {
        super(message, 409, 'CONFLICT', details);
    }
}

export class InternalServerError extends AppError {
    constructor(message: string = 'An unexpected internal error occurred', details?: any) {
        super(message, 500, 'INTERNAL_SERVER_ERROR', details);
    }
}
