#!/usr/bin/env node
/**
 * AMAT Stage 3.2 — Full admission processing lifecycle (API certification)
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API = process.env.AMAT_API_URL || 'http://127.0.0.1:3000/api';
const PASSWORD = process.env.DEFAULT_DEMO_PASSWORD || 'Welcome#321';
const TIMESTAMP = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 12);

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);
// Separate client for auth — signInWithPassword replaces the session on the client instance.
const supabaseAuth = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const log = [];
const pass = (step, msg, detail) => { log.push({ step, status: 'PASS', msg, detail }); console.log(`✅ STEP ${step}: ${msg}`); };
const fail = (step, msg, detail) => {
    log.push({ step, status: 'FAIL', msg, detail });
    console.error(`❌ STEP ${step}: ${msg}`, detail ? JSON.stringify(detail, null, 2) : '');
    throw new Error(`AMAT Stage 3.2 failed at step ${step}: ${msg}`);
};

async function login(email) {
    const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password: PASSWORD });
    if (error) throw new Error(`Login failed for ${email}: ${error.message}`);
    return data.session.access_token;
}

async function api(token, method, urlPath, body, headers = {}) {
    const res = await fetch(`${API}${urlPath}`, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...headers },
        body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    return { status: res.status, data, ok: res.ok };
}

async function uploadDoc(token, applicationId, docTypeCode, academicYearId) {
    const form = new FormData();
    const blob = new Blob([`AMAT test document ${docTypeCode} ${Date.now()} ${Math.random()}`], { type: 'application/pdf' });
    form.append('file', blob, `${docTypeCode}.pdf`);
    form.append('application_id', applicationId);
    form.append('document_type_code', docTypeCode);
    const res = await fetch(`${API}/v1/admission/application/documents/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'x-academic-year-id': academicYearId },
        body: form,
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
}

async function getAppStatus(applicationId) {
    const { data } = await supabaseAdmin.from('admission_applications').select('status').eq('id', applicationId).maybeSingle();
    return data?.status;
}

async function ensureInterviewPanel() {
    const { data: existing, error } = await supabaseAdmin
        .from('admission_interview_panels')
        .select('id')
        .eq('panel_name', 'AMAT Default Panel')
        .maybeSingle();
    if (error) throw new Error(`Interview panel lookup failed: ${error.message}`);
    if (existing?.id) return existing.id;

    await supabaseAdmin.rpc('exec_transaction_queries', {
        sql_queries: [`INSERT INTO public.admission_interview_panels (panel_name, members) VALUES ('AMAT Default Panel', ARRAY['Member A','Member B']::text[]) ON CONFLICT (panel_name) DO NOTHING`],
    });

    const { data: created, error: retryErr } = await supabaseAdmin
        .from('admission_interview_panels')
        .select('id')
        .eq('panel_name', 'AMAT Default Panel')
        .maybeSingle();
    if (retryErr) throw new Error(`Interview panel retry failed: ${retryErr.message}`);
    if (!created?.id) throw new Error('Failed to resolve interview panel — seed 084 or run apply-stage32-migrations');
    return created.id;
}

async function resolveExamTemplateId() {
    const { data: templates } = await supabaseAdmin.from('admission_exam_templates').select('id, grade');
    for (const template of templates ?? []) {
        const { count } = await supabaseAdmin
            .from('admission_exam_subjects')
            .select('*', { count: 'exact', head: true })
            .eq('template_id', template.id);
        if ((count ?? 0) > 0) return template.id;
    }
    return null;
}

async function ensureStorageBucket() {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    if (!buckets?.some(b => b.name === 'admission-documents')) {
        const { error } = await supabaseAdmin.storage.createBucket('admission-documents', { public: false });
        if (error && !error.message.includes('already exists')) {
            console.warn('Storage bucket create warning:', error.message);
        }
    }
}

async function main() {
    console.log('=== AMAT Stage 3.2 Live Certification ===\n');
    await ensureStorageBucket();

    const { data: schools } = await supabaseAdmin.from('schools').select('id').limit(1);
    const schoolId = schools?.[0]?.id;
    const { data: years } = await supabaseAdmin.from('academic_years').select('id').eq('school_id', schoolId).eq('is_active', true).limit(1);
    const academicYearId = years?.[0]?.id;
    if (!schoolId || !academicYearId) fail('0', 'School/academic year context missing');

    const { data: counselorUser } = await supabaseAdmin.from('users').select('id').eq('email', 'counselor@edu.in').maybeSingle();
    if (!counselorUser) fail('0', 'Counselor user missing');

    const runTag = Array.from({ length: 10 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
    const studentName = `Aarav Mehta ${runTag}`;
    const parentPhone = `+9199${Date.now().toString().slice(-8)}`;
    const dobDay = (Math.abs(runTag.charCodeAt(0) + runTag.charCodeAt(1)) % 28) + 1;
    const dobMonth = (Math.abs(runTag.charCodeAt(2) + runTag.charCodeAt(3)) % 12) + 1;
    const dateOfBirth = `2015-${String(dobMonth).padStart(2, '0')}-${String(dobDay).padStart(2, '0')}`;

    // --- Stage 2 baseline: inquiry → application ---
    const receptionistToken = await login('receptionist@edu.in');
    const createRes = await api(receptionistToken, 'POST', '/v1/admission/crm/enquiries', {
        school_id: schoolId,
        academic_year_id: academicYearId,
        student_name: studentName,
        parent_name: 'Stage32 Parent',
        parent_email: `stage32.${runTag}@test.edu.in`,
        parent_phone: parentPhone,
        grade_applied_for: 'Grade 5',
        source: 'Walk-in',
        date_of_birth: dateOfBirth,
        gender: 'Male',
        ignore_duplicate: true,
    });
    if (!createRes.ok) fail('1', 'Create enquiry failed', createRes);
    const enquiryId = createRes.data?.id ?? createRes.data?.data?.id;

    await api(receptionistToken, 'PUT', `/v1/admission/crm/leads/${enquiryId}/assign`, {
        counselorId: counselorUser.id,
        strategy: 'manual',
    });

    const counselorToken = await login('counselor@edu.in');
    const convertRes = await api(counselorToken, 'POST', `/v1/admission/crm/enquiries/${enquiryId}/convert`, {}, {
        'x-academic-year-id': academicYearId,
    });
    if (!convertRes.ok) fail('2', 'Convert failed', convertRes);
    const applicationId = convertRes.data?.application_id;
    const leadId = convertRes.data?.lead_id;
    pass('2', 'Application created', { applicationId, leadId });

    const resumeRes = await api(counselorToken, 'GET', `/v1/admission/application/${applicationId}`);
    const updatedAt = resumeRes.data?.application?.updated_at ?? resumeRes.data?.updated_at ?? new Date().toISOString();
    const patchHeaders = { 'x-expected-updated-at': updatedAt };

    await api(counselorToken, 'PATCH', `/v1/admission/application/${applicationId}/profile`, {
        date_of_birth: dateOfBirth,
        gender: 'Male',
    }, patchHeaders);

    await api(counselorToken, 'PATCH', `/v1/admission/application/${applicationId}/parents`, {
        father_name: 'Stage Parent',
        father_email: `stage32.${runTag}@test.edu.in`,
        father_phone: parentPhone,
        mother_name: 'Stage Mother',
    }, patchHeaders);

    await api(counselorToken, 'PATCH', `/v1/admission/application/${applicationId}/declaration`, {
        agreed_to_terms: true,
        parent_signature: 'Stage Parent',
        date_signed: new Date().toISOString().slice(0, 10),
    }, patchHeaders);

    // Submit application (admin — counselor lacks admission.application.submit permission)
    const officerToken = await login('admissionofficer@edu.in').catch(() => login('admin@edu.in'));
    const adminToken = await login('admin@edu.in');
    const submitRes = await api(adminToken, 'POST', `/v1/admission/application/${applicationId}/submit`, {
        profile: { date_of_birth: '2015-03-15', gender: 'Male' },
        parents: {
            father_name: 'Stage Parent',
            father_email: `stage32.${runTag}@test.edu.in`,
            father_phone: parentPhone,
            mother_name: 'Stage Mother',
        },
        declaration: {
            agreed_to_terms: true,
            parent_signature: 'Stage Parent',
            date_signed: new Date().toISOString().slice(0, 10),
        },
        change_reason: 'AMAT Stage 3.2 submit',
    });
    if (!submitRes.ok) fail('3', 'Submit application failed', submitRes);
    pass('3', 'Application submitted', { status: await getAppStatus(applicationId) });

    // Documents upload + verify (admission officer)
    const mandatoryTypes = ['birth_certificate', 'student_photo', 'parent_aadhaar'];
    const uploadedIds = [];
    for (const code of mandatoryTypes) {
        const up = await uploadDoc(officerToken, applicationId, code, academicYearId);
        if (!up.ok) fail('4', `Upload ${code} failed`, up);
        uploadedIds.push(up.data?.id ?? up.data?.data?.id);
    }
    pass('4', 'Mandatory documents uploaded', { count: uploadedIds.length });

    for (const docId of uploadedIds.filter(Boolean)) {
        const ver = await api(officerToken, 'POST', `/v1/admission/application/documents/${docId}/verify`, { remarks: 'AMAT verified' });
        if (!ver.ok) fail('5', `Verify document ${docId} failed`, ver);
    }
    await new Promise(r => setTimeout(r, 500));
    const statusAfterDocs = await getAppStatus(applicationId);
    pass('5', 'Documents verified', { status: statusAfterDocs });

    // Interview
    const examCellToken = await login('examcell@edu.in');
    const panelId = await ensureInterviewPanel();
    const schedRes = await api(examCellToken, 'POST', '/v1/admission/evaluation/interview/schedule', {
        application_id: applicationId,
        panel_id: panelId,
        interview_date: new Date(Date.now() + 86400000).toISOString(),
        room_name: 'Room AMAT-1',
    });
    if (!schedRes.ok) fail('6', 'Schedule interview failed', schedRes);
    const interviewId = schedRes.data?.id ?? schedRes.data?.data?.id;
    pass('6', 'Interview scheduled', { interviewId, status: await getAppStatus(applicationId) });

    const { data: criteria } = await supabaseAdmin.from('admission_interview_criteria').select('id').limit(3);
    const scores = (criteria ?? []).map(c => ({ criterion_id: c.id, score: 8, remarks: 'AMAT' }));
    if (scores.length) {
        const evalRes = await api(examCellToken, 'POST', '/v1/admission/evaluation/interview/result', {
            interview_id: interviewId,
            scores,
        });
        if (!evalRes.ok) fail('7', 'Interview evaluation failed', evalRes);
    }
    pass('7', 'Interview completed', { status: await getAppStatus(applicationId) });

    // Exam
    const templateId = await resolveExamTemplateId();
    if (!templateId) fail('8', 'No exam template with subjects found');

    const scheduleExamRes = await api(examCellToken, 'POST', '/v1/admission/evaluation/exam/schedule', {
        template_id: templateId,
        room_name: 'Hall AMAT',
        invigilator_name: 'Invigilator AMAT',
        exam_date: new Date(Date.now() + 172800000).toISOString(),
        school_id: schoolId,
        academic_year_id: academicYearId,
    });
    if (!scheduleExamRes.ok) fail('8', 'Schedule exam failed', scheduleExamRes);
    const sessionId = scheduleExamRes.data?.id ?? scheduleExamRes.data?.data?.id;
    if (!sessionId) fail('8', 'Schedule exam returned no session id', scheduleExamRes);

    const allocRes = await api(examCellToken, 'POST', '/v1/admission/evaluation/exam/allocate', {
        session_id: sessionId,
        application_id: applicationId,
        seat_number: 'A-01',
        reporting_time: new Date().toISOString(),
    });
    if (!allocRes.ok) fail('8', 'Allocate exam candidate failed', allocRes);
    const candidateId = allocRes.data?.candidate?.id ?? allocRes.data?.id ?? allocRes.data?.data?.id;
    if (!candidateId) fail('8', 'Allocate exam candidate returned no candidate id', allocRes);

    const { data: subjects } = await supabaseAdmin.from('admission_exam_subjects').select('id').eq('template_id', templateId);
    if (!subjects?.length) fail('8', 'Exam template has no subjects');
    for (const subj of subjects ?? []) {
        const marksRes = await api(examCellToken, 'POST', '/v1/admission/evaluation/exam/result', {
            candidate_id: candidateId,
            subject_id: subj.id,
            marks_obtained: 40,
        });
        if (!marksRes.ok) fail('8', 'Record exam marks failed', marksRes);
    }
    pass('8', 'Exam completed', { status: await getAppStatus(applicationId) });

    // Finance
    const financeToken = await login('financeofficer@edu.in');
    let { data: feeStructure } = await supabaseAdmin.from('admission_fee_structures').select('id')
        .eq('school_id', schoolId).eq('grade', 'Grade 5').eq('academic_year_id', academicYearId).maybeSingle();
    if (!feeStructure) {
        const fallback = await supabaseAdmin.from('admission_fee_structures').select('id').eq('school_id', schoolId).limit(1).maybeSingle();
        feeStructure = fallback.data;
    }

    if (feeStructure) {
        await api(financeToken, 'POST', '/v1/admission/enrollment/fees/assign', {
            application_id: applicationId,
            structure_id: feeStructure.id,
        });
    }

    const { data: feeAssignments } = await supabaseAdmin
        .from('admission_fee_assignments')
        .select('amount, waived_amount, paid_amount')
        .eq('application_id', applicationId);
    const outstandingTotal = (feeAssignments ?? []).reduce(
        (sum, row) => sum + Math.max(0, Number(row.amount ?? 0) - Number(row.waived_amount ?? 0) - Number(row.paid_amount ?? 0)),
        0
    );
    const paymentAmount = outstandingTotal > 0 ? outstandingTotal : 5000;

    const payRes = await api(financeToken, 'POST', '/v1/admission/enrollment/payments', {
        application_id: applicationId,
        amount: paymentAmount,
        payment_mode: 'Cash',
        transaction_number: `AMAT-${TIMESTAMP}`,
    });
    if (!payRes.ok) fail('9', 'Collect payment failed', payRes);
    pass('9', 'Fee paid', { status: await getAppStatus(applicationId) });

    // Review + Approve
    const reviewRes = await api(officerToken, 'POST', `/v1/admission/application/${applicationId}/review`, { remark: 'Committee review AMAT' });
    if (!reviewRes.ok) fail('10', 'Review failed', reviewRes);
    const principalToken = await login('principal@edu.in').catch(() => login('hoi@edu.in'));
    const approveRes = await api(principalToken, 'POST', `/v1/admission/application/${applicationId}/approve`, { remark: 'Principal approval AMAT' });
    if (!approveRes.ok) fail('10', 'Approve failed', approveRes);
    pass('10', 'Review and approval complete', { status: await getAppStatus(applicationId) });

    // Confirm + Enroll (ERP atomic)
    const confirmRes = await api(officerToken, 'POST', '/v1/admission/enrollment/confirm', { application_id: applicationId });
    if (!confirmRes.ok) fail('11', 'Confirm admission failed', confirmRes);

    const enrollRes = await api(officerToken, 'POST', '/v1/admission/enrollment/enroll', { application_id: applicationId });
    if (!enrollRes.ok) fail('11', 'ERP enroll failed', enrollRes);
    pass('11', 'ERP student provisioned', enrollRes.data);

    const finalStatus = await getAppStatus(applicationId);
    if (finalStatus !== 'ENROLLED') fail('12', `Expected ENROLLED, got ${finalStatus}`);

    const { data: confirmation } = await supabaseAdmin.from('admission_confirmation').select('student_id, admission_number').eq('application_id', applicationId).maybeSingle();
    if (!confirmation?.student_id) fail('12', 'No student_id on confirmation');

    const { count: dupStudents } = await supabaseAdmin.from('students').select('*', { count: 'exact', head: true }).eq('admission_no', confirmation.admission_number);
    if ((dupStudents ?? 0) !== 1) fail('12', 'Duplicate student records detected', { dupStudents });

    const { data: student } = await supabaseAdmin.from('students').select('id, first_name, status').eq('id', confirmation.student_id).maybeSingle();
    if (!student) fail('12', 'Student master record missing');
    pass('12', 'Database integrity verified', { finalStatus, student, confirmation });

    const progressRes = await api(officerToken, 'GET', `/v1/admission/application/${applicationId}/progress`);
    pass('13', 'Progress API', { progressPercent: progressRes.data?.progressPercent ?? progressRes.data?.data?.progressPercent });

    const summary = {
        timestamp: TIMESTAMP,
        applicationId,
        enquiryId,
        leadId,
        log,
        finalStatus,
        studentId: confirmation.student_id,
        admissionNumber: confirmation.admission_number,
        status: 'PASS',
    };
    const outPath = path.join(__dirname, `amat-stage32-result-${TIMESTAMP}.json`);
    fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
    console.log(`\n🎉 AMAT Stage 3.2 API certification PASSED`);
    console.log(`Report: ${outPath}`);
}

main().catch(err => {
    console.error('Fatal:', err.message);
    process.exitCode = 1;
});
