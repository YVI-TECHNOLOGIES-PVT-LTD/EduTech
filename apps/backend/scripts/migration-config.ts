import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from backend root or workspace root
dotenv.config({ path: path.join(process.cwd(), '.env') });

export interface MigrationOptions {
    dryRun: boolean;
    from?: number;
    to?: number;
    only?: number;
    rollback: boolean;
    status: boolean;
}

export interface DatabaseConfig {
    connectionString: string;
    migrationsDir: string;
}

export class MigrationConfig {
    public static getDatabaseConfig(): DatabaseConfig {
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl && process.env.NODE_ENV !== 'test') {
            console.warn('[Config Warning] DATABASE_URL is not defined in process.env');
        }

        return {
            connectionString: dbUrl || 'postgres://localhost:5432/edutrack',
            migrationsDir: path.join(process.cwd(), 'database', 'migrations')
        };
    }

    public static parseCliArgs(): MigrationOptions {
        const args = process.argv.slice(2);
        const options: MigrationOptions = {
            dryRun: false,
            rollback: false,
            status: false
        };

        for (const arg of args) {
            if (arg === '--dry-run') options.dryRun = true;
            else if (arg === '--rollback') options.rollback = true;
            else if (arg === '--status') options.status = true;
            else if (arg.startsWith('--from=')) options.from = parseInt(arg.split('=')[1], 10);
            else if (arg.startsWith('--to=')) options.to = parseInt(arg.split('=')[1], 10);
            else if (arg.startsWith('--only=')) options.only = parseInt(arg.split('=')[1], 10);
        }

        return options;
    }
}
