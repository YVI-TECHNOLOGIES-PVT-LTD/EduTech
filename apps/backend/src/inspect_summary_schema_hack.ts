import { supabase } from './config/supabase';

async function run() {
    try {
        console.log('Creating temp_columns table...');
        // Drop it first if exists
        await supabase.rpc('exec_transaction_queries', { sql_queries: ['DROP TABLE IF EXISTS public.temp_columns'] });
        
        const createSql = `
            CREATE TABLE public.temp_columns AS 
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'student_attendance_summary'
        `;
        await supabase.rpc('exec_transaction_queries', { sql_queries: [createSql] });

        console.log('Querying columns from temp_columns...');
        const { data, error } = await supabase.from('temp_columns').select('*');
        if (error) {
            console.error('Error querying temp_columns:', error);
        } else {
            console.log('Columns of student_attendance_summary:', data.map(r => r.column_name));
        }

        // Clean up
        await supabase.rpc('exec_transaction_queries', { sql_queries: ['DROP TABLE public.temp_columns'] });
    } catch (e) {
        console.error('Exception:', e);
    }
    process.exit(0);
}
run();
