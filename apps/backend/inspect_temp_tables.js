const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function inspect() {
    console.log("--- Temporary Table Inspection ---");
    
    // Clean up if exists
    await supabase.rpc('exec_transaction_queries', {
        sql_queries: [
            `DROP TABLE IF EXISTS public.temp_inspect_tables`
        ]
    });
    
    // Create temp table with public table names
    const { error: err1 } = await supabase.rpc('exec_transaction_queries', {
        sql_queries: [
            `CREATE TABLE public.temp_inspect_tables AS 
             SELECT table_name FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
        ]
    });
    
    if (err1) {
        console.error("Error creating temp table:", err1.message);
        return;
    }
    
    // Fetch from temp table
    const { data: tables, error: err2 } = await supabase.from('temp_inspect_tables').select('*');
    if (err2) {
        console.error("Error fetching temp table data:", err2.message);
    } else {
        console.log("Public Database Tables:", tables.map(t => t.table_name));
    }
    
    // Clean up
    await supabase.rpc('exec_transaction_queries', {
        sql_queries: [
            `DROP TABLE IF EXISTS public.temp_inspect_tables`
        ]
    });
}

inspect();
