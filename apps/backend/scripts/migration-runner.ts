import * as fs from 'fs';
import * as path from 'path';
import { MigrationConfig, MigrationOptions } from './migration-config';
import { DatabaseLockManager, DbClient } from './database-lock';
import { MigrationValidator } from './migration-validator';
import { MigrationHistoryManager } from './migration-history';
import { MigrationBackupManager } from './migration-backup';
import { MigrationReportGenerator, MigrationSummaryItem } from './migration-report';
import { RollbackRunner } from './rollback-runner';
import { logger } from './logger';

export interface MigrationFile {
    number: number;
    name: string;
    filePath: string;
}

export class MigrationRunner {
    private options: MigrationOptions;
    private config = MigrationConfig.getDatabaseConfig();

    constructor() {
        this.options = MigrationConfig.parseCliArgs();
    }

    private getMigrationFiles(): MigrationFile[] {
        const files = fs.readdirSync(this.config.migrationsDir);
        const migrations: MigrationFile[] = [];

        for (const file of files) {
            if (file.endsWith('.sql')) {
                const match = file.match(/^(\d+)_/);
                const number = match ? parseInt(match[1], 10) : 0;
                migrations.push({
                    number,
                    name: file,
                    filePath: path.join(this.config.migrationsDir, file)
                });
            }
        }

        return migrations.sort((a, b) => a.number - b.number);
    }

    private filterMigrations(allMigrations: MigrationFile[]): MigrationFile[] {
        return allMigrations.filter(m => {
            if (this.options.only !== undefined) return m.number === this.options.only;
            if (this.options.from !== undefined && m.number < this.options.from) return false;
            if (this.options.to !== undefined && m.number > this.options.to) return false;
            return true;
        });
    }

    private createDbClient(): DbClient | null {
        try {
            // Dynamically require pg to handle environments where pg might be installed optionally
            const { Client } = require('pg');
            return new Client({ connectionString: this.config.connectionString });
        } catch (e) {
            return null;
        }
    }

