#!/usr/bin/env node
/**
 * Apply Stage 3.2 migrations (090, 091, 092) via exec_transaction_queries RPC
 */
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MIGRATIONS = [
    '090_counselor_document_permissions.sql',
    '091_admission_stage31_checklist_seed.sql',
    '092_admission_atomic_erp_provision.sql',
    '093_admission_stage32_rbac_permissions.sql',
    '094_interview_exam_cell_workflow.sql',
    '095_admission_erp_provision_hybrid_students.sql',
];

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

function parseSql(rawSql) {
    const cleanSql = rawSql.replace(/--.*$/gm, '');
    return cleanSql
        .split(';')
        .map(q => q.trim())
        .filter(q => {
            if (!q) return false;
            const lower = q.toLowerCase();
            return lower !== 'begin' && lower !== 'commit' && lower !== 'rollback';
        });
}

async function applyMigration(filename) {
    const sqlPath = path.join(__dirname, '../database/migrations', filename);
    if (!fs.existsSync(sqlPath)) throw new Error(`Missing migration file: ${filename}`);
    const rawSql = fs.readFileSync(sqlPath, 'utf8');

    let queries;
    if (filename.includes('092_') || filename.includes('095_')) {
        queries = [rawSql.trim()];
    } else {
        queries = parseSql(rawSql);
    }

    console.log(`Applying ${filename} (${queries.length} statements)...`);
    const { error } = await supabase.rpc('exec_transaction_queries', { sql_queries: queries });
    if (error) throw new Error(`${filename} failed: ${error.message}`);
    console.log(`✅ ${filename}`);
}

async function main() {
    for (const m of MIGRATIONS) {
        await applyMigration(m);
    }
    console.log('\nAll Stage 3.2 migrations applied.');
}

main().catch(err => {
    console.error(err);
    process.exitCode = 1;
});
