import { supabase } from './config/supabase';

async function diagnose() {
    console.log('--- Database Diagnostics for Sprint 4 Documents Schema ---');
    
    const tables = [
        'document_types',
        'application_documents',
        'document_versions',
        'document_verification',
        'document_comments',
        'document_checklists',
        'document_workflow_rules'
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
