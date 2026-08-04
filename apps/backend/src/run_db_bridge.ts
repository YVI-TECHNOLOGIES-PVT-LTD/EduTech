import { supabase } from './config/supabase';

async function run() {
    const sqlQueries = [
        `ALTER TABLE public.students ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL`,
        `ALTER TABLE public.students ADD COLUMN IF NOT EXISTS admission_no TEXT`,
        `ALTER TABLE public.students ADD COLUMN IF NOT EXISTS first_name TEXT`,
        `ALTER TABLE public.students ADD COLUMN IF NOT EXISTS last_name TEXT`,
        `ALTER TABLE public.students ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE`,
        `ALTER TABLE public.students ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE`,
        `UPDATE public.students SET first_name = COALESCE(NULLIF(split_part(full_name, ' ', 1), ''), 'First'), last_name = COALESCE(NULLIF(split_part(full_name, ' ', 2), ''), 'Last') WHERE first_name IS NULL`,
        `UPDATE public.students SET admission_no = COALESCE(student_code, 'ADM-' || substring(id::text from 1 for 8)) WHERE admission_no IS NULL`
    ];

    // Check if we can seed academic year id
    const { data: years } = await supabase.from('academic_years').select('id').limit(1);
    if (years && years.length > 0) {
        sqlQueries.push(`UPDATE public.students SET academic_year_id = '${years[0].id}' WHERE academic_year_id IS NULL`);
    }

    console.log('Applying DB Schema Bridge migrations via exec_transaction_queries...');
    const { data, error } = await supabase.rpc('exec_transaction_queries', { sql_queries: sqlQueries });
    if (error) {
        console.error('Error applying schema updates:', error.message);
    } else {
        console.log('✅ DB Schema updates successfully applied!');
    }
    process.exit(0);
}
run();
