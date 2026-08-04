const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function inspect() {
    console.log("--- Full Tables list ---");
    const correlation_id = '00000000-0000-0000-0000-000000005678';
    
    // Clear old audit log first
    await supabase.from('audit_logs').delete().eq('correlation_id', correlation_id);
    
    await supabase.rpc('exec_transaction_queries', {
        sql_queries: [
            `INSERT INTO public.audit_logs (action, entity_name, entity_id, before_state, after_state, correlation_id)
             VALUES (
                 'INSPECT_FULL', 
                 'tables', 
                 '00000000-0000-0000-0000-000000000000',
                 NULL,
                 (SELECT json_agg(table_name) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE')::jsonb,
                 '${correlation_id}'
             )`
        ]
    });
    
    // Read it back
    const { data: logs } = await supabase
        .from('audit_logs')
        .select('after_state')
        .eq('correlation_id', correlation_id)
        .limit(1);
        
    if (logs && logs.length > 0) {
        const list = logs[0].after_state;
        console.log("Full list of public tables:", list.join(', '));
    }
    
    // Clean up
    await supabase.from('audit_logs').delete().eq('correlation_id', correlation_id);
}

inspect();
