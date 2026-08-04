const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function inspect() {
    console.log("--- Enquiry/Leads/Applications Columns ---");
    
    // Clear old audit log first
    const correlation_id = '00000000-0000-0000-0000-000000009999';
    await supabase.from('audit_logs').delete().eq('correlation_id', correlation_id);
    
    // Log enquiry columns
    await supabase.rpc('exec_transaction_queries', {
        sql_queries: [
            `INSERT INTO public.audit_logs (action, entity_name, entity_id, before_state, correlation_id)
             VALUES (
                 'INSPECT_COLUMNS_ENQUIRY', 
                 'columns', 
                 '00000000-0000-0000-0000-000000000000',
                 (SELECT json_agg(column_name) FROM information_schema.columns WHERE table_name = 'admission_enquiries')::jsonb,
                 '${correlation_id}'
             )`
        ]
    });

    // Log leads columns
    await supabase.rpc('exec_transaction_queries', {
        sql_queries: [
            `INSERT INTO public.audit_logs (action, entity_name, entity_id, after_state, correlation_id)
             VALUES (
                 'INSPECT_COLUMNS_LEADS', 
                 'columns', 
                 '00000000-0000-0000-0000-000000000000',
                 NULL,
                 (SELECT json_agg(column_name) FROM information_schema.columns WHERE table_name = 'admission_leads')::jsonb,
                 '${correlation_id}'
             )`
        ]
    });
    
    // Read them back
    const { data: logs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('correlation_id', correlation_id);
        
    if (logs) {
        logs.forEach(log => {
            console.log(log.action, ":", log.before_state || log.after_state);
        });
    }
    
    // Clean up
    await supabase.from('audit_logs').delete().eq('correlation_id', correlation_id);
}

inspect();
