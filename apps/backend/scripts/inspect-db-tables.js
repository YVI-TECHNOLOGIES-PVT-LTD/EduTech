const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
    console.log("Inspecting public schema tables...");
    const { data, error } = await supabase.rpc('exec_transaction_queries', {
        sql_queries: [
            `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`
        ]
    });
    
    if (error) {
        console.error("Failed to query tables:", error);
        return;
    }
    
    console.log("Tables in public schema:");
    console.log(data);
}

main().catch(err => {
    console.error(err);
});
