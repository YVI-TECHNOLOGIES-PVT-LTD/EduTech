import { supabase } from './config/supabase';

async function diagnose() {
    console.log('--- Database Diagnostics for Sprint 1 Tables ---');
    const tables = [
        'feature_flags',
        'status_history',
        'audit_logs',
        'admission_enquiries',
        'admission_leads',
        'admission_followups',
        'admission_visitors'
    ];

    for (const table of tables) {
        console.log(`Checking table [${table}]...`);
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            if (error.message.includes('does not exist')) {
                console.error(`❌ Table [${table}] DOES NOT EXIST. Please execute the SQL migration 080 in Supabase Dashboard.`);
            } else {
                console.error(`⚠️ Table [${table}] check failed: ${error.message}`);
            }
        } else {
            console.log(`✅ Table [${table}] exists and is accessible.`);
        }
    }

    console.log('\nChecking admissions table soft-delete column...');
    const { error: adError } = await supabase.from('admissions').select('deleted_at').limit(1);
    if (adError) {
        console.error(`❌ Column [deleted_at] is missing in admissions table: ${adError.message}`);
    } else {
        console.log('✅ Column [deleted_at] exists in admissions table.');
    }
}

diagnose().catch(console.error);
