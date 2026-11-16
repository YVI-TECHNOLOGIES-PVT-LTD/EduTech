import { app } from './app';
import { env } from './config/env';
import prisma from './lib/prismaClient';
import { logger } from './utils/logger';
import { workerService } from './jobs/worker.service';
import { schedulerService } from './jobs/scheduler.service';
import { normalizeRoleName } from './rbac/role-normalization';

/**
 * Non-mutating startup verification of database roles against canonical RBAC normalization.
 * Stage 3 Phase 2: Removed invalid Supabase upsert against nonexistent permissions/role_permissions tables.
 */
async function verifyStartupRBACState() {
  try {
    const dbRoles = await prisma.roles.findMany({
      select: { role_id: true, role_name: true },
    });

    const roleMappingSummary = dbRoles.map((r) => ({
      role_id: r.role_id,
      raw: r.role_name,
      canonical: normalizeRoleName(r.role_name),
    }));

    logger.info('[RBAC Startup Verification] Verified database roles cleanly.', {
      roleCount: roleMappingSummary.length,
    });
  } catch (e: any) {
    logger.warn('[RBAC Startup Verification] Failed to verify DB roles during startup:', {
      error: e?.message || String(e),
    });
  }
}
verifyStartupRBACState();

import { realtimeNotificationServer } from './modules/notifications/realtime/notification.realtime';
import { NotificationSubscriber } from './modules/notifications/subscribers/notification.subscriber';

const PORT = env.PORT || 3000;

const server = app.listen(Number(PORT), '0.0.0.0', () => {
  logger.info(`[Startup] Server running on port ${PORT} in ${env.NODE_ENV} mode`);

  // Initialize Realtime WebSocket Server
  realtimeNotificationServer.init(server);

  // Register Notification Event Listeners
  NotificationSubscriber.register();

  // Boot Worker and Scheduler Runtimes
  workerService.start();
  schedulerService.start();
});

// Graceful Shutdown System
const gracefulShutdown = (signal: string) => {
  logger.info(`[Shutdown] Received ${signal}. Initiating graceful shutdown...`);
  workerService.stop();
  schedulerService.stop();
  realtimeNotificationServer.close();

  server.close(() => {
    logger.info('[Shutdown] HTTP server closed successfully. Process exiting cleanly.');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('[Shutdown] Forced shutdown timed out after 10s. Process exiting with error.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
