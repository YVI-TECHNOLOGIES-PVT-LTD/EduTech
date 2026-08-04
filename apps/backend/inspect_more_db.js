const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function inspect() {
    console.log("--- Detailed Supabase Table and Master Data Inspection ---");
    
    // List all public table names
    const { data: tables, error: tableErr } = await supabase.rpc('exec_transaction_queries', {
        sql_queries: [
            `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
        ]
    });
    console.log("All BASE Tables in public schema (via SQL):", tableErr ? tableErr.message : tables);

    // Let's run a SELECT query directly on schools and academic_years to see their row values.
    const { data: schools } = await supabase.from('schools').select('*');
    console.log("SCHOOLS list:", schools);
    
    const { data: academicYears } = await supabase.from('academic_years').select('*');
    console.log("ACADEMIC YEARS list:", academicYears);

    const { data: classes } = await supabase.from('classes').select('id, name').limit(10);
    console.log("CLASSES list (top 10):", classes);
}

inspect();
