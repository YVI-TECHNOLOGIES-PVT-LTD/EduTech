#!/usr/bin/env node
/**
 * AMAT Stage 2 — Live Golden Student execution (API parity with production UI)
 */
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API = process.env.AMAT_API_URL || 'http://127.0.0.1:3000/api';
const PASSWORD = process.env.DEFAULT_DEMO_PASSWORD || 'Welcome#321';
const RUN_ID = 'AMAT-2026';
const TIMESTAMP = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 12);

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const log = [];
const fail = (step, msg, detail) => {
    log.push({ step, status: 'FAIL', msg, detail });
    console.error(`\n❌ STEP ${step}: ${msg}`, detail ? JSON.stringify(detail, null, 2) : '');
    throw new Error(`AMAT failed at step ${step}: ${msg}`);
};
const pass = (step, msg, detail) => {
    log.push({ step, status: 'PASS', msg, detail });
    console.log(`✅ STEP ${step}: ${msg}`);
};

async function login(email) {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password: PASSWORD });
    if (error) throw new Error(`Login failed for ${email}: ${error.message}`);
    return data.session.access_token;
}

async function api(token, method, urlPath, body, headers = {}) {
    const res = await fetch(`${API}${urlPath}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    return { status: res.status, data, ok: res.ok };
}

async function main() {
    console.log('=== AMAT Stage 2 Live Execution ===');
    console.log(`Run ID: ${RUN_ID} | Timestamp: ${TIMESTAMP}\n`);

    // Resolve context
    const { data: schools } = await supabaseAdmin.from('schools').select('id').order('created_at', { ascending: true }).limit(1);
    const school = schools?.[0];
    if (!school) fail('0', 'No school found');
    const { data: years } = await supabaseAdmin.from('academic_years')
        .select('id').eq('school_id', school.id).eq('is_active', true).limit(1);
    const academicYearId = years?.[0]?.id;
    if (!academicYearId) fail('0', 'No active academic year');

    const { data: counselorUser } = await supabaseAdmin.from('users')
        .select('id, full_name, email').eq('email', 'counselor@edu.in').maybeSingle();
    if (!counselorUser) fail('0', 'Counselor user not found — run seed_admission_users.js');

    const useUniqueStudent = process.env.AMAT_UNIQUE_RUN === '1';
    const uniqueSuffix = TIMESTAMP.slice(-6).split('').map(d => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[parseInt(d, 10) % 26]).join('');
    const studentName = useUniqueStudent ? `Aarav Mehta Run${uniqueSuffix}` : 'Aarav Mehta';

    // STEP 1 — Receptionist create inquiry
    const receptionistToken = await login('receptionist@edu.in');
    const enquiryPayload = {
        school_id: school.id,
        academic_year_id: academicYearId,
        student_name: studentName,
        parent_name: 'Priya Mehta',
        parent_email: `priya.amat2026+${TIMESTAMP}@test.edu.in`,
        parent_phone: '+919876543210',
        grade_applied_for: 'Grade 5',
        source: 'Walk-in',
        date_of_birth: '2015-03-15',
        gender: 'Male',
        ignore_duplicate: true,
    };

    const createRes = await api(receptionistToken, 'POST', '/v1/admission/crm/enquiries', enquiryPayload);
    if (!createRes.ok) fail('1', 'Create enquiry failed', createRes);
    const enquiryId = createRes.data?.id ?? createRes.data?.data?.id;
    if (!enquiryId) fail('1', 'No enquiry id returned', createRes.data);

    const listRes = await api(receptionistToken, 'GET', '/v1/admission/crm/enquiries?limit=50');
    const listItems = listRes.data?.data || [];
    const inList = listItems.some(e => e.id === enquiryId || e.enquiry_id === enquiryId);
    if (!inList) fail('1', 'Enquiry not in list', { enquiryId, count: listItems.length });
    pass('1', 'Inquiry created and listed', { enquiryId, student: enquiryPayload.student_name });

    // STEP 2 — Assign counselor
    const assignRes = await api(
        receptionistToken,
        'PUT',
        `/v1/admission/crm/leads/${enquiryId}/assign`,
        { counselorId: counselorUser.id, strategy: 'manual' },
        { 'x-correlation-id': `amat-${TIMESTAMP}-assign` }
    );
    if (!assignRes.ok) fail('2', 'Assign counselor failed', assignRes);
    if (assignRes.status === 409) fail('2', 'Assign returned 409 conflict', assignRes);

    const enquiryAfterAssign = await api(receptionistToken, 'GET', `/v1/admission/crm/enquiries/${enquiryId}`);
    const assignedId = enquiryAfterAssign.data?.assigned_counselor_id;
    if (!assignedId) fail('2', 'assigned_counselor_id not populated', enquiryAfterAssign.data);
    const assignedBy = enquiryAfterAssign.data?.assigned_by;
    pass('2', 'Counselor assigned', {
        counselor_id: assignedId,
        assigned_counselor: enquiryAfterAssign.data?.assigned_counselor,
        assigned_by: assignedBy,
        assigned_at: enquiryAfterAssign.data?.assigned_at,
    });
    if (!assignedBy) fail('2', 'assigned_by not populated from assignment audit', enquiryAfterAssign.data);

    // STEP 3 — Counselor follow-up
    const counselorToken = await login('counselor@edu.in');
    const leadsRes = await api(counselorToken, 'GET', '/v1/admission/crm/leads?limit=50');
    const leads = leadsRes.data?.data || [];
    const leadRecord = leads.find(l => l.enquiry_id === enquiryId || l.id === enquiryId);
    const leadId = leadRecord?.id || leadRecord?.lead_id || enquiryId;
    if (!leadRecord) fail('3', 'Assigned lead not visible to counselor', { enquiryId, leadCount: leads.length });

    const followupRes = await api(counselorToken, 'POST', '/v1/admission/crm/followups', {
        lead_id: leadId,
        scheduled_date: new Date(Date.now() + 86400000).toISOString(),
        notes: `AMAT ${RUN_ID} follow-up`,
    });
    if (!followupRes.ok) fail('3', 'Create follow-up failed', followupRes);
    pass('3', 'Follow-up created', { followupId: followupRes.data?.id, leadId });

    // STEP 4 — Convert
    const convertRes = await api(
        counselorToken,
        'POST',
        `/v1/admission/crm/enquiries/${enquiryId}/convert`,
        {},
        {
            'x-correlation-id': `amat-${TIMESTAMP}-convert`,
            'x-academic-year-id': academicYearId,
        }
    );
    if (convertRes.status !== 200 && convertRes.status !== 201) fail('4', 'Convert failed', convertRes);
    const { lead_id, application_id } = convertRes.data || {};
    if (!lead_id || !application_id) fail('4', 'Response missing lead_id or application_id', convertRes.data);
    pass('4', 'Convert succeeded', convertRes.data);

    // Idempotent re-convert must return same application
    const convert2 = await api(counselorToken, 'POST', `/v1/admission/crm/enquiries/${enquiryId}/convert`, {});
    if (convert2.data?.application_id !== application_id) {
        fail('4', 'Re-convert returned different application_id (duplicate risk)', convert2.data);
    }

    // STEP 5 — UI data parity via API
    const leadAfter = await api(counselorToken, 'GET', `/v1/admission/crm/leads/${lead_id}`);
    const enriched = leadAfter.data;
    if (!enriched?.application_id) fail('5', 'Lead missing application_id after convert', enriched);
    pass('5', 'Lead card fields present', {
        application_id: enriched.application_id,
        assigned_counselor_id: enriched.assigned_counselor_id,
        status: enriched.status,
    });

    // STEP 6 — Applicant360
    const appRes = await api(counselorToken, 'GET', `/v1/admission/application/${application_id}`);
    if (!appRes.ok) fail('6', 'Applicant360 CRM application load failed', appRes);
    const timelineRes = await api(counselorToken, 'GET', `/v1/admission/application/${application_id}/timeline`);
    if (!timelineRes.ok) fail('6', 'Applicant360 timeline failed', timelineRes);
    pass('6', 'Applicant360 loads', {
        student: appRes.data?.enquiry?.student_name || appRes.data?.application?.id,
        timelineEvents: Array.isArray(timelineRes.data) ? timelineRes.data.length : 0,
    });

    // STEP 7 — Database verification
    const { data: dbEnquiry, error: dbEnquiryErr } = await supabaseAdmin
        .from('admission_enquiries')
        .select('*')
        .eq('id', enquiryId)
        .maybeSingle();
    if (dbEnquiryErr || !dbEnquiry) fail('7', 'Enquiry row not found in DB', { enquiryId, dbEnquiryErr });
    const { data: dbLeads } = await supabaseAdmin.from('admission_leads').select('*').eq('enquiry_id', enquiryId).is('deleted_at', null);
    const { data: dbApps } = await supabaseAdmin.from('admission_applications').select('*').eq('lead_id', lead_id).is('deleted_at', null);

    if (dbEnquiry?.status !== 'converted') fail('7', 'Enquiry status not converted', dbEnquiry);
    if ((dbLeads || []).length !== 1) fail('7', `Expected 1 lead, got ${(dbLeads || []).length}`, dbLeads);
    if ((dbApps || []).length !== 1) fail('7', `Expected 1 application, got ${(dbApps || []).length}`, dbApps);
    const appRow = dbApps[0];
    if (appRow.school_id !== school.id) fail('7', 'Application school_id mismatch', appRow);
    if (appRow.academic_year_id !== academicYearId) fail('7', 'Application academic_year_id mismatch', appRow);
    pass('7', 'Database integrity verified', {
        enquiry_status: dbEnquiry.status,
        lead_count: dbLeads.length,
        application_count: dbApps.length,
        application_id,
    });

    const leadRow = dbLeads[0];

    // Write summary JSON for report
    const summary = {
        runId: RUN_ID,
        timestamp: TIMESTAMP,
        enquiryId,
        leadId: lead_id,
        applicationId: application_id,
        log,
        convertResponse: convertRes.data,
        db: {
            enquiry: { id: dbEnquiry.id, status: dbEnquiry.status },
            lead: { id: leadRow.id, enquiry_id: leadRow.enquiry_id, counselor_id: leadRow.counselor_id },
            application: { id: appRow.id, lead_id: appRow.lead_id, status: appRow.status },
        },
    };
    require('fs').writeFileSync(
        path.join(__dirname, `amat-stage2-result-${TIMESTAMP}.json`),
        JSON.stringify(summary, null, 2)
    );

    if (process.exitCode !== 1) {
        console.log('\n🎉 AMAT Stage 2 live API execution PASSED');
    }
}

main().catch(err => {
    console.error('Fatal:', err);
    process.exitCode = 1;
});
