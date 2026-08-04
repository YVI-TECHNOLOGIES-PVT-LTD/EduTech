import { app } from './app';
import { env } from './config/env';
import { supabase } from './config/supabase';
import { logger } from './utils/logger';
import { workerService } from './jobs/worker.service';
import { schedulerService } from './jobs/scheduler.service';

const NEW_PERMISSIONS = [
    { code: 'admin.dashboard.view', description: 'View general admin dashboard and administrative tools' },
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
    { code: 'assessment.foundation.manage', description: 'Create/edit Assessment configurations & workflows' },
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
    { code: 'assessment.configuration.manage', description: 'Create and update assessment configurations' },
    { code: 'assessment.workflow.view', description: 'View assessment review workflows' },
    { code: 'assessment.workflow.publish', description: 'Publish assessment review workflows' },
    { code: 'assessment.workflow.archive', description: 'Archive assessment review workflows' }
];

const ROLE_PERMISSIONS_MAPPING: Record<string, string[]> = {
    ADMIN: NEW_PERMISSIONS.map(p => p.code),
    SUPERADMIN: NEW_PERMISSIONS.map(p => p.code),
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
        'assessment.workflow.archive'
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
        'assessment.workflow.view'
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
        'assessment.workflow.archive'
    ],
    FINANCE_OFFICER: ['fees.dashboard.view'],
    ACCOUNTANT: ['fees.dashboard.view'],
    ADMISSION_OFFICER: ['admission.dashboard.view'],
    TRANSPORT_ADMIN: ['transport.dashboard.view'],
    FACULTY: ['faculty.dashboard.view'],
    STUDENT: ['student.dashboard.view'],
    PARENT: ['parent.dashboard.view'],
    BUS_DRIVER: ['driver.dashboard.view'],
    DRIVER: ['driver.dashboard.view']
};

async function runRBACSelfHealing() {
    try {
        logger.info("[RBAC Self-Healing] Initiating Database Sync...");
        for (const perm of NEW_PERMISSIONS) {
            await supabase.from('permissions').upsert(perm, { onConflict: 'code' });
        }
        const { data: dbRoles } = await supabase.from('roles').select('id, name');
        const { data: dbPerms } = await supabase.from('permissions').select('id, code');

        if (!dbRoles || !dbPerms) {
            logger.error("[RBAC Self-Healing] Failed to fetch roles or permissions from database.");
            return;
        }

        const roleByName = new Map<string, string>();
        dbRoles.forEach(r => roleByName.set(r.name.toUpperCase(), r.id));

        const permByCode = new Map<string, string>();
        dbPerms.forEach(p => permByCode.set(p.code, p.id));

        const mappings: { role_id: string; permission_id: string }[] = [];
        for (const [roleName, permCodes] of Object.entries(ROLE_PERMISSIONS_MAPPING)) {
            const roleId = roleByName.get(roleName.toUpperCase());
            if (!roleId) continue;
            for (const code of permCodes) {
                const permId = permByCode.get(code);
                if (permId) {
                    mappings.push({ role_id: roleId, permission_id: permId });
                }
            }
        }

        if (mappings.length > 0) {
            const { error: mappingError } = await supabase
                .from('role_permissions')
                .upsert(mappings, { onConflict: 'role_id,permission_id' });

            if (mappingError) {
                logger.error("[RBAC Self-Healing] Error upserting role mappings:", mappingError.message);
            } else {
                logger.info(`[RBAC Self-Healing] Successfully synchronized ${mappings.length} role-permission mappings.`);
            }
        }
    } catch (e: any) {
        logger.error("[RBAC Self-Healing] Unexpected seeder error:", e.message);
    }
}
runRBACSelfHealing();

const PORT = env.PORT || 3000;

const server = app.listen(Number(PORT), () => {
    logger.info(`[Startup] Server running on port ${PORT} in ${env.NODE_ENV} mode`);
    
    // Boot Worker and Scheduler Runtimes
    workerService.start();
    schedulerService.start();
});

// Graceful Shutdown System
const gracefulShutdown = (signal: string) => {
    logger.info(`[Shutdown] Received ${signal}. Initiating graceful shutdown...`);
    workerService.stop();
    schedulerService.stop();

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