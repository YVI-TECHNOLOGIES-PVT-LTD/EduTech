import * as crypto from 'crypto';
import { DbClient } from './database-lock';
import { logger } from './logger';

export interface MigrationRecord {
    id?: number;
    migration_name: string;
    checksum: string;
    started_at: Date;
    completed_at?: Date;
    status: 'EXECUTING' | 'SUCCESS' | 'FAILED' | 'ROLLED_BACK';
    execution_time_ms?: number;
    error?: string;
}

export class MigrationHistoryManager {
    public static async ensureHistoryTable(client: DbClient): Promise<void> {
        const sql = `
            CREATE TABLE IF NOT EXISTS migration_history (
                id SERIAL PRIMARY KEY,
                migration_name VARCHAR(255) NOT NULL UNIQUE,
                checksum VARCHAR(64) NOT NULL,
                started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                completed_at TIMESTAMPTZ,
                status VARCHAR(32) NOT NULL,
                execution_time_ms INTEGER,
                error TEXT
            );
        `;
        await client.query(sql);
    }

    public static calculateChecksum(sqlContent: string): string {
        return crypto.createHash('sha256').update(sqlContent).digest('hex');
    }

    public static async getExecutedMigrations(client: DbClient): Promise<Set<string>> {
        await MigrationHistoryManager.ensureHistoryTable(client);
        const res = await client.query("SELECT migration_name FROM migration_history WHERE status = 'SUCCESS'");
        return new Set(res.rows.map((r: any) => r.migration_name));
    }

    public static async recordStart(client: DbClient, migrationName: string, checksum: string): Promise<number> {
        const sql = `
            INSERT INTO migration_history (migration_name, checksum, started_at, status)
            VALUES ($1, $2, NOW(), 'EXECUTING')
            ON CONFLICT (migration_name) DO UPDATE 
            SET checksum = $2, started_at = NOW(), status = 'EXECUTING', error = NULL
            RETURNING id;
        `;
        const res = await client.query(sql, [migrationName, checksum]);
        return res.rows[0].id;
    }

    public static async recordSuccess(client: DbClient, historyId: number, executionTimeMs: number): Promise<void> {
        const sql = `
            UPDATE migration_history
            SET status = 'SUCCESS', completed_at = NOW(), execution_time_ms = $1
            WHERE id = $2;
        `;
        await client.query(sql, [executionTimeMs, historyId]);
    }

    public static async recordFailure(client: DbClient, historyId: number, errorMessage: string): Promise<void> {
        const sql = `
            UPDATE migration_history
            SET status = 'FAILED', completed_at = NOW(), error = $1
            WHERE id = $2;
        `;
        await client.query(sql, [errorMessage, historyId]);
    }
}
