
import { supabase } from './config/supabase';

async function diagnose() {
    console.log('--- Database Diagnostics (Robust) ---');

    // 1. Check exams columns by selecting ALL first
    console.log('Checking exams table structure...');
    const { data: examsData, error: examsError } = await supabase.from('exams').select('*').limit(1);

    if (examsError) {
        console.error('Error fetching ALL from exams:', examsError.message);
    } else if (examsData && examsData.length > 0) {
        console.log('Columns found in exams:', Object.keys(examsData[0]).join(', '));
    } else {
        console.log('Exams table is empty. Trying to guess columns via individual selects...');
        const columns = ['id', 'status', 'seating_status', 'eligibility_frozen', 'hall_ticket_status', 'result_status'];
        for (const col of columns) {
            const { error } = await supabase.from('exams').select(col).limit(1);
            if (error) {
                console.log(`Column [${col}] is MISSING: ${error.message}`);
            } else {
                console.log(`Column [${col}] exists.`);
            }
        }
    }

    // 2. Check exam_seating_allocations table structure...
    console.log('\nChecking exam_seating_allocations table structure...');
    const { data: seatData, error: seatError } = await supabase.from('exam_seating_allocations').select('*').limit(1);

    if (seatError) {
        console.error('Error fetching ALL from exam_seating_allocations:', seatError.message);
    } else if (seatData && seatData.length > 0) {
        console.log('Columns found in exam_seating_allocations:', Object.keys(seatData[0]).join(', '));
    } else {
        console.log('Table exam_seating_allocations is empty. Guessing columns...');
        const columns = ['id', 'exam_id', 'exam_schedule_id', 'student_id', 'hall_id', 'seat_number'];
        for (const col of columns) {
            const { error } = await supabase.from('exam_seating_allocations').select(col).limit(1);
            if (error) {
                console.log(`Column [${col}] is MISSING: ${error.message}`);
            } else {
                console.log(`Column [${col}] exists.`);
            }
        }
    }

    // 4. Check exam_halls
    console.log('\nChecking exam_halls table...');
    const { data: hallData, error: hallError } = await supabase.from('exam_halls').select('*').limit(1);
    if (hallError) {
        console.error('Error fetching from exam_halls:', hallError.message);
    } else if (hallData && hallData.length > 0) {
        console.log('Columns found in exam_halls:', Object.keys(hallData[0]).join(', '));
    }
    // 5. Check exam_seating_versions
    console.log('\nChecking exam_seating_versions table...');
    const { error: vError } = await supabase.from('exam_seating_versions').select('id').limit(1);
    if (vError) {
        console.log('exam_seating_versions table is MISSING:', vError.message);
    } else {
        console.log('exam_seating_versions table exists.');
    }
}

diagnose().catch(console.error);
