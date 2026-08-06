"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticatedRateLimiter = exports.authRateLimiter = exports.publicRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.publicRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many public API requests, please try again later.',
        timestamp: new Date().toISOString(),
    },
});
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts, please try again later.',
        timestamp: new Date().toISOString(),
    },
});
exports.authenticatedRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Request quota exceeded, please slow down.',
        timestamp: new Date().toISOString(),
    },
});
