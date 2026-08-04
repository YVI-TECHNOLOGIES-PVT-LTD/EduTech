import { logger } from './logger';

export interface DbClient {
    query(sql: string, params?: any[]): Promise<any>;
}

/**
 * Manages PostgreSQL Advisory Lock to prevent concurrent migration runner execution.
 * Advisory Lock Key: 0x45445554 (ASCII 'EDUT')
 */
export class DatabaseLockManager {
    private static LOCK_KEY = 1162104148; // 'EDUT'

    public static async acquireLock(client: DbClient): Promise<boolean> {
        try {
            logger.info('Acquiring PostgreSQL advisory lock...');
            const result = await client.query('SELECT pg_try_advisory_lock($1) as locked;', [DatabaseLockManager.LOCK_KEY]);
            const acquired = result.rows[0]?.locked === true;
            if (acquired) {
                logger.success('Advisory lock acquired successfully.');
            } else {
                logger.error('Failed to acquire advisory lock. Another migration runner instance is currently active.');
            }
            return acquired;
        } catch (err: any) {
            logger.error(`Error acquiring database lock: ${err.message}`);
            return false;
        }
    }

    public static async releaseLock(client: DbClient): Promise<void> {
        try {
            await client.query('SELECT pg_advisory_unlock($1);', [DatabaseLockManager.LOCK_KEY]);
            logger.info('Advisory lock released.');
        } catch (err: any) {
            logger.warn(`Failed to release advisory lock: ${err.message}`);
        }
    }
}
