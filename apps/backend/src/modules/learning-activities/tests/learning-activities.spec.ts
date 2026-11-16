import assert from 'node:assert/strict';
import http from 'node:http';
import WebSocket from 'ws';
import prisma from '../../../lib/prismaClient';
import { env } from '../../../config/env';
import { app } from '../../../app';
import { NativeJwt } from '../../../auth/crypto.utils';
import { StorageService } from '../../../services/storage.service';
import { realtimeNotificationServer } from '../../notifications/realtime/notification.realtime';
import { NotificationService } from '../../notifications/services/notification.service';

const GW_ORG_ID = '624efc1b-4144-43a4-90b8-552d945cbef7';
const NPS_ORG_ID = '5205f1f3-4e31-42d9-9b53-77fc84ad40df';

const TEACHER1_USER_ID = '5eab533b-7ba1-5230-b2c5-5eaea08a1b80'; // tch001@greenwood.internal
const TEACHER1_FA_ID = 'a238f845-1427-528f-bae9-b149df374169';

const TEACHER2_USER_ID = '19ed4cab-3b11-5290-9bc8-cd768397d41d'; // tch006@greenwood.internal

const STUDENT1_ID = '91e7d961-b21a-473a-9b06-be56f8b97067';
const STUDENT1_USER_ID = '4cad656c-7d14-4f93-aa65-7bf74588a7e0';
const STUDENT1_PARENT_USER_ID = '647b6a00-67c5-4807-a688-8d2e61fa5138';

const STUDENT2_USER_ID = 'ac90c53a-1ec1-4cf4-90d0-ca5ec7b66b1b';
const UNLINKED_PARENT_USER_ID = 'd48c3a18-4300-4bd4-93c4-9f5bd48ca2b4';

const GW_ADMIN_USER_ID = '1efd57c3-76c1-4ccc-837c-03444f5342b7';
const NPS_ADMIN_USER_ID = '06ec1f07-eab2-4219-a51d-8446bcb2978a';

// Valid minimal magic-byte file buffers
const VALID_PDF_BUFFER = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n');
const VALID_PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89,
]);

function signToken(userId: string, orgId: string, roles: string[]): string {
  return NativeJwt.sign({ userId, orgId, roles }, env.JWT_SECRET, 3600);
}

async function apiRequest(
  baseUrl: string,
  method: string,
  path: string,
  token?: string,
  body?: unknown,
): Promise<{ status: number; json: any }> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

async function multipartSubmit(
  baseUrl: string,
  path: string,
  token: string,
  fields: Record<string, string>,
  files: Array<{ name: string; mimeType: string; buffer: Buffer }>,
): Promise<{ status: number; json: any }> {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    form.append(k, v);
  }
  for (const f of files) {
    const blob = new Blob([new Uint8Array(f.buffer)], { type: f.mimeType });
    form.append('files', blob, f.name);
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

async function connectWs(
  wsBaseUrl: string,
  token: string,
): Promise<{ ws: WebSocket; events: any[] }> {
  return new Promise((resolve, reject) => {
    const events: any[] = [];
    const ws = new WebSocket(`${wsBaseUrl}/ws/notifications?token=${encodeURIComponent(token)}`);
    const timer = setTimeout(() => reject(new Error('WS handshake timeout')), 5000);
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        events.push(msg);
        if (msg.type === 'connection.ack') {
          clearTimeout(timer);
          resolve({ ws, events });
        }
      } catch {
        // ignore
      }
    });
    ws.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

async function waitForWsEvent(
  events: any[],
  predicate: (e: any) => boolean,
  timeoutMs = 5000,
): Promise<any> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const match = events.find(predicate);
    if (match) return match;
    await new Promise((r) => setTimeout(r, 80));
  }
  throw new Error(`Timed out waiting for matching WS event. Seen: ${JSON.stringify(events)}`);
}

