import { supabase } from './config/supabase';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
    console.log('--- Applying Migration 088 (Workflow Platform) ---');
    const sqlPath = path.join(__dirname, '../database/migrations/088_workflow_automation_engine.sql');
    const rawSql = fs.readFileSync(sqlPath, 'utf8');

    // 1. Strip all SQL single-line comments
    const cleanSql = rawSql.replace(/--.*$/gm, '');

    // 2. Split by semicolon, clean spaces and transaction boundaries
    const sqlQueries = cleanSql
        .split(';')
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
    
    // Log the queries to verify
    for (let i = 0; i < sqlQueries.length; i++) {
        console.log(`[Query ${i + 1}]: ${sqlQueries[i].substring(0, 80)}...`);
    }

    const { data, error } = await supabase.rpc('exec_transaction_queries', { sql_queries: sqlQueries });

    if (error) {
        console.error('Migration Failed:', error.message);
        process.exit(1);
    } else {
        console.log('✅ Migration Applied Successfully!');
        console.log('RPC Response:', data);
    }
}

runMigration().catch(console.error);
