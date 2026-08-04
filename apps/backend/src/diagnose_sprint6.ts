import { supabase } from './config/supabase';

async function diagnose() {
    console.log('--- Database Diagnostics for Sprint 6 Enrollment Schema ---');
    
    const tables = [
        'admission_fee_structures',
        'admission_fee_components',
        'admission_fee_assignments',
        'admission_payments',
        'admission_payment_receipts',
        'admission_fee_waivers',
        'admission_confirmation',
        'admission_number_sequences',
        'admission_enrollment_logs',
        'enrollment_workflow_rules',
        'student_provisioning_jobs',
        'admission_conversion_metrics'
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
