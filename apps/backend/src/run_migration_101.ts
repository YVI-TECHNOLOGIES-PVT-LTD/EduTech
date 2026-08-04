import { supabase } from './config/supabase';
import * as fs from 'fs';
import * as path from 'path';

function splitSql(sql: string): string[] {
    const queries: string[] = [];
    let current = '';
    let inDollarQuote = false;
    for (let i = 0; i < sql.length; i++) {
        const char = sql[i];
        const nextTwo = sql.substring(i, i + 2);
        if (nextTwo === '$$') {
            inDollarQuote = !inDollarQuote;
            current += '$$';
            i++; // skip next char
            continue;
        }
        if (char === ';' && !inDollarQuote) {
            queries.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    if (current.trim()) {
        queries.push(current.trim());
    }
    return queries;
}

async function runMigration() {
    console.log('--- Applying Migration 101 (Admission Assessment Engine) ---');
    const sqlPath = path.join(__dirname, '../database/migrations/101_admission_assessment_engine.sql');
    if (!fs.existsSync(sqlPath)) {
        throw new Error(`Migration file not found at: ${sqlPath}`);
    }
    const rawSql = fs.readFileSync(sqlPath, 'utf8');

    // 1. Strip all SQL single-line comments
    const cleanSql = rawSql.replace(/--.*$/gm, '');

    // 2. Split by semicolon, clean spaces and transaction boundaries respecting dollar quotes
    const sqlQueries = splitSql(cleanSql)
        .map(q => q.trim())
        .filter(q => {
            if (!q) return false;
            const lower = q.toLowerCase();
            if (lower === 'begin' || lower === 'commit' || lower === 'rollback') {
                return false;
            }
            return true;
        });

    console.log(`Executing ${sqlQueries.length} SQL statements via RPC exec_transaction_queries...`);

    const { data, error } = await supabase.rpc('exec_transaction_queries', { sql_queries: sqlQueries });

    if (error) {
        console.error('Migration Failed:', error.message);
        process.exit(1);
    } else {
        console.log('✅ Migration 101 Applied Successfully!');
        console.log('RPC Response:', data);
    }
}

runMigration().catch(console.error);