    public async run(): Promise<void> {
        const startTime = Date.now();
        logger.info('Starting EduTrack Enterprise Migration Framework...');

        if (this.options.dryRun) {
            logger.plan('DRY-RUN MODE ACTIVATED. No database modifications will occur.');
        }

        const client: any = this.createDbClient();

        if (client) {
            try {
                await client.connect();
            } catch (err: any) {
                logger.warn(`Could not connect to database at '${this.config.connectionString}': ${err.message}`);
                logger.warn('Proceeding in static validation / dry-run inspection mode...');
            }
        } else {
            logger.info('PostgreSQL driver (pg) not dynamically loaded. Running in static validation mode.');
        }

        // Handle --status
        if (this.options.status) {
            await this.displayStatus(client);
            if (client && client.end) await client.end();
            return;
        }

        // Handle --rollback
        if (this.options.rollback) {
            if (client && client.query) {
                await RollbackRunner.rollbackLastMigration(client);
                await client.end();
            } else {
                logger.error('Rollback requires an active database driver.');
            }
            return;
        }

        const allMigrations = this.getMigrationFiles();
        const pendingMigrations = this.filterMigrations(allMigrations);
        const summaryItems: MigrationSummaryItem[] = [];

        logger.info(`Detected ${allMigrations.length} total migrations. Filtered ${pendingMigrations.length} to evaluate.`);

        // Dry-Run Logic
        if (this.options.dryRun) {
            for (const migration of pendingMigrations) {
                logger.plan(`Evaluating Execution Plan for '${migration.name}'...`);
                const valResult = MigrationValidator.validateMigration(migration.filePath, migration.name);

                if (!valResult.valid) {
                    logger.error(`Validation Failed for '${migration.name}': ${valResult.errors.join(', ')}`);
                } else {
                    logger.success(`Validation Passed for '${migration.name}'. Target objects: [${valResult.affectedTables.join(', ')}]`);
                }

                summaryItems.push({
                    name: migration.name,
                    status: 'DRY-RUN',
                    durationMs: 0,
                    affectedTables: valResult.affectedTables,
                    affectedViews: valResult.affectedViews,
                    affectedFunctions: valResult.affectedFunctions,
                    error: valResult.valid ? undefined : valResult.errors.join('; ')
                });
            }

            const reportPath = MigrationReportGenerator.generateReport(summaryItems, Date.now() - startTime, true);
            logger.success(`Dry-run migration report generated at '${reportPath}'.`);
            if (client && client.end) await client.end();
            return;
        }

        // Production Execution Mode
        if (client && client.query) {
            const locked = await DatabaseLockManager.acquireLock(client);
            if (!locked) {
                await client.end();
                return;
            }

            // Create Pre-execution Backup
            await MigrationBackupManager.createBackup(this.config.connectionString);
            const executedSet = await MigrationHistoryManager.getExecutedMigrations(client);

            for (const migration of pendingMigrations) {
                if (executedSet.has(migration.name)) {
                    logger.info(`Skipping already executed migration '${migration.name}'.`);
                    summaryItems.push({
                        name: migration.name,
                        status: 'SKIPPED',
                        durationMs: 0,
                        affectedTables: [],
                        affectedViews: [],
                        affectedFunctions: []
                    });
                    continue;
                }

                // Pre-execution validation
                const valResult = MigrationValidator.validateMigration(migration.filePath, migration.name);
                if (!valResult.valid) {
                    logger.error(`Aborting execution due to safety/validation failure in '${migration.name}'.`);
                    break;
                }

                const sql = fs.readFileSync(migration.filePath, 'utf8');
                const checksum = MigrationHistoryManager.calculateChecksum(sql);
                const historyId = await MigrationHistoryManager.recordStart(client, migration.name, checksum);
                const itemStartTime = Date.now();

                try {
                    logger.info(`Executing '${migration.name}' inside atomic transaction...`);
                    await client.query('BEGIN;');
                    await client.query(sql);
                    await client.query('COMMIT;');

                    const duration = Date.now() - itemStartTime;
                    await MigrationHistoryManager.recordSuccess(client, historyId, duration);
                    logger.success(`Successfully executed '${migration.name}' in ${duration} ms.`);

                    summaryItems.push({
                        name: migration.name,
                        status: 'EXECUTED',
                        durationMs: duration,
                        affectedTables: valResult.affectedTables,
                        affectedViews: valResult.affectedViews,
                        affectedFunctions: valResult.affectedFunctions
                    });
                } catch (err: any) {
                    await client.query('ROLLBACK;');
                    const duration = Date.now() - itemStartTime;
                    await MigrationHistoryManager.recordFailure(client, historyId, err.message);
                    logger.error(`Execution failed for '${migration.name}': ${err.message}. Transaction rolled back.`);

                    summaryItems.push({
                        name: migration.name,
                        status: 'FAILED',
                        durationMs: duration,
                        affectedTables: valResult.affectedTables,
                        affectedViews: valResult.affectedViews,
                        affectedFunctions: valResult.affectedFunctions,
                        error: err.message
                    });

                    break; // Stop on first failure
                }
            }

            await DatabaseLockManager.releaseLock(client);
            await client.end();
        }

        const reportPath = MigrationReportGenerator.generateReport(summaryItems, Date.now() - startTime, false);
        logger.success(`Migration execution completed. Report saved at '${reportPath}'.`);
    }

    private async displayStatus(client: any): Promise<void> {
        logger.info('--- EDUTRACK MIGRATION STATUS ---');
        const all = this.getMigrationFiles();
        let executed = new Set<string>();

        if (client && client.query) {
            try {
                executed = await MigrationHistoryManager.getExecutedMigrations(client);
            } catch (e) {
                logger.warn('Migration history table not found or not initialized yet.');
            }
        }

        for (const m of all) {
            const isExecuted = executed.has(m.name);
            const statusLabel = isExecuted ? '\x1b[32m[EXECUTED]\x1b[0m' : '\x1b[33m[PENDING]\x1b[0m';
            console.log(`${statusLabel} ${m.name}`);
        }
    }
}

// Instantiate and run if executed directly
if (require.main === module) {
    const runner = new MigrationRunner();
    runner.run().catch(err => {
        logger.error(`Fatal migration runner error: ${err.message}`);
        process.exit(1);
    });
}
