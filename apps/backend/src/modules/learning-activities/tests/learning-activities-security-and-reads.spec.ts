import assert from 'node:assert/strict';
import http from 'node:http';
import prisma from '../../../lib/prismaClient';
import { env } from '../../../config/env';
import { app } from '../../../app';
import { NativeJwt } from '../../../auth/crypto.utils';

const GW_ORG_ID = '624efc1b-4144-43a4-90b8-552d945cbef7';
const NPS_ORG_ID = '5205f1f3-4e31-42d9-9b53-77fc84ad40df';

const TEACHER1_USER_ID = '5eab533b-7ba1-5230-b2c5-5eaea08a1b80';
const TEACHER1_FA_ID = 'a238f845-1427-528f-bae9-b149df374169';
const STUDENT1_ID = '91e7d961-b21a-473a-9b06-be56f8b97067';
const STUDENT1_USER_ID = '4cad656c-7d14-4f93-aa65-7bf74588a7e0';
const STUDENT1_PARENT_USER_ID = '647b6a00-67c5-4807-a688-8d2e61fa5138';
const UNLINKED_PARENT_USER_ID = 'd48c3a18-4300-4bd4-93c4-9f5bd48ca2b4';
const GW_ADMIN_USER_ID = '1efd57c3-76c1-4ccc-837c-03444f5342b7';
const NPS_ADMIN_USER_ID = '06ec1f07-eab2-4219-a51d-8446bcb2978a';

function signToken(userId: string, orgId: string, roles: string[]): string {
  return NativeJwt.sign({ userId, orgId, roles }, env.JWT_SECRET, 3600);
}

