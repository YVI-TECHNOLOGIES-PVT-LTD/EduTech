import * as fs from 'fs';
import { DependencyChecker } from './dependency-checker';
import { logger } from './logger';

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    affectedTables: string[];
    affectedViews: string[];
    affectedFunctions: string[];
}

export class MigrationValidator {
    public static validateMigration(filePath: string, fileName: string): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];
        const affectedTables: string[] = [];
        const affectedViews: string[] = [];
        const affectedFunctions: string[] = [];

        try {
            const sql = fs.readFileSync(filePath, 'utf8');

            // 1. Target Architecture Safety Verification
            const safetyCheck = DependencyChecker.verifySafety(sql, fileName);
            if (!safetyCheck.safe) {
                errors.push(...safetyCheck.violations);
            }

            // 2. Syntax & Basic DDL Parser
            const lines = sql.split('\n');
            for (const line of lines) {
                const trimmed = line.trim().toLowerCase();

                if (trimmed.includes('drop table')) {
                    const match = trimmed.match(/drop\s+table\s+(if\s+exists\s+)?([a-z0-9_]+)/i);
                    if (match && match[2]) affectedTables.push(match[2]);
                } else if (trimmed.includes('drop view')) {
                    const match = trimmed.match(/drop\s+view\s+(if\s+exists\s+)?([a-z0-9_]+)/i);
                    if (match && match[2]) affectedViews.push(match[2]);
                } else if (trimmed.includes('drop function')) {
                    const match = trimmed.match(/drop\s+function\s+(if\s+exists\s+)?([a-z0-9_]+)/i);
                    if (match && match[2]) affectedFunctions.push(match[2]);
                }
            }

            // 3. Transaction Safety Check
            const hasBegin = sql.toUpperCase().includes('BEGIN;');
            const hasCommit = sql.toUpperCase().includes('COMMIT;');
            if (!hasBegin || !hasCommit) {
                warnings.push(`Migration '${fileName}' does not explicitly contain BEGIN/COMMIT transaction block wrapper.`);
            }

        } catch (err: any) {
            errors.push(`Failed to read/validate migration script: ${err.message}`);
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            affectedTables,
            affectedViews,
            affectedFunctions
        };
    }
}
