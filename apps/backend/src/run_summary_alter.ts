import { supabase } from './config/supabase';

async function run() {
    const sqlQueries = [
        `ALTER TABLE public.student_attendance_summary ADD COLUMN IF NOT EXISTS total_present INT NOT NULL DEFAULT 0`,
        `ALTER TABLE public.student_attendance_summary ADD COLUMN IF NOT EXISTS total_absent INT NOT NULL DEFAULT 0`,
        `ALTER TABLE public.student_attendance_summary ADD COLUMN IF NOT EXISTS total_late INT NOT NULL DEFAULT 0`,
        `ALTER TABLE public.student_attendance_summary ADD COLUMN IF NOT EXISTS attendance_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00`,
        `ALTER TABLE public.student_attendance_summary ADD COLUMN IF NOT EXISTS last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW()`
    ];

    console.log('Running student_attendance_summary alter columns...');
    const { data, error } = await supabase.rpc('exec_transaction_queries', { sql_queries: sqlQueries });
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('✅ Columns altered successfully!');
    }
    process.exit(0);
}
run();
