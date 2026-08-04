import { supabase } from './config/supabase';

async function run() {
    const { data, error } = await supabase
        .from('student_attendance_summary')
        .select('student_id');

    console.log('Query Result:', data);
    console.log('Error details:', error);
    process.exit(0);
}
run();
