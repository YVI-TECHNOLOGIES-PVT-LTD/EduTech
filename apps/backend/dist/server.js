"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const prismaClient_1 = __importDefault(require("./lib/prismaClient"));
const logger_1 = require("./utils/logger");
const worker_service_1 = require("./jobs/worker.service");
const scheduler_service_1 = require("./jobs/scheduler.service");
const role_normalization_1 = require("./rbac/role-normalization");
/**
 * Non-mutating startup verification of database roles against canonical RBAC normalization.
 * Stage 3 Phase 2: Removed invalid Supabase upsert against nonexistent permissions/role_permissions tables.
 */
async function verifyStartupRBACState() {
    try {
        const dbRoles = await prismaClient_1.default.roles.findMany({
            select: { role_id: true, role_name: true },
        });
        const roleMappingSummary = dbRoles.map((r) => ({
            role_id: r.role_id,
            raw: r.role_name,
            canonical: (0, role_normalization_1.normalizeRoleName)(r.role_name),
        }));
        logger_1.logger.info('[RBAC Startup Verification] Verified database roles cleanly.', {
            roleCount: roleMappingSummary.length,
        });
    }
    catch (e) {
        logger_1.logger.warn('[RBAC Startup Verification] Failed to verify DB roles during startup:', {
            error: e?.message || String(e),
        });
    }
}
verifyStartupRBACState();
const notification_realtime_1 = require("./modules/notifications/realtime/notification.realtime");
const notification_subscriber_1 = require("./modules/notifications/subscribers/notification.subscriber");
const PORT = env_1.env.PORT || 3000;
const server = app_1.app.listen(Number(PORT), '0.0.0.0', () => {
    logger_1.logger.info(`[Startup] Server running on port ${PORT} in ${env_1.env.NODE_ENV} mode`);
    // Initialize Realtime WebSocket Server
    notification_realtime_1.realtimeNotificationServer.init(server);
    // Register Notification Event Listeners
    notification_subscriber_1.NotificationSubscriber.register();
    // Boot Worker and Scheduler Runtimes
    worker_service_1.workerService.start();
    scheduler_service_1.schedulerService.start();
});
// Graceful Shutdown System
const gracefulShutdown = (signal) => {
    logger_1.logger.info(`[Shutdown] Received ${signal}. Initiating graceful shutdown...`);
    worker_service_1.workerService.stop();
    scheduler_service_1.schedulerService.stop();
    notification_realtime_1.realtimeNotificationServer.close();
    server.close(() => {
        logger_1.logger.info('[Shutdown] HTTP server closed successfully. Process exiting cleanly.');
        process.exit(0);
    });
    setTimeout(() => {
        logger_1.logger.error('[Shutdown] Forced shutdown timed out after 10s. Process exiting with error.');
        process.exit(1);
    }, 10000);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
