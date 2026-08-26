"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const supabase_1 = require("./config/supabase");
const logger_1 = require("./utils/logger");
const worker_service_1 = require("./jobs/worker.service");
const scheduler_service_1 = require("./jobs/scheduler.service");
const NEW_PERMISSIONS = [
    {
        code: 'admin.dashboard.view',
        description: 'View general admin dashboard and administrative tools',
    },
    { code: 'assessment.dashboard.view', description: 'View Assessment Platform dashboard' },
    { code: 'exam.dashboard.view', description: 'View Examination Cell dashboard' },
    { code: 'fees.dashboard.view', description: 'View Finance & Fees dashboard' },
    { code: 'admission.dashboard.view', description: 'View Admissions Desk dashboard' },
    { code: 'transport.dashboard.view', description: 'View Transport & Fleet dashboard' },
    { code: 'faculty.dashboard.view', description: 'View Faculty Portal dashboard' },
    { code: 'student.dashboard.view', description: 'View Student Portal dashboard' },
    { code: 'parent.dashboard.view', description: 'View Parent Portal dashboard' },
    { code: 'driver.dashboard.view', description: 'View Driver Portal dashboard' },
    { code: 'assessment.foundation.view', description: 'View Assessment foundation configurations' },
    {
        code: 'assessment.foundation.manage',
        description: 'Create/edit Assessment configurations & workflows',
    },
    { code: 'assessment.paper.generate', description: 'Generate exam papers' },
    { code: 'assessment.paper.view', description: 'View generated papers' },
    { code: 'assessment.schedule.manage', description: 'Schedule assessments' },
    { code: 'assessment.schedule.view', description: 'View assessment schedules' },
    { code: 'assessment.attempt.write', description: 'Take assessments / write tests' },
    { code: 'assessment.attempt.view', description: 'View attempts' },
    { code: 'assessment.evaluation.manage', description: 'Grade/evaluate attempts' },
    { code: 'assessment.result.view', description: 'View assessment results' },
    { code: 'assessment.result.publish', description: 'Publish assessment results' },
    { code: 'assessment.analytics.view', description: 'View assessment analytics' },
    { code: 'assessment.settings.view', description: 'View settings' },
    { code: 'assessment.settings.manage', description: 'Update settings' },
    { code: 'assessment.configuration.view', description: 'View assessment configurations' },
    {
        code: 'assessment.configuration.manage',
        description: 'Create and update assessment configurations',
    },
    { code: 'assessment.workflow.view', description: 'View assessment review workflows' },
    { code: 'assessment.workflow.publish', description: 'Publish assessment review workflows' },
    { code: 'assessment.workflow.archive', description: 'Archive assessment review workflows' },
];
const ROLE_PERMISSIONS_MAPPING = {
    ADMIN: NEW_PERMISSIONS.map((p) => p.code),
    SUPERADMIN: NEW_PERMISSIONS.map((p) => p.code),
    EXAM_CELL_ADMIN: [
        'exam.dashboard.view',
        'assessment.dashboard.view',
        'assessment.foundation.view',
        'assessment.foundation.manage',
        'assessment.paper.generate',
        'assessment.paper.view',
        'assessment.schedule.manage',
        'assessment.schedule.view',
        'assessment.attempt.write',
        'assessment.attempt.view',
        'assessment.evaluation.manage',
        'assessment.result.view',
        'assessment.result.publish',
        'assessment.analytics.view',
        'assessment.settings.view',
        'assessment.settings.manage',
        'assessment.configuration.view',
        'assessment.configuration.manage',
        'assessment.workflow.view',
        'assessment.workflow.publish',
        'assessment.workflow.archive',
    ],
    EXAM_CELL: [
        'exam.dashboard.view',
        'assessment.dashboard.view',
        'assessment.foundation.view',
        'assessment.paper.view',
        'assessment.schedule.view',
        'assessment.attempt.view',
        'assessment.result.view',
        'assessment.analytics.view',
        'assessment.configuration.view',
        'assessment.workflow.view',
    ],
    EXAM_PLATFORM_ADMIN: [
        'assessment.dashboard.view',
        'assessment.foundation.view',
        'assessment.foundation.manage',
        'assessment.paper.generate',
        'assessment.paper.view',
        'assessment.schedule.manage',
        'assessment.schedule.view',
        'assessment.attempt.write',
        'assessment.attempt.view',
        'assessment.evaluation.manage',
        'assessment.result.view',
        'assessment.result.publish',
        'assessment.analytics.view',
        'assessment.settings.view',
        'assessment.settings.manage',
        'assessment.configuration.view',
        'assessment.configuration.manage',
        'assessment.workflow.view',
        'assessment.workflow.publish',
        'assessment.workflow.archive',
    ],
    FINANCE_OFFICER: ['fees.dashboard.view'],
    ACCOUNTANT: ['fees.dashboard.view'],
    ADMISSION_OFFICER: ['admission.dashboard.view'],
    TRANSPORT_ADMIN: ['transport.dashboard.view'],
    FACULTY: ['faculty.dashboard.view'],
    STUDENT: ['student.dashboard.view'],
    PARENT: ['parent.dashboard.view'],
    BUS_DRIVER: ['driver.dashboard.view'],
    DRIVER: ['driver.dashboard.view'],
};
async function runRBACSelfHealing() {
    try {
        logger_1.logger.info('[RBAC Self-Healing] Initiating Database Sync...');
        for (const perm of NEW_PERMISSIONS) {
            await supabase_1.supabase.from('permissions').upsert(perm, { onConflict: 'code' });
        }
        const { data: dbRoles } = await supabase_1.supabase.from('roles').select('id, name');
        const { data: dbPerms } = await supabase_1.supabase.from('permissions').select('id, code');
        if (!dbRoles || !dbPerms) {
            logger_1.logger.error('[RBAC Self-Healing] Failed to fetch roles or permissions from database.');
            return;
        }
        const roleByName = new Map();
        dbRoles.forEach((r) => roleByName.set(r.name.toUpperCase(), r.id));
        const permByCode = new Map();
        dbPerms.forEach((p) => permByCode.set(p.code, p.id));
        const mappings = [];
        for (const [roleName, permCodes] of Object.entries(ROLE_PERMISSIONS_MAPPING)) {
            const roleId = roleByName.get(roleName.toUpperCase());
            if (!roleId)
                continue;
            for (const code of permCodes) {
                const permId = permByCode.get(code);
                if (permId) {
                    mappings.push({ role_id: roleId, permission_id: permId });
                }
            }
        }
        if (mappings.length > 0) {
            const { error: mappingError } = await supabase_1.supabase
                .from('role_permissions')
                .upsert(mappings, { onConflict: 'role_id,permission_id' });
            if (mappingError) {
                logger_1.logger.error('[RBAC Self-Healing] Error upserting role mappings:', mappingError.message);
            }
            else {
                logger_1.logger.info(`[RBAC Self-Healing] Successfully synchronized ${mappings.length} role-permission mappings.`);
            }
        }
    }
    catch (e) {
        logger_1.logger.error('[RBAC Self-Healing] Unexpected seeder error:', e.message);
    }
}
runRBACSelfHealing();
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
