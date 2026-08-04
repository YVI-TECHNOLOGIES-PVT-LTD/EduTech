"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandlerMiddleware = void 0;
const logger_1 = require("../utils/logger");
const errorHandlerMiddleware = (err, req, res, next) => {
    const statusCode = err.status || err.statusCode || 500;
    const requestId = req.id || req.headers['x-request-id'] || 'req-unknown';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    if (statusCode === 400)
        errorCode = 'VALIDATION_ERROR';
    else if (statusCode === 401)
        errorCode = 'UNAUTHORIZED_ACCESS';
    else if (statusCode === 403)
        errorCode = 'FORBIDDEN';
    else if (statusCode === 404)
        errorCode = 'RESOURCE_NOT_FOUND';
    else if (statusCode === 409)
        errorCode = 'CONFLICT';
    else if (statusCode === 429)
        errorCode = 'RATE_LIMIT_EXCEEDED';
    const message = process.env.NODE_ENV === 'production' && statusCode === 500
        ? 'Internal Server Error'
        : err.message || 'An unexpected error occurred';
    logger_1.logger.error(`[Global Error] ${req.method} ${req.path}`, err, {
        requestId,
        statusCode,
        errorCode,
    });
    res.status(statusCode).json({
        success: false,
        error: errorCode,
        message,
        timestamp: new Date().toISOString(),
        requestId,
    });
};
exports.errorHandlerMiddleware = errorHandlerMiddleware;
