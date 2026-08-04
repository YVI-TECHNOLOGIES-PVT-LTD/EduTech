"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errors_1 = require("../utils/errors");
const errorHandler = (err, req, res, next) => {
    const correlationId = req.headers['x-correlation-id'] || req.headers['x-request-id'] || 'none';
    const timestamp = new Date().toISOString();
    if (err instanceof errors_1.AppError) {
        console.warn(`[AppError] [${correlationId}] ${err.errorCode} (${err.statusCode}): ${err.message}`);
        return res.status(err.statusCode).json({
            error: {
                message: err.message,
                code: err.errorCode,
                details: err.details || null,
                correlationId,
                timestamp
            }
        });
    }
    console.error(`[UnhandledError] [${correlationId}]`, err);
    return res.status(500).json({
        error: {
            message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : (err.message || 'Internal Server Error'),
            code: 'INTERNAL_SERVER_ERROR',
            correlationId,
            timestamp
        }
    });
};
exports.errorHandler = errorHandler;
