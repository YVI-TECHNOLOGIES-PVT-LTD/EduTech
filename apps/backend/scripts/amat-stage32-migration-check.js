#!/usr/bin/env node
/**
 * AMAT Stage 3.2 — Migration validation report
 */
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const STAGE3_MIGRATIONS = [
    '083_admission_sprint4_documents.sql',
    '085_admission_sprint6_enrollment.sql',
    '086_student_master.sql',
    '090_counselor_document_permissions.sql',
    '091_admission_stage31_checklist_seed.sql',
    '092_admission_atomic_erp_provision.sql',
];

async function checkTable(table) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    return { table, count: count ?? 0, error: error?.message ?? null };
}

async function checkRpc(name) {
    const { error } = await supabase.rpc(name, {
        p_application_id: '00000000-0000-0000-0000-000000000001',
        p_admission_number: 'TEST-000',
        p_performed_by: null,
    });
    const exists = !error?.message?.includes('Could not find the function');
    return { name, exists, probeError: exists ? (error?.message ?? null) : null };
}

async function checkCounselorDocPerms() {
    const { data: roles } = await supabase.from('roles').select('id, name').in('name', ['COUNSELOR', 'COUNSELLOR']);
    if (!roles?.length) return { ok: false, reason: 'COUNSELOR role missing' };
    const { data: perms } = await supabase.from('permissions').select('id, code').in('code', [
        'admission.document.upload',
        'admission.document.view',
        'admission.document.download',
    ]);
    if ((perms ?? []).length < 3) return { ok: false, reason: 'Document permissions missing' };
    const roleIds = roles.map(r => r.id);
    const permIds = perms.map(p => p.id);
    const { count } = await supabase
        .from('role_permissions')
        .select('*', { count: 'exact', head: true })
        .in('role_id', roleIds)
        .in('permission_id', permIds);
    return { ok: (count ?? 0) >= 3, counselorPermLinks: count ?? 0 };
}

async function main() {
    console.log('=== AMAT Stage 3.2 Migration Validation ===\n');

    const report = {
        timestamp: new Date().toISOString(),
        migrationFiles: STAGE3_MIGRATIONS.map(f => ({
            file: f,
            exists: fs.existsSync(path.join(__dirname, '../database/migrations', f)),
        })),
        tables: {},
        checklist: {},
        rpc: {},
        counselorPermissions: {},
        status: 'PASS',
        blockers: [],
    };

    const tables = [
        'document_types',
        'document_checklists',
        'application_documents',
        'document_versions',
        'status_history',
        'audit_logs',
        'student_provisioning_jobs',
        'admission_confirmation',
        'students',
        'student_profiles',
    ];

    for (const t of tables) {
        const r = await checkTable(t);
        report.tables[t] = r;
        if (r.error && !r.error.includes('does not exist')) {
            report.blockers.push(`Table ${t}: ${r.error}`);
        }
    }

    if ((report.tables.document_types?.count ?? 0) < 1) {
        report.blockers.push('document_types has no rows — run 083');
    }
    if ((report.tables.document_checklists?.count ?? 0) < 1) {
        report.blockers.push('document_checklists empty — run 091');
    }

    const { data: schools } = await supabase.from('schools').select('id').limit(1);
    const { data: years } = await supabase.from('academic_years').select('id').eq('is_active', true).limit(1);
    if (schools?.[0] && years?.[0]) {
        const { count: checklistGrade5 } = await supabase
            .from('document_checklists')
            .select('*', { count: 'exact', head: true })
            .eq('school_id', schools[0].id)
            .eq('academic_year_id', years[0].id)
            .eq('grade', 'Grade 5');
        report.checklist.grade5Rows = checklistGrade5 ?? 0;
        if ((checklistGrade5 ?? 0) < 1) {
            report.blockers.push('No Grade 5 checklist rows for active school/year — run 091');
        }
    }

    report.rpc.provision = await checkRpc('fn_provision_admission_student');
    if (!report.rpc.provision.exists) {
        report.blockers.push('fn_provision_admission_student missing — run 092');
    }

    report.counselorPermissions = await checkCounselorDocPerms();
    if (!report.counselorPermissions.ok) {
        report.blockers.push(`Counselor document permissions: ${report.counselorPermissions.reason ?? 'incomplete'} — run 090`);
    }

    if (report.blockers.length) report.status = 'FAIL';

    const outPath = path.join(__dirname, `amat-stage32-migration-report-${Date.now()}.json`);
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

    console.log(JSON.stringify(report, null, 2));
    console.log(`\nReport written: ${outPath}`);
    console.log(`\nRESULT: ${report.status}`);
    if (report.blockers.length) {
        console.log('Blockers:');
        report.blockers.forEach(b => console.log(`  - ${b}`));
        process.exitCode = 1;
    }
}

main().catch(err => {
    console.error(err);
    process.exitCode = 1;
});
