"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const request_id_middleware_1 = require("./middlewares/request-id.middleware");
const logger_1 = require("./utils/logger");
const rate_limit_middleware_1 = require("./middlewares/rate-limit.middleware");
const error_middleware_1 = require("./middlewares/error.middleware");
const health_routes_1 = require("./routes/health.routes");
const routes_1 = require("./routes");
const env_1 = require("./config/env");
exports.app = (0, express_1.default)();
// Trust Proxy (Required for Render/Heroku/Reverse Proxies)
exports.app.set('trust proxy', 1);
// Gzip Compression
exports.app.use((0, compression_1.default)());
// 1. Request ID Correlation Middleware
exports.app.use(request_id_middleware_1.requestIdMiddleware);
// 2. Security Headers (Helmet)
exports.app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
// 3. Centralized CORS Configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://appsms.netlify.app',
    'https://appsms-076a.onrender.com',
    env_1.env.FRONTEND_URL || '',
].filter(Boolean);
exports.app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        const isLocal = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
        if (isLocal || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error(`Not allowed by CORS: ${origin}`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
}));
// Body Parser
exports.app.use(express_1.default.json({ limit: '10mb' }));
// 4. Rate Limiting
exports.app.use('/api/auth/login', rate_limit_middleware_1.authRateLimiter);
exports.app.use('/api', rate_limit_middleware_1.publicRateLimiter);
// 5. Structured Request Logger
exports.app.use(logger_1.requestLoggerMiddleware);
// Health Check Probes
exports.app.use('/health', health_routes_1.healthRouter);
// API Routes
exports.app.use('/api', routes_1.router);
// 404 Handler
exports.app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'RESOURCE_NOT_FOUND',
        message: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'req-unknown',
    });
});
// 6. Centralized Error Handler (Phase 2.3 Compliant)
exports.app.use(error_middleware_1.errorHandlerMiddleware);
