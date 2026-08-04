import { supabase } from './config/supabase';

async function diagnose() {
    console.log('--- Database Diagnostics for Sprint 8 Student Attendance & Leave Schema ---');
    
    const tables = [
        'student_attendance_sessions',
        'student_attendance',
        'student_period_attendance',
        'student_attendance_logs',
        'student_leave_types',
        'student_leave_requests',
        'student_leave_approvals',
        'student_attendance_corrections',
        'student_holidays',
        'student_working_days',
        'student_biometric_devices',
        'student_biometric_logs',
        'student_attendance_sync_jobs',
        'student_attendance_summary',
        'student_attendance_reports',
        'attendance_workflow_rules',
        'attendance_notifications',
        'attendance_dashboard_metrics'
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