async function main() {
  console.log('=== Stage 3 Phase 4 Learning Activities & Submissions Integration Suite ===');
  const startedAt = new Date();
  const uploadedStorageKeys: Array<{ bucket: string; path: string }> = [];

  const server = http.createServer(app);
  realtimeNotificationServer.init(server);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}/api`;
  const wsBaseUrl = `ws://127.0.0.1:${address.port}`;

  const teacher1Token = signToken(TEACHER1_USER_ID, GW_ORG_ID, ['TEACHER']);
  const teacher2Token = signToken(TEACHER2_USER_ID, GW_ORG_ID, ['TEACHER']);
  const student1Token = signToken(STUDENT1_USER_ID, GW_ORG_ID, ['STUDENT']);
  const student2Token = signToken(STUDENT2_USER_ID, GW_ORG_ID, ['STUDENT']);
  const parent1Token = signToken(STUDENT1_PARENT_USER_ID, GW_ORG_ID, ['PARENT', 'ENROLLED_PARENT']);
  const unlinkedParentToken = signToken(UNLINKED_PARENT_USER_ID, GW_ORG_ID, [
    'PARENT',
    'ENROLLED_PARENT',
  ]);
  const gwAdminToken = signToken(GW_ADMIN_USER_ID, GW_ORG_ID, ['ADMIN', 'ORG_ADMIN']);
  const npsAdminToken = signToken(NPS_ADMIN_USER_ID, NPS_ORG_ID, ['ADMIN', 'ORG_ADMIN']);

  const runSuffix = `${Date.now()}`;
  let teacherWs: WebSocket | null = null;
  let studentWs: WebSocket | null = null;
  let parentWs: WebSocket | null = null;
  const createdFileIds: string[] = [];

  try {
    // Connect WebSocket listeners for Teacher 1, Student 1, and Linked Parent 1
    const tWs = await connectWs(wsBaseUrl, teacher1Token);
    teacherWs = tWs.ws;
    const sWs = await connectWs(wsBaseUrl, student1Token);
    studentWs = sWs.ws;
    const pWs = await connectWs(wsBaseUrl, parent1Token);
    parentWs = pWs.ws;

    // 1. Auth & Teacher Assignments discovery
    console.log('1. Testing auth fail-closed & teacher assignment discovery...');
    const unauth = await apiRequest(baseUrl, 'GET', '/v1/learning-activities/teacher/overview');
    assert.equal(unauth.status, 401);
    const crossRole = await apiRequest(
      baseUrl,
      'GET',
      '/v1/learning-activities/teacher/activities',
      student1Token,
    );
    assert.equal(crossRole.status, 403);

    const assignRes = await apiRequest(
      baseUrl,
      'GET',
      '/v1/learning-activities/teacher/assignments',
      teacher1Token,
    );
    assert.equal(assignRes.status, 200);
    assert(Array.isArray(assignRes.json.data) && assignRes.json.data.length > 0);
    const targetFa =
      assignRes.json.data.find((a: any) => a.faculty_assignment_id === TEACHER1_FA_ID) ||
      assignRes.json.data[0];

    // 2. Homework Creation + Offline-Only Guard
    console.log('2. Testing Homework creation, audit, publish, and offline-only guard...');
    const futureDue = new Date(Date.now() + 72 * 3600 * 1000).toISOString();
    const hwCreate = await apiRequest(
      baseUrl,
      'POST',
      '/v1/learning-activities/teacher/activities',
      teacher1Token,
      {
        faculty_assignment_id: targetFa.faculty_assignment_id,
        activity_type: 'homework',
        title: `[E2E-S3P4] Algebra Practice ${runSuffix}`,
        instructions: 'Solve exercises 1 to 10 in your math notebook.',
        due_at: futureDue,
        grading_enabled: false,
        publish_immediately: false,
      },
    );
    assert.equal(hwCreate.status, 201, `Homework create failed: ${JSON.stringify(hwCreate.json)}`);
    const homeworkId = hwCreate.json.data.activity_id;
    assert.equal(hwCreate.json.data.activity_status, 'draft');

    // Draft invisible to student
    const draftInvisible = await apiRequest(
      baseUrl,
      'GET',
      `/v1/learning-activities/student/activities/${homeworkId}`,
      student1Token,
    );
    assert.equal(draftInvisible.status, 403);

    // Publish homework
    const hwPub = await apiRequest(
      baseUrl,
      'POST',
      `/v1/learning-activities/teacher/activities/${homeworkId}/publish`,
      teacher1Token,
    );
    assert.equal(hwPub.status, 200);
    assert.equal(hwPub.json.data.activity_status, 'published');

    // Audit trail check (trigger populated created + updated)
    const auditRes = await apiRequest(
      baseUrl,
      'GET',
      `/v1/learning-activities/teacher/activities/${homeworkId}/audit`,
      teacher1Token,
    );
    assert.equal(auditRes.status, 200);
    assert(auditRes.json.data.length >= 2);

    // Homework MUST reject digital submissions
    const hwSubmitBlocked = await multipartSubmit(
      baseUrl,
      `/v1/learning-activities/student/activities/${homeworkId}/submit`,
      student1Token,
      { text_content: 'Trying digital homework submit' },
      [],
    );
    assert.equal(hwSubmitBlocked.status, 400);

    // 3. Project Creation + Publish + WS Delivery + Negative Upload Validations
    console.log('3. Testing Project lifecycle, WS events, and upload/content guards...');
    const projCreate = await apiRequest(
      baseUrl,
      'POST',
      '/v1/learning-activities/teacher/activities',
      teacher1Token,
      {
        faculty_assignment_id: targetFa.faculty_assignment_id,
        lesson_plan_id: targetFa.lesson_plans?.[0]?.lesson_plan_id || null,
        activity_type: 'project',
        title: `[E2E-S3P4] Renewable Energy Model ${runSuffix}`,
        instructions: 'Submit a concise project report PDF or diagram.',
        due_at: futureDue,
        grading_enabled: true,
        maximum_marks: 50,
        publish_immediately: true,
      },
    );
    assert.equal(projCreate.status, 201);
    const projectId = projCreate.json.data.activity_id;

    // Wait for Student & Parent WS published events (redacted payload check)
    const stuPubEvt = await waitForWsEvent(
      sWs.events,
      (e) => e.type === 'learning_activity.published' && e.data?.activity_id === projectId,
    );
    const parPubEvt = await waitForWsEvent(
      pWs.events,
      (e) => e.type === 'learning_activity.published' && e.data?.activity_id === projectId,
    );
    assert(!('storage_path' in (stuPubEvt.data || {})), 'WS event must never contain storage_path');
    assert(!('storage_path' in (parPubEvt.data || {})), 'WS event must never contain storage_path');

    // Empty submission rejected
    const emptySub = await multipartSubmit(
      baseUrl,
      `/v1/learning-activities/student/activities/${projectId}/submit`,
      student1Token,
      { text_content: '   ' },
      [],
    );
    assert.equal(emptySub.status, 400);

    // Spoofed/corrupted file magic bytes rejected
    const spoofedFile = await multipartSubmit(
      baseUrl,
      `/v1/learning-activities/student/activities/${projectId}/submit`,
      student1Token,
      { text_content: 'Spoofed file test' },
      [{ name: 'fake.pdf', mimeType: 'application/pdf', buffer: Buffer.from('NOT_A_PDF') }],
    );
    assert.equal(spoofedFile.status, 400);

    // > 5 files rejected
    const sixFiles = Array.from({ length: 6 }, (_, idx) => ({
      name: `doc-${idx + 1}.pdf`,
      mimeType: 'application/pdf',
      buffer: VALID_PDF_BUFFER,
    }));
    const tooManyFiles = await multipartSubmit(
      baseUrl,
      `/v1/learning-activities/student/activities/${projectId}/submit`,
      student1Token,
      { text_content: 'Six files test' },
      sixFiles,
    );
    assert.equal(tooManyFiles.status, 400);

    // 4. Valid Attempt 1 Project Submission + Review Workflow + Sequential Attempt Gate
    console.log(
      '4. Testing valid PDF submission (Attempt 1), downloads, and teacher evaluation...',
    );
    const attempt1Res = await multipartSubmit(
      baseUrl,
      `/v1/learning-activities/student/activities/${projectId}/submit`,
      student1Token,
      { text_content: 'Initial wind turbine prototype write-up.' },
      [{ name: 'solar-wind-report.pdf', mimeType: 'application/pdf', buffer: VALID_PDF_BUFFER }],
    );
    assert.equal(attempt1Res.status, 201, `Attempt 1 failed: ${JSON.stringify(attempt1Res.json)}`);
    const sub1 = attempt1Res.json.data;
    assert.equal(sub1.attempt_number, 1);
    assert.equal(sub1.submission_status, 'submitted');
    assert.equal(sub1.files.length, 1);
    const file1Id = sub1.files[0].submission_file_id;
    createdFileIds.push(file1Id);

    // Teacher receives WS submission created notification
    await waitForWsEvent(
      tWs.events,
      (e) =>
        e.type === 'learning_submission.created' && e.data?.submission_id === sub1.submission_id,
    );

    // Attempt 2 blocked until teacher requests resubmission!
    const blockedAttempt2 = await multipartSubmit(
      baseUrl,
      `/v1/learning-activities/student/activities/${projectId}/submit`,
      student1Token,
      { text_content: 'Trying second attempt prematurely' },
      [],
    );
    assert.equal(blockedAttempt2.status, 409);

    // Non-owner Teacher 2 blocked from viewing/reviewing Teacher 1's activity/submission
    const t2EditBlocked = await apiRequest(
      baseUrl,
      'PATCH',
      `/v1/learning-activities/teacher/activities/${projectId}`,
      teacher2Token,
      { title: 'Hijack Attempt' },
    );
    assert.equal(t2EditBlocked.status, 403);

    const t2ReviewBlocked = await apiRequest(
      baseUrl,
      'POST',
      `/v1/learning-activities/teacher/submissions/${sub1.submission_id}/reviews`,
      teacher2Token,
      { review_decision: 'reviewed', obtained_marks: 10 },
    );
    assert.equal(t2ReviewBlocked.status, 403);

    // Start review -> under_review
    const startRevRes = await apiRequest(
      baseUrl,
      'POST',
      `/v1/learning-activities/teacher/submissions/${sub1.submission_id}/start-review`,
      teacher1Token,
    );
    assert.equal(startRevRes.status, 200);
    assert.equal(startRevRes.json.data.submission_status, 'under_review');

    // Out-of-bounds marks rejected (> 50)
    const badMarksRes = await apiRequest(
      baseUrl,
      'POST',
      `/v1/learning-activities/teacher/submissions/${sub1.submission_id}/reviews`,
      teacher1Token,
      { review_decision: 'reviewed', obtained_marks: 75 },
    );
    assert.equal(badMarksRes.status, 400);

    // Teacher requests resubmission with future deadline
    const resubmitUntil = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
    const reqResubmitRes = await apiRequest(
      baseUrl,
      'POST',
      `/v1/learning-activities/teacher/submissions/${sub1.submission_id}/reviews`,
      teacher1Token,
      {
        review_decision: 'resubmission_requested',
        feedback: 'Please include efficiency calculations diagram in Attempt 2.',
        resubmission_allowed_until: resubmitUntil,
      },
    );
    assert.equal(reqResubmitRes.status, 201);
    assert.equal(reqResubmitRes.json.data.submission_status, 'resubmission_requested');

    await waitForWsEvent(
      sWs.events,
      (e) =>
        e.type === 'learning_submission.resubmission_requested' &&
        e.data?.submission_id === sub1.submission_id,
    );
    await waitForWsEvent(
      pWs.events,
      (e) =>
        e.type === 'learning_submission.resubmission_requested' &&
        e.data?.submission_id === sub1.submission_id,
    );

    // 5. Resubmission (Attempt 2) + Final Grading Evaluation + File Downloads
    console.log('5. Testing Resubmission Attempt 2, Final Grading, & Authorized File Downloads...');
    const attempt2Res = await multipartSubmit(
      baseUrl,
      `/v1/learning-activities/student/activities/${projectId}/submit`,
      student1Token,
      { text_content: 'Added energy conversion diagram and full efficiency table.' },
      [{ name: 'turbine-diagram.png', mimeType: 'image/png', buffer: VALID_PNG_BUFFER }],
    );
    assert.equal(attempt2Res.status, 201);
    const sub2 = attempt2Res.json.data;
    assert.equal(sub2.attempt_number, 2);
    const file2Id = sub2.files[0].submission_file_id;
    createdFileIds.push(file2Id);

    const finalReviewRes = await apiRequest(
      baseUrl,
      'POST',
      `/v1/learning-activities/teacher/submissions/${sub2.submission_id}/reviews`,
      teacher1Token,
      {
        review_decision: 'reviewed',
        obtained_marks: 46,
        feedback: 'Excellent improvement and clear diagram!',
      },
    );
    assert.equal(finalReviewRes.status, 201);
    assert.equal(finalReviewRes.json.data.submission_status, 'reviewed');
    assert.equal(finalReviewRes.json.data.latest_review.obtained_marks, 46);

    await waitForWsEvent(
      pWs.events,
      (e) =>
        e.type === 'learning_submission.reviewed' &&
        e.data?.submission_id === sub2.submission_id &&
        e.data?.obtained_marks === 46,
    );

    // Download authorization checks
    const teacherDl = await apiRequest(
      baseUrl,
      'GET',
      `/v1/learning-activities/teacher/files/${file1Id}/download`,
      teacher1Token,
    );
    assert.equal(teacherDl.status, 200);
    assert(teacherDl.json.data.download_url);

    const parentDl = await apiRequest(
      baseUrl,
      'GET',
      `/v1/learning-activities/parent/children/${STUDENT1_ID}/files/${file2Id}/download`,
      parent1Token,
    );
    assert.equal(parentDl.status, 200);
    assert(parentDl.json.data.download_url);

    // Cross-student & unlinked-parent IDOR blocked!
    const otherStudentDl = await apiRequest(
      baseUrl,
      'GET',
      `/v1/learning-activities/student/files/${file1Id}/download`,
      student2Token,
    );
    assert.equal(otherStudentDl.status, 403);

    const unlinkedParentOverview = await apiRequest(
      baseUrl,
      'GET',
      `/v1/learning-activities/parent/children/${STUDENT1_ID}/overview`,
      unlinkedParentToken,
    );
    assert.equal(unlinkedParentOverview.status, 403);

    // Parent can view child's marks & feedback read-only
    const parentDetail = await apiRequest(
      baseUrl,
      'GET',
      `/v1/learning-activities/parent/children/${STUDENT1_ID}/activities/${projectId}`,
      parent1Token,
    );
    assert.equal(parentDetail.status, 200);
    assert.equal(parentDetail.json.data.activity.can_submit, false);
    assert.equal(parentDetail.json.data.attempts[0].latest_review.obtained_marks, 46);

    // 6. Admin Institutional Oversight + Cross-Tenant Isolation
    console.log('6. Testing Admin Oversight & Cross-Tenant Isolation...');
    const gwAdminOverview = await apiRequest(
      baseUrl,
      'GET',
      '/v1/learning-activities/admin/overview',
      gwAdminToken,
    );
    assert.equal(gwAdminOverview.status, 200);
    assert(gwAdminOverview.json.data.total_activities >= 2);

    const npsCrossTenant = await apiRequest(
      baseUrl,
      'GET',
      `/v1/learning-activities/admin/activities/${projectId}`,
      npsAdminToken,
    );
    assert.equal(npsCrossTenant.status, 404);

    // 7. Notification Resilience Test (NotificationService throws -> publish succeeds!)
    console.log('7. Testing non-blocking notification failure resilience...');
    const secondDraft = await apiRequest(
      baseUrl,
      'POST',
      '/v1/learning-activities/teacher/activities',
      teacher1Token,
      {
        faculty_assignment_id: targetFa.faculty_assignment_id,
        activity_type: 'homework',
        title: `[E2E-S3P4] Resilience Check ${runSuffix}`,
        instructions: 'Read Chapter 4.',
        due_at: futureDue,
        grading_enabled: false,
        publish_immediately: false,
      },
    );
    assert.equal(secondDraft.status, 201);
    const resilienceId = secondDraft.json.data.activity_id;

    const origSendBulk = NotificationService.sendBulkNotifications;
    NotificationService.sendBulkNotifications = async () => {
      throw new Error('Simulated Notification Service outage');
    };
    try {
      const pubResilient = await apiRequest(
        baseUrl,
        'POST',
        `/v1/learning-activities/teacher/activities/${resilienceId}/publish`,
        teacher1Token,
      );
      assert.equal(pubResilient.status, 200);
      assert.equal(pubResilient.json.data.activity_status, 'published');
    } finally {
      NotificationService.sendBulkNotifications = origSendBulk;
    }

    // 8. Verify Notifications DB rows were created for real flows
    const notifCount = await prisma.notifications.count({
      where: {
        org_id: GW_ORG_ID,
        type: {
          in: [
            'learning_activity.published',
            'learning_submission.created',
            'learning_submission.resubmission_requested',
            'learning_submission.reviewed',
          ],
        },
        created_at: { gte: startedAt },
      },
    });
    assert(notifCount >= 4, `Expected >= 4 persisted notifications, got ${notifCount}`);

    // Lookup storage paths of uploaded test objects so we can clean them up cleanly
    if (createdFileIds.length > 0) {
      const fileRows = await prisma.$queryRaw<
        Array<{ storage_bucket: string; storage_path: string }>
      >`
        SELECT storage_bucket, storage_path
        FROM public.learning_activity_submission_files
        WHERE submission_file_id = ANY(${createdFileIds}::uuid[])
      `;
      uploadedStorageKeys.push(
        ...fileRows.map((r) => ({ bucket: r.storage_bucket, path: r.storage_path })),
      );
    }

    console.log(
      '\nPASS: All 8 Stage 3 Phase 4 Learning Activities integration scenarios succeeded!',
    );
  } finally {
    try {
      teacherWs?.close();
      studentWs?.close();
      parentWs?.close();
    } catch {}
    for (const obj of uploadedStorageKeys) {
      await StorageService.deleteFile(obj.path, obj.bucket).catch(() => {});
    }
    realtimeNotificationServer.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Stage 3 Phase 4 Learning Activities integration test failed:', err);
  process.exit(1);
});
