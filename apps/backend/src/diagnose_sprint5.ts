import { supabase } from './config/supabase';

async function diagnose() {
    console.log('--- Database Diagnostics for Sprint 5 Evaluation Schema ---');
    
    const tables = [
        'admission_exam_templates',
        'admission_exam_subjects',
        'admission_exam_schedule',
        'admission_exam_session_candidates',
        'admission_exam_results',
        'admission_interview_panels',
        'admission_interviews',
        'admission_interview_criteria',
        'admission_interview_scores',
        'admission_merit_rules',
        'admission_merit_components',
        'admission_merit_results',
        'admission_offer_templates',
        'admission_offer_letters',
        'admission_waitlist_promotions',
        'admission_hall_tickets',
        'exam_workflow_rules',
        'interview_workflow_rules',
        'offer_workflow_rules'
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
