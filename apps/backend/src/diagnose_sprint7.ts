import { supabase } from './config/supabase';

async function diagnose() {
    console.log('--- Database Diagnostics for Sprint 7 SIS Student Master Schema ---');
    
    const tables = [
        'students',
        'student_profiles',
        'student_parents',
        'student_guardians',
        'student_documents',
        'student_academic_records',
        'student_class_allocations',
        'student_section_history',
        'student_roll_number_sequences',
        'student_promotions',
        'student_identity_cards',
        'student_barcodes',
        'student_status_history',
        'student_transfer_requests',
        'student_exit_records',
        'student_workflow_rules'
    ];

    for (const table of tables) {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            if (error.message.includes('does not exist')) {
                console.error(`❌ Table [${table}] is missing.`);
            } else {
                console.error(`⚠️ Table [${table}] check failed: ${error.message}`);
            }
        } else {
            console.log(`✅ Table [${table}] exists and is accessible.`);
        }
    }
}

diagnose().catch(console.error);
