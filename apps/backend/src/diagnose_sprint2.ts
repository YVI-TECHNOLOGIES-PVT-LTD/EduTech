import { supabase } from './config/supabase';

async function diagnose() {
    console.log('--- Database Diagnostics for Sprint 2 CRM Schema ---');
    
    // 1. Check tables
    const tables = [
        'feature_flags',
        'status_history',
        'audit_logs',
        'admission_enquiries',
        'admission_leads',
        'admission_followups',
        'admission_visitors',
        'request_tracking'
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

    // 2. Check enquiries columns
    console.log('\nChecking enquiries table new CRM columns...');
    const enqColumns = ['date_of_birth', 'gender', 'current_school', 'address', 'remarks'];
    for (const col of enqColumns) {
        const { error } = await supabase.from('admission_enquiries').select(col).limit(1);
        if (error) {
            console.error(`❌ Enquiry column [${col}] is missing: ${error.message}`);
        } else {
            console.log(`✅ Enquiry column [${col}] exists.`);
        }
    }

    // 3. Check visitors columns
    console.log('\nChecking visitors table new CRM columns...');
    const visColumns = ['counselor_id', 'remarks', 'visit_type', 'visit_outcome'];
    for (const col of visColumns) {
        const { error } = await supabase.from('admission_visitors').select(col).limit(1);
        if (error) {
            console.error(`❌ Visitor column [${col}] is missing: ${error.message}`);
        } else {
            console.log(`✅ Visitor column [${col}] exists.`);
        }
    }
}

diagnose().catch(console.error);
