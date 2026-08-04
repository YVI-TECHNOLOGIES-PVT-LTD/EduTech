import { DbClient } from './database-lock';
import { logger } from './logger';

export class RollbackRunner {
    public static async rollbackLastMigration(client: DbClient): Promise<void> {
        logger.info('Initiating controlled migration rollback...');
        try {
            const res = await client.query(`
                SELECT id, migration_name FROM migration_history
                WHERE status = 'SUCCESS'
                ORDER BY id DESC LIMIT 1;
            `);

            if (res.rows.length === 0) {
                logger.warn('No active executed migrations found to rollback.');
                return;
            }

            const lastMigration = res.rows[0];
            logger.warn(`Rolling back migration '${lastMigration.migration_name}' (History ID: ${lastMigration.id})...`);

            await client.query('BEGIN;');
            await client.query(`
                UPDATE migration_history
                SET status = 'ROLLED_BACK', completed_at = NOW()
                WHERE id = $1;
            `, [lastMigration.id]);
            await client.query('COMMIT;');

            logger.success(`Migration '${lastMigration.migration_name}' rolled back in tracking history.`);
        } catch (err: any) {
            await client.query('ROLLBACK;');
            logger.error(`Rollback failed: ${err.message}`);
        }
    }
}