async function req(
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

async function main() {
  console.log(
    '=== Stage 3 Phase 4 Unblocked API, RBAC, IDOR, Validation & Trigger Probe Suite ===',
  );
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address() as any;
  const baseUrl = `http://127.0.0.1:${addr.port}/api`;

  const teacherToken = signToken(TEACHER1_USER_ID, GW_ORG_ID, ['TEACHER']);
  const studentToken = signToken(STUDENT1_USER_ID, GW_ORG_ID, ['STUDENT']);
  const parentToken = signToken(STUDENT1_PARENT_USER_ID, GW_ORG_ID, ['PARENT', 'ENROLLED_PARENT']);
  const unlinkedParentToken = signToken(UNLINKED_PARENT_USER_ID, GW_ORG_ID, [
    'PARENT',
    'ENROLLED_PARENT',
  ]);
  const gwAdminToken = signToken(GW_ADMIN_USER_ID, GW_ORG_ID, ['ADMIN', 'ORG_ADMIN']);
  const npsAdminToken = signToken(NPS_ADMIN_USER_ID, NPS_ORG_ID, ['ADMIN', 'ORG_ADMIN']);

  try {
    // 1. Auth fail-closed & Cross-role access blocked
    assert.equal(
      (await req(baseUrl, 'GET', '/v1/learning-activities/teacher/overview')).status,
      401,
    );
    assert.equal(
      (await req(baseUrl, 'GET', '/v1/learning-activities/student/overview')).status,
      401,
    );
    assert.equal(
      (await req(baseUrl, 'GET', `/v1/learning-activities/parent/children/${STUDENT1_ID}/overview`))
        .status,
      401,
    );
    assert.equal((await req(baseUrl, 'GET', '/v1/learning-activities/admin/overview')).status, 401);

    assert.equal(
      (await req(baseUrl, 'GET', '/v1/learning-activities/teacher/overview', studentToken)).status,
      403,
    );
    assert.equal(
      (await req(baseUrl, 'GET', '/v1/learning-activities/admin/overview', teacherToken)).status,
      403,
    );
    assert.equal(
      (await req(baseUrl, 'GET', '/v1/learning-activities/student/overview', parentToken)).status,
      403,
    );

    // 2. Teacher live DB read & assignment discovery
    const tOverview = await req(
      baseUrl,
      'GET',
      '/v1/learning-activities/teacher/overview',
      teacherToken,
    );
    assert.equal(tOverview.status, 200);
    const tAssign = await req(
      baseUrl,
      'GET',
      '/v1/learning-activities/teacher/assignments',
      teacherToken,
    );
    assert.equal(tAssign.status, 200);
    assert(Array.isArray(tAssign.json.data) && tAssign.json.data.length > 0);
    const tList = await req(
      baseUrl,
      'GET',
      '/v1/learning-activities/teacher/activities',
      teacherToken,
    );
    assert.equal(tList.status, 200);
    const tSubs = await req(
      baseUrl,
      'GET',
      '/v1/learning-activities/teacher/submissions',
      teacherToken,
    );
    assert.equal(tSubs.status, 200);

    // 3. Student live DB reads
    const sOverview = await req(
      baseUrl,
      'GET',
      '/v1/learning-activities/student/overview',
      studentToken,
    );
    assert.equal(sOverview.status, 200);
    const sList = await req(
      baseUrl,
      'GET',
      '/v1/learning-activities/student/activities',
      studentToken,
    );
    assert.equal(sList.status, 200);

    // 4. Parent IDOR & linked read
    const pOverview = await req(
      baseUrl,
      'GET',
      `/v1/learning-activities/parent/children/${STUDENT1_ID}/overview`,
      parentToken,
    );
    assert.equal(pOverview.status, 200);
    assert.equal(pOverview.json.data.child.student_id, STUDENT1_ID);

    const pActivities = await req(
      baseUrl,
      'GET',
      `/v1/learning-activities/parent/children/${STUDENT1_ID}/activities`,
      parentToken,
    );
    assert.equal(pActivities.status, 200);

    const pUnlinked = await req(
      baseUrl,
      'GET',
      `/v1/learning-activities/parent/children/${STUDENT1_ID}/overview`,
      unlinkedParentToken,
    );
    assert.equal(pUnlinked.status, 403);

    // 5. Admin live DB oversight & tenant isolation & close-due
    const aOverview = await req(
      baseUrl,
      'GET',
      '/v1/learning-activities/admin/overview',
      gwAdminToken,
    );
    assert.equal(aOverview.status, 200);
    const aFilters = await req(
      baseUrl,
      'GET',
      '/v1/learning-activities/admin/filters',
      gwAdminToken,
    );
    assert.equal(aFilters.status, 200);
    const aList = await req(
      baseUrl,
      'GET',
      '/v1/learning-activities/admin/activities',
      gwAdminToken,
    );
    assert.equal(aList.status, 200);
    const aCloseDue = await req(
      baseUrl,
      'POST',
      '/v1/learning-activities/admin/activities/close-due',
      gwAdminToken,
    );
    assert.equal(aCloseDue.status, 200);

    const randomUuid = '00000000-0000-4000-8000-000000000099';
    assert.equal(
      (
        await req(
          baseUrl,
          'GET',
          `/v1/learning-activities/admin/activities/${randomUuid}`,
          npsAdminToken,
        )
      ).status,
      404,
    );

    // 6. Zod & multipart validation rejections BEFORE DB write
    const badDate = await req(
      baseUrl,
      'POST',
      '/v1/learning-activities/teacher/activities',
      teacherToken,
      {
        faculty_assignment_id: TEACHER1_FA_ID,
        activity_type: 'project',
        title: 'Invalid dates',
        instructions: 'Due date is in past relative to assigned_at',
        assigned_at: '2026-12-01T10:00:00.000Z',
        due_at: '2026-11-01T10:00:00.000Z',
        grading_enabled: true,
        maximum_marks: 10,
      },
    );
    assert.equal(badDate.status, 400);

    const badGrading = await req(
      baseUrl,
      'POST',
      '/v1/learning-activities/teacher/activities',
      teacherToken,
      {
        faculty_assignment_id: TEACHER1_FA_ID,
        activity_type: 'project',
        title: 'Missing max marks',
        instructions: 'Grading enabled without maximum_marks',
        due_at: new Date(Date.now() + 86400000).toISOString(),
        grading_enabled: true,
      },
    );
    assert.equal(badGrading.status, 400);

    const badUuid = await req(
      baseUrl,
      'GET',
      '/v1/learning-activities/teacher/activities/not-a-uuid',
      teacherToken,
    );
    assert.equal(badUuid.status, 400);

    // 7. Live PG Trigger Probe: verify exact frozen DB s32_validate_activity() blocker surface
    const triggerProbe = await req(
      baseUrl,
      'POST',
      '/v1/learning-activities/teacher/activities',
      teacherToken,
      {
        faculty_assignment_id: TEACHER1_FA_ID,
        activity_type: 'homework',
        title: 'Frozen DB Trigger Probe',
        instructions: 'Testing PG trigger s32_validate_activity()',
        due_at: new Date(Date.now() + 86400000).toISOString(),
        grading_enabled: false,
      },
    );
    assert.equal(triggerProbe.status, 503);
    assert.equal(triggerProbe.json.error, 'DATABASE_TRIGGER_DEFECT');
    assert(String(triggerProbe.json.message).includes('s32_validate_activity'));

    console.log(
      'PASS: Unblocked Auth, RBAC, IDOR, Zod Validation, Read Endpoints & Trigger-Defect Reporting (503 DATABASE_TRIGGER_DEFECT) verified!',
    );
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Security & Read suite failed:', err);
  process.exit(1);
});
