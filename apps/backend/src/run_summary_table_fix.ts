import { supabase } from './config/supabase';

async function run() {
    const sqlQueries = [
        `DROP VIEW IF EXISTS public.student_attendance_summary CASCADE`,
        `CREATE TABLE public.student_attendance_summary (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
            academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE NOT NULL,
            month INT NOT NULL,
            total_present INT NOT NULL DEFAULT 0,
            total_absent INT NOT NULL DEFAULT 0,
            total_late INT NOT NULL DEFAULT 0,
            attendance_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
            last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT unique_student_monthly_summary UNIQUE (student_id, academic_year_id, month)
        )`
    ];

    console.log('Replacing student_attendance_summary view with table...');
    const { data, error } = await supabase.rpc('exec_transaction_queries', { sql_queries: sqlQueries });
    if (error) {
        console.error('Error executing query:', error.message);
    } else {
        console.log('✅ View replaced with table successfully!');
    }
    process.exit(0);
}
run();
