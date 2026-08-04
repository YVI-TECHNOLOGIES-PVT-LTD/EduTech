const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
    console.log("Applying migration 119_academic_records_engine.sql...");
    const sqlPath = path.join(__dirname, '../database/migrations/119_academic_records_engine.sql');
    if (!fs.existsSync(sqlPath)) {
        throw new Error(`Missing migration file at: ${sqlPath}`);
    }
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    const queries = sql.replace(/--.*$/gm, '').split(';').map(q => q.trim()).filter(q => {
        if (!q) return false;
        const lower = q.toLowerCase();
        return lower !== 'begin' && lower !== 'commit' && lower !== 'rollback';
    });
    
    for (const query of queries) {
        const { error } = await supabase.rpc('exec_transaction_queries', { sql_queries: [query] });
        if (error) {
            throw new Error(`Failed on: ${query}. Message: ${error.message}`);
        }
    }
    console.log("✅ Migration 119 successfully applied!");
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
