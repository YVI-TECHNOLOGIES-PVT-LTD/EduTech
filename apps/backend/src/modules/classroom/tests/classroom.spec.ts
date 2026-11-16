import assert from 'node:assert/strict';
import http from 'node:http';
import WebSocket from 'ws';
import prisma from '../../../lib/prismaClient';
import { env } from '../../../config/env';
import { app } from '../../../app';
import { NativeJwt } from '../../../auth/crypto.utils';
import { realtimeNotificationServer } from '../../notifications/realtime/notification.realtime';
import { NotificationService } from '../../notifications/services/notification.service';

const GW_ORG_ID = '624efc1b-4144-43a4-90b8-552d945cbef7';
const NPS_ORG_ID = '5205f1f3-4e31-42d9-9b53-77fc84ad40df';
const ACTIVE_AY_ID = 'b2259d01-c883-4934-89f1-04bd90acc5f5';
const CLASSROOM_ID = '300ade4f-c0bc-5f22-9172-2535286e07a4';

// Section 1-A linked fixtures (verified in Greenwood School)
const TEACHER1_USER_ID = '5eab533b-7ba1-5230-b2c5-5eaea08a1b80'; // tch001@greenwood.internal
const TEACHER1_STAFF_ID = 'e085e865-2393-507c-bbc7-e0ade550bbd5';
const TEACHER1_FA_ID = 'a238f845-1427-528f-bae9-b149df374169';

const TEACHER2_USER_ID = '19ed4cab-3b11-5290-9bc8-cd768397d41d'; // tch006@greenwood.internal
const TEACHER2_FA_ID = 'bc0472a3-98e2-54c9-bd1d-3034d08e3b86';

const STUDENT1_ID = '91e7d961-b21a-473a-9b06-be56f8b97067';
const STUDENT1_USER_ID = '4cad656c-7d14-4f93-aa65-7bf74588a7e0';
const STUDENT1_PARENT_ID = '5df0677d-0151-4870-b874-7a5236950a61';
const STUDENT1_PARENT_USER_ID = '647b6a00-67c5-4807-a688-8d2e61fa5138';

// Other-section student & unlinked parent in Greenwood School
const STUDENT2_ID = '02546327-1046-43db-80fb-2305b8df8c6c';
const STUDENT2_USER_ID = 'ac90c53a-1ec1-4cf4-90d0-ca5ec7b66b1b';
const UNLINKED_PARENT_USER_ID = 'd48c3a18-4300-4bd4-93c4-9f5bd48ca2b4';

// Admins (Greenwood & NPS cross-tenant)
const GW_ADMIN_USER_ID = '1efd57c3-76c1-4ccc-837c-03444f5342b7';
const NPS_ADMIN_USER_ID = '06ec1f07-eab2-4219-a51d-8446bcb2978a';

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

async function connectWs(
  wsBaseUrl: string,
  token: string,
): Promise<{
  ws: WebSocket;
  events: any[];
}> {
  return new Promise((resolve, reject) => {
    const events: any[] = [];
    const ws = new WebSocket(`${wsBaseUrl}/ws/notifications?token=${encodeURIComponent(token)}`);
    const timer = setTimeout(() => {
      reject(new Error('Timed out waiting for WebSocket connection.ack'));
    }, 5000);

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        events.push(msg);
        if (msg.type === 'connection.ack') {
          clearTimeout(timer);
          resolve({ ws, events });
        }
      } catch {
        // ignore non-json
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
  predicate: (ev: any) => boolean,
  timeoutMs = 3000,
): Promise<any | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const match = events.find(predicate);
    if (match) return match;
    await new Promise((r) => setTimeout(r, 50));
  }
  return null;
}

async function runTests() {
  const server = http.createServer(app);
  realtimeNotificationServer.init(server);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const addr = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${addr.port}/api/v1/classroom`;
  const wsBaseUrl = `ws://127.0.0.1:${addr.port}`;

  const createdSessionIds: string[] = [];
  const createdLessonPlanIds: string[] = [];
  const genStart = '2027-01-11';
  const genEnd = '2027-01-12';
  const testRunStart = new Date();
  let wsStudent1: WebSocket | null = null;
  let wsStudent2: WebSocket | null = null;
  const originalSendBulk = NotificationService.sendBulkNotifications;

  try {
    const teacher1Token = signToken(TEACHER1_USER_ID, GW_ORG_ID, ['TEACHER']);
    const teacher2Token = signToken(TEACHER2_USER_ID, GW_ORG_ID, ['TEACHER']);
    const gwAdminToken = signToken(GW_ADMIN_USER_ID, GW_ORG_ID, ['PRINCIPAL']);
    const npsAdminToken = signToken(NPS_ADMIN_USER_ID, NPS_ORG_ID, ['PRINCIPAL']);
    const student1Token = signToken(STUDENT1_USER_ID, GW_ORG_ID, ['STUDENT']);
    const student2Token = signToken(STUDENT2_USER_ID, GW_ORG_ID, ['STUDENT']);
    const parent1Token = signToken(STUDENT1_PARENT_USER_ID, GW_ORG_ID, ['PARENT']);
    const unlinkedParentToken = signToken(UNLINKED_PARENT_USER_ID, GW_ORG_ID, ['PARENT']);

    // Ensure clean state on test window in case a prior aborted run left anything behind
    await prisma.$executeRawUnsafe(
      `DELETE FROM classroom_sessions
       WHERE org_id = $1::uuid AND session_date BETWEEN '2026-12-20'::date AND '2027-01-15'::date`,
      GW_ORG_ID,
    );

    let passed = 0;
    const pass = (label: string) => {
      passed += 1;
      console.log(`  ✓ ${passed}. ${label}`);
    };

    // 1. Auth & Role Boundary Matrix
    {
      const unauth = await apiRequest(baseUrl, 'GET', '/teacher/overview');
      assert.equal(unauth.status, 401);

      const parentOnStudentJoin = await apiRequest(
        baseUrl,
        'POST',
        `/student/sessions/${TEACHER1_FA_ID}/join`,
        parent1Token,
      );
      assert.equal(parentOnStudentJoin.status, 403);

      const studentOnTeacher = await apiRequest(baseUrl, 'GET', '/teacher/overview', student1Token);
      assert.equal(studentOnTeacher.status, 403);

      const teacherOnAdmin = await apiRequest(
        baseUrl,
        'GET',
        '/admin/academic-years',
        teacher1Token,
      );
      assert.equal(teacherOnAdmin.status, 403);
      pass('Authentication & strict RBAC role separation return 401/403');
    }

    // 2. Teacher Overview & Active Classes
    {
      const ov = await apiRequest(baseUrl, 'GET', '/teacher/overview', teacher1Token);
      assert.equal(ov.status, 200);
      assert.ok(ov.json?.data?.kpis?.assigned_classes_count >= 1);

      const cls = await apiRequest(baseUrl, 'GET', '/teacher/classes', teacher1Token);
      assert.equal(cls.status, 200);
      const hasFa = (cls.json?.data || []).some(
        (c: any) => c.faculty_assignment_id === TEACHER1_FA_ID,
      );
      assert.ok(hasFa, 'Teacher 1 active faculty assignments should be returned');
      pass('Teacher overview and assigned classes reflect published faculty assignments');
    }

    // 3. Zod Validation & Delivery Mode Mutual Rules
    {
      const badTime = await apiRequest(baseUrl, 'POST', '/teacher/sessions', teacher1Token, {
        faculty_assignment_id: TEACHER1_FA_ID,
        session_date: '2026-12-22',
        scheduled_start_time: '11:00',
        scheduled_end_time: '10:00',
        delivery_mode: 'online',
        meeting_url: 'https://meet.example.com/room-1',
      });
      assert.equal(badTime.status, 400);

      const badUrl = await apiRequest(baseUrl, 'POST', '/teacher/sessions', teacher1Token, {
        faculty_assignment_id: TEACHER1_FA_ID,
        session_date: '2026-12-22',
        scheduled_start_time: '10:00',
        scheduled_end_time: '11:00',
        delivery_mode: 'online',
        meeting_url: 'javascript:alert(1)',
      });
      assert.equal(badUrl.status, 400);

      const onlineWithRoom = await apiRequest(baseUrl, 'POST', '/teacher/sessions', teacher1Token, {
        faculty_assignment_id: TEACHER1_FA_ID,
        session_date: '2026-12-22',
        scheduled_start_time: '10:00',
        scheduled_end_time: '11:00',
        delivery_mode: 'online',
        classroom_id: CLASSROOM_ID,
        meeting_url: 'https://meet.example.com/room-1',
      });
      assert.equal(onlineWithRoom.status, 400);

      const physicalNoRoom = await apiRequest(baseUrl, 'POST', '/teacher/sessions', teacher1Token, {
        faculty_assignment_id: TEACHER1_FA_ID,
        session_date: '2026-12-22',
        scheduled_start_time: '10:00',
        scheduled_end_time: '11:00',
        delivery_mode: 'physical',
      });
      assert.equal(physicalNoRoom.status, 400);
      pass(
        'Zod validation rejects reversed times, unsafe URLs, and invalid delivery_mode/location pairs',
      );
    }

    // 4. Create Hybrid (Flipped), Online, and Physical Sessions + Conflict Detection
    let hybridSessionId = '';
    let physicalSessionId = '';
    let scheduledSessionId = '';
    {
      const createHybrid = await apiRequest(baseUrl, 'POST', '/teacher/sessions', teacher1Token, {
        faculty_assignment_id: TEACHER1_FA_ID,
        session_date: '2026-12-23',
        scheduled_start_time: '09:00',
        scheduled_end_time: '09:45',
        delivery_mode: 'hybrid',
        teaching_approach: 'flipped',
        classroom_id: CLASSROOM_ID,
        meeting_url: 'https://meet.example.com/hybrid-23',
        topics_covered: 'Fractions Pre-Class Video Review',
      });
      assert.equal(createHybrid.status, 201, JSON.stringify(createHybrid.json));
      hybridSessionId = createHybrid.json.data.session_id;
      createdSessionIds.push(hybridSessionId);
      assert.equal(createHybrid.json.data.teaching_approach, 'flipped');
      assert.equal(createHybrid.json.data.session_status, 'scheduled');

      // Same teacher overlapping time -> 409
      const overlapTeacher = await apiRequest(baseUrl, 'POST', '/teacher/sessions', teacher1Token, {
        faculty_assignment_id: TEACHER1_FA_ID,
        session_date: '2026-12-23',
        scheduled_start_time: '09:15',
        scheduled_end_time: '10:00',
        delivery_mode: 'online',
        meeting_url: 'https://meet.example.com/overlap-teacher',
      });
      assert.equal(overlapTeacher.status, 409);

      // Different teacher (tch006) on same section overlapping time -> 409
      const overlapSection = await apiRequest(baseUrl, 'POST', '/teacher/sessions', teacher2Token, {
        faculty_assignment_id: TEACHER2_FA_ID,
        session_date: '2026-12-23',
        scheduled_start_time: '09:15',
        scheduled_end_time: '10:00',
        delivery_mode: 'online',
        meeting_url: 'https://meet.example.com/overlap-section',
      });
      assert.equal(overlapSection.status, 409);

      const createPhysical = await apiRequest(baseUrl, 'POST', '/teacher/sessions', teacher1Token, {
        faculty_assignment_id: TEACHER1_FA_ID,
        session_date: '2026-12-24',
        scheduled_start_time: '10:00',
        scheduled_end_time: '10:45',
        delivery_mode: 'physical',
        classroom_id: CLASSROOM_ID,
        topics_covered: 'Board Practice',
      });
      assert.equal(createPhysical.status, 201);
      physicalSessionId = createPhysical.json.data.session_id;
      createdSessionIds.push(physicalSessionId);

      const createScheduledOnly = await apiRequest(
        baseUrl,
        'POST',
        '/teacher/sessions',
        teacher1Token,
        {
          faculty_assignment_id: TEACHER1_FA_ID,
          session_date: '2026-12-25',
          scheduled_start_time: '11:00',
          scheduled_end_time: '11:45',
          delivery_mode: 'online',
          meeting_url: 'https://meet.example.com/sched-only',
        },
      );
      assert.equal(createScheduledOnly.status, 201);
      scheduledSessionId = createScheduledOnly.json.data.session_id;
      createdSessionIds.push(scheduledSessionId);
      pass(
        'Hybrid (flipped), physical, & online sessions created; teacher & section schedule conflicts return 409',
      );
    }

    // 5. Connect Live WebSocket Clients (Enrolled Student 1 & Unrelated Student 2)
    {
      const c1 = await connectWs(wsBaseUrl, student1Token);
      wsStudent1 = c1.ws;
      const c2 = await connectWs(wsBaseUrl, student2Token);
      wsStudent2 = c2.ws;

      // Pre-start: student 1 sees scheduled session WITHOUT meeting_url exposed
      const preList = await apiRequest(
        baseUrl,
        'GET',
        '/student/sessions?date_from=2026-12-23&date_to=2026-12-23',
        student1Token,
      );
      assert.equal(preList.status, 200);
      const targetPre = (preList.json.data.items || []).find(
        (s: any) => s.session_id === hybridSessionId,
      );
      assert.ok(targetPre);
      assert.equal(
        targetPre.meeting_url,
        null,
        'Scheduled session must hide meeting_url before live',
      );
      assert.equal(targetPre.can_join, false);

      // Attendance cannot be marked while scheduled -> 409
      const preAtt = await apiRequest(
        baseUrl,
        'PUT',
        `/teacher/sessions/${hybridSessionId}/attendance`,
        teacher1Token,
        {
          records: [
            {
              student_id: STUDENT1_ID,
              attendance_status: 'present',
              participation_mode: 'physical',
            },
          ],
        },
      );
      assert.equal(preAtt.status, 409);

      // Start Hybrid Session -> WS event to Student 1, NO WS event to Student 2
      const startRes = await apiRequest(
        baseUrl,
        'POST',
        `/teacher/sessions/${hybridSessionId}/start`,
        teacher1Token,
      );
      assert.equal(startRes.status, 200);
      assert.equal(startRes.json.data.session.session_status, 'in_progress');
      assert.equal(startRes.json.data.already_in_state, false);

      // Idempotent second start returns 200
      const startAgain = await apiRequest(
        baseUrl,
        'POST',
        `/teacher/sessions/${hybridSessionId}/start`,
        teacher1Token,
      );
      assert.equal(startAgain.status, 200);
      assert.equal(startAgain.json.data.session.session_status, 'in_progress');
      assert.equal(startAgain.json.data.already_in_state, true);

      const wsEv1 = await waitForWsEvent(
        c1.events,
        (ev) => ev.type === 'classroom.session_started' && ev.data?.session_id === hybridSessionId,
      );
      assert.ok(wsEv1, 'Enrolled Student 1 must receive classroom.session_started via WebSocket');
      assert.equal(
        wsEv1.data.meeting_url,
        undefined,
        'WebSocket broadcast payload must redact private meeting_url',
      );

      const wsEv2 = await waitForWsEvent(
        c2.events,
        (ev) => ev.type === 'classroom.session_started' && ev.data?.session_id === hybridSessionId,
        400,
      );
      assert.equal(
        wsEv2,
        null,
        'Unrelated Student 2 must NOT receive WS event for another section',
      );

      // Verify persisted notifications in DB for student & parent
      const dbNotifs = await prisma.$queryRawUnsafe<any[]>(
        `SELECT recipient_user_id, type, category::text
         FROM notifications
         WHERE entity_type = 'classroom_session'
           AND entity_id = $1::uuid
           AND type = 'classroom.session_started'`,
        hybridSessionId,
      );
      const recipients = dbNotifs.map((r: any) => r.recipient_user_id);
      assert.ok(recipients.includes(STUDENT1_USER_ID), 'Student 1 DB notification persisted');
      assert.ok(
        recipients.includes(STUDENT1_PARENT_USER_ID),
        'Linked Parent DB notification persisted',
      );
      assert.ok(!recipients.includes(STUDENT2_USER_ID), 'Unrelated Student 2 not notified');
      pass('Live WebSocket targeted delivery (redacted payload) & DB notifications verified');
    }

    // 6. Student Online Join (Idempotent), Non-Joinable Guards & Enrollment IDOR
    {
      const join1 = await apiRequest(
        baseUrl,
        'POST',
        `/student/sessions/${hybridSessionId}/join`,
        student1Token,
      );
      assert.equal(join1.status, 200, JSON.stringify(join1.json));
      assert.equal(join1.json.data.meeting_url, 'https://meet.example.com/hybrid-23');
      assert.equal(join1.json.data.already_recorded, false);
      assert.equal(join1.json.data.attendance.attendance_status, 'present');
      assert.equal(join1.json.data.attendance.participation_mode, 'online');

      // Duplicate join -> idempotent, already_recorded: true
      const join2 = await apiRequest(
        baseUrl,
        'POST',
        `/student/sessions/${hybridSessionId}/join`,
        student1Token,
      );
      assert.equal(join2.status, 200);
      assert.equal(join2.json.data.already_recorded, true);

      // Start physical session & verify student online join is blocked with 409
      await apiRequest(
        baseUrl,
        'POST',
        `/teacher/sessions/${physicalSessionId}/start`,
        teacher1Token,
      );
      const joinPhysical = await apiRequest(
        baseUrl,
        'POST',
        `/student/sessions/${physicalSessionId}/join`,
        student1Token,
      );
      assert.equal(joinPhysical.status, 409);

      // Scheduled-only session cannot be joined -> 409
      const joinScheduled = await apiRequest(
        baseUrl,
        'POST',
        `/student/sessions/${scheduledSessionId}/join`,
        student1Token,
      );
      assert.equal(joinScheduled.status, 409);

      // Student 2 (other section) cannot view or join Student 1's session -> 403
      const s2Detail = await apiRequest(
        baseUrl,
        'GET',
        `/student/sessions/${hybridSessionId}`,
        student2Token,
      );
      assert.equal(s2Detail.status, 403);
      const s2Join = await apiRequest(
        baseUrl,
        'POST',
        `/student/sessions/${hybridSessionId}/join`,
        student2Token,
      );
      assert.equal(s2Join.status, 403);
      pass(
        'Student idempotent online join, mode/status join guards, and cross-section student IDOR verified',
      );
    }

    // 7. Teacher Live Attendance Correction + PG Trigger Verification (`s31_validate_session_attendance`)
    {
      // Correct attendance while in_progress (late physical)
      const markLate = await apiRequest(
        baseUrl,
        'PUT',
        `/teacher/sessions/${hybridSessionId}/attendance`,
        teacher1Token,
        {
          records: [
            {
              student_id: STUDENT1_ID,
              attendance_status: 'late',
              participation_mode: 'physical',
              remarks: 'Arrived 5 minutes after start',
            },
          ],
        },
      );
      assert.equal(markLate.status, 200, JSON.stringify(markLate.json));
      const stuRow = (markLate.json.data.roster || []).find(
        (r: any) => r.student_id === STUDENT1_ID,
      );
      assert.equal(stuRow.attendance_status, 'late');
      assert.equal(stuRow.participation_mode, 'physical');

      // Switch to absent -> validation rejects absent+mode, accepts absent+null
      const badAbsent = await apiRequest(
        baseUrl,
        'PUT',
        `/teacher/sessions/${hybridSessionId}/attendance`,
        teacher1Token,
        {
          records: [
            {
              student_id: STUDENT1_ID,
              attendance_status: 'absent',
              participation_mode: 'online',
            },
          ],
        },
      );
      assert.equal(badAbsent.status, 400);

      // Restore present (online) before completing
      const markPresent = await apiRequest(
        baseUrl,
        'PUT',
        `/teacher/sessions/${hybridSessionId}/attendance`,
        teacher1Token,
        {
          records: [
            {
              student_id: STUDENT1_ID,
              attendance_status: 'present',
              participation_mode: 'online',
            },
          ],
        },
      );
      assert.equal(markPresent.status, 200);

      // Verify PG trigger blocks non-teacher recorded_by directly in PostgreSQL
      let triggerBlockedActor = false;
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE classroom_session_attendance
           SET recorded_by = $3::uuid
           WHERE org_id = $1::uuid AND session_id = $2::uuid AND student_id = $4::uuid`,
          GW_ORG_ID,
          hybridSessionId,
          STUDENT1_USER_ID,
          STUDENT1_ID,
        );
      } catch (err: any) {
        triggerBlockedActor = true;
      }
      assert.ok(triggerBlockedActor, 'PG trigger must block non-teacher recorded_by write');
      pass('Live attendance upsert/correction and PostgreSQL trigger enforcement verified');
    }

    // 8. Complete Session + Non-Blocking Notification Failure + Immutable Locks
    // Complete physicalSessionId (no attendance rows so teardown can delete it natively under PG triggers)
    {
      // Inject failing NotificationService.sendBulkNotifications to prove lifecycle completes anyway
      NotificationService.sendBulkNotifications = async () => {
        throw new Error('Simulated notification DB outage');
      };

      const completeRes = await apiRequest(
        baseUrl,
        'POST',
        `/teacher/sessions/${physicalSessionId}/complete`,
        teacher1Token,
        { topics_covered: 'Completed Fractions Review & Quiz' },
      );
      NotificationService.sendBulkNotifications = originalSendBulk;
      assert.equal(completeRes.status, 200, JSON.stringify(completeRes.json));
      assert.equal(completeRes.json.data.session.session_status, 'completed');

      // Idempotent second complete returns 200
      const completeAgain = await apiRequest(
        baseUrl,
        'POST',
        `/teacher/sessions/${physicalSessionId}/complete`,
        teacher1Token,
      );
      assert.equal(completeAgain.status, 200);

      // Reverse transition to in_progress blocked -> 409
      const reverseRes = await apiRequest(
        baseUrl,
        'POST',
        `/teacher/sessions/${physicalSessionId}/start`,
        teacher1Token,
      );
      assert.equal(reverseRes.status, 409);

      // Metadata edit after completion blocked -> 409
      const editAfterComplete = await apiRequest(
        baseUrl,
        'PATCH',
        `/teacher/sessions/${physicalSessionId}`,
        teacher1Token,
        { topics_covered: 'Mutated after complete' },
      );
      assert.equal(editAfterComplete.status, 409);

      // Attendance update after completion blocked -> 409
      const attAfterComplete = await apiRequest(
        baseUrl,
        'PUT',
        `/teacher/sessions/${physicalSessionId}/attendance`,
        teacher1Token,
        {
          records: [
            {
              student_id: STUDENT1_ID,
              attendance_status: 'absent',
              participation_mode: null,
            },
          ],
        },
      );
      assert.equal(attAfterComplete.status, 409);

      // Blank not_conducted reason -> 400
      const blankNotConducted = await apiRequest(
        baseUrl,
        'POST',
        `/teacher/sessions/${scheduledSessionId}/not-conducted`,
        teacher1Token,
        { not_conducted_reason: '  ' },
      );
      assert.equal(blankNotConducted.status, 400);

      const validNotConducted = await apiRequest(
        baseUrl,
        'POST',
        `/teacher/sessions/${scheduledSessionId}/not-conducted`,
        teacher1Token,
        { not_conducted_reason: 'Public Holiday Declared' },
      );
      assert.equal(validNotConducted.status, 200);
      assert.equal(validNotConducted.json.data.session.session_status, 'not_conducted');
      pass(
        'Session completion (non-blocking notifications), post-completion immutability, & not-conducted rules verified',
      );
    }

    // 9. Parent Read-Only Portal & IDOR + Cross-Teacher / Cross-Tenant Isolation
    {
      const pOv = await apiRequest(
        baseUrl,
        'GET',
        `/parent/children/${STUDENT1_ID}/overview`,
        parent1Token,
      );
      assert.equal(pOv.status, 200);

      const pSess = await apiRequest(
        baseUrl,
        'GET',
        `/parent/children/${STUDENT1_ID}/sessions`,
        parent1Token,
      );
      assert.equal(pSess.status, 200);
      for (const s of pSess.json.data.items || []) {
        assert.equal(s.meeting_url, null, 'Parent session view must ALWAYS redact meeting_url');
        assert.equal(s.can_join, false, 'Parent session view must have can_join=false');
      }

      const pAtt = await apiRequest(
        baseUrl,
        'GET',
        `/parent/children/${STUDENT1_ID}/attendance`,
        parent1Token,
      );
      assert.equal(pAtt.status, 200);
      assert.ok(pAtt.json.data.summary.total_sessions >= 1);

      // Unlinked parent IDOR -> 403
      const idorParent = await apiRequest(
        baseUrl,
        'GET',
        `/parent/children/${STUDENT1_ID}/sessions`,
        unlinkedParentToken,
      );
      assert.equal(idorParent.status, 403);

      // Cross-teacher IDOR -> 403
      const otherTeacherRead = await apiRequest(
        baseUrl,
        'GET',
        `/teacher/sessions/${hybridSessionId}`,
        teacher2Token,
      );
      assert.equal(otherTeacherRead.status, 403);

      // Cross-tenant NPS admin on Greenwood session -> 404/403
      const crossTenantAudit = await apiRequest(
        baseUrl,
        'GET',
        `/admin/sessions/${hybridSessionId}/audit`,
        npsAdminToken,
      );
      assert.ok(crossTenantAudit.status === 403 || crossTenantAudit.status === 404);
      pass(
        'Parent meeting_url redaction, unlinked-parent IDOR, cross-teacher IDOR, and cross-tenant isolation verified',
      );
    }

    // 10. Admin Timetable Bulk Generation (Idempotent), Audit Trail & Server-Computed Student Summary
    {
      const ays = await apiRequest(baseUrl, 'GET', '/admin/academic-years', gwAdminToken);
      assert.equal(ays.status, 200);
      assert.ok((ays.json.data || []).some((a: any) => a.academic_year_id === ACTIVE_AY_ID));

      const gen1 = await apiRequest(baseUrl, 'POST', '/admin/sessions/generate', gwAdminToken, {
        academic_year_id: ACTIVE_AY_ID,
        start_date: genStart,
        end_date: genEnd,
      });
      assert.equal(gen1.status, 201, JSON.stringify(gen1.json));
      assert.ok(gen1.json.data.created_count > 0, 'Timetable generation must create sessions');

      // Re-run identical window -> idempotent created_count = 0
      const gen2 = await apiRequest(baseUrl, 'POST', '/admin/sessions/generate', gwAdminToken, {
        academic_year_id: ACTIVE_AY_ID,
        start_date: genStart,
        end_date: genEnd,
      });
      assert.equal(gen2.status, 201);
      assert.equal(gen2.json.data.created_count, 0, 'Second timetable run must be idempotent');

      // Teacher & Admin Audit History
      const tAudit = await apiRequest(
        baseUrl,
        'GET',
        `/teacher/sessions/${hybridSessionId}/audit`,
        teacher1Token,
      );
      assert.equal(tAudit.status, 200);
      assert.ok(
        (tAudit.json.data.items || []).length >= 3,
        'Audit trail must contain create, lifecycle transitions, and attendance events',
      );

      const aAudit = await apiRequest(
        baseUrl,
        'GET',
        `/admin/sessions/${hybridSessionId}/audit`,
        gwAdminToken,
      );
      assert.equal(aAudit.status, 200);

      // Student Attendance summary check
      const sAtt = await apiRequest(baseUrl, 'GET', '/student/attendance', student1Token);
      assert.equal(sAtt.status, 200);
      assert.ok(typeof sAtt.json.data.summary.attendance_percentage === 'number');
      pass(
        'Admin idempotent timetable generation, session audit history, & server attendance metrics verified',
      );
    }

    // 11. Flipped Classroom: Teacher Pre-Class Preparation, Student Flipped Workflow & Security Boundaries
    {
      const CURRICULUM_UNIT_ID = 'f7810ba3-1e1e-5ca2-8e14-bcc04690f9dd';
      const RESOURCE_ID = '81e8e998-facf-53f9-be09-f435818907a2';
      const OUTCOME_ID = '9d6a6d01-e833-5cf8-8d4b-9f1f9c1d3203';

      // 1. Teacher creates flipped lesson plan preparation
      const createPrep = await apiRequest(
        baseUrl,
        'POST',
        '/teacher/flipped-preparation',
        teacher1Token,
        {
          curriculum_unit_id: CURRICULUM_UNIT_ID,
          lesson_title: 'Unit 1: Flipped Mastery Session',
          lesson_summary:
            'Watch introductory lecture and review chapter before attending live discussion.',
          prerequisite_knowledge: 'Basic understanding of foundational terms.',
          planned_date: '2027-01-20',
          duration_minutes: 45,
          resources: [
            {
              resource_id: RESOURCE_ID,
              is_mandatory: true,
              access_instructions: 'Review chapter 1 carefully',
            },
          ],
          questions: [
            {
              prompt:
                'What is the primary difference between synchronous and asynchronous learning?',
              expected_response: 'Synchronous happens in real-time.',
            },
          ],
          learning_outcomes: [
            {
              learning_outcome_id: OUTCOME_ID,
              coverage_notes: 'Addressed in pre-reading',
            },
          ],
          in_class_activities: [
            {
              activity_title: 'Socratic Circle Discussion',
              activity_type: 'discussion',
              duration_minutes: 20,
            },
          ],
        },
      );
      assert.equal(createPrep.status, 201, JSON.stringify(createPrep.json));
      const flippedPlanId = createPrep.json.data.lesson_plan_id;
      assert.ok(flippedPlanId);
      createdLessonPlanIds.push(flippedPlanId);

      // 2. Schedule flipped classroom session linked to this plan
      const createFlippedSession = await apiRequest(
        baseUrl,
        'POST',
        '/teacher/sessions',
        teacher1Token,
        {
          faculty_assignment_id: TEACHER1_FA_ID,
          classroom_id: CLASSROOM_ID,
          session_date: '2027-01-20',
          scheduled_start_time: '14:00:00',
          scheduled_end_time: '14:45:00',
          delivery_mode: 'hybrid',
          teaching_approach: 'flipped',
          lesson_plan_id: flippedPlanId,
          meeting_url: 'https://meet.example.com/flipped-mastery',
          topics_covered: 'Flipped Mastery Discussion',
        },
      );
      assert.equal(createFlippedSession.status, 201, JSON.stringify(createFlippedSession.json));
      const flippedSessionId = createFlippedSession.json.data.session_id;
      createdSessionIds.push(flippedSessionId);

      // 3. Teacher queries session detail -> includes full flipped_preparation
      const tDetail = await apiRequest(
        baseUrl,
        'GET',
        `/teacher/sessions/${flippedSessionId}`,
        teacher1Token,
      );
      assert.equal(tDetail.status, 200);
      const prep = tDetail.json.data.flipped_preparation;
      assert.ok(prep, 'Session detail must return flipped_preparation');
      assert.equal(prep.lesson_plan_id, flippedPlanId);
      assert.equal(prep.lesson_title, 'Unit 1: Flipped Mastery Session');
      assert.ok(prep.resources.length > 0);
      assert.ok(
        prep.resources[0].access_url,
        'Resource must have a safe signed/download access_url',
      );
      assert.equal((prep.resources[0] as any).storage_bucket, undefined);
      assert.equal((prep.resources[0] as any).storage_path, undefined);
      assert.ok(prep.questions.length > 0);
      assert.ok(prep.learning_outcomes.length > 0);
      assert.ok(prep.in_class_activities.length > 0);
      assert.ok(prep.monitoring, 'Preparation must include monitoring metrics');
      assert.ok(typeof prep.monitoring.enrolled_count === 'number');

      // 4. Student enrolled in Section 1-A queries flipped preparation
      const sPrep = await apiRequest(baseUrl, 'GET', '/student/flipped-preparation', student1Token);
      assert.equal(sPrep.status, 200);
      const studentItems = sPrep.json.data || [];
      const studentSession = studentItems.find((s: any) => s.session_id === flippedSessionId);
      assert.ok(studentSession, 'Student must receive their upcoming flipped session');
      assert.ok(studentSession.flipped_preparation);
      assert.equal(studentSession.flipped_preparation.resources.length, 1);
      assert.ok(studentSession.flipped_preparation.resources[0].access_url);

      // 5. Cross-tenant isolation on flipped preparation (NPS Principal blocked)
      const crossTenantPrep = await apiRequest(
        baseUrl,
        'GET',
        `/teacher/flipped-preparation/${flippedPlanId}`,
        npsAdminToken,
      );
      assert.ok(crossTenantPrep.status === 403 || crossTenantPrep.status === 404);

      pass(
        'Flipped classroom pre-class preparation creation, student portal delivery, monitoring summary, & security boundaries verified',
      );
    }

    console.log(`\n[Hybrid Classroom Backend Suite] ${passed}/${passed} test groups passed.\n`);
  } finally {
    NotificationService.sendBulkNotifications = originalSendBulk;
    if (wsStudent1) wsStudent1.close();
    if (wsStudent2) wsStudent2.close();
    realtimeNotificationServer.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));

    // Thorough cleanup of synthetic test data created in PG during this run.
    // Capture entity_ids first, delete parent classroom_sessions (cascading child attendance),
    // then purge audit entries including those emitted by DELETE triggers.
    const auditTargetRows: Array<{ entity_id: string }> = await prisma.$queryRawUnsafe(
      `SELECT session_id AS entity_id FROM classroom_sessions
       WHERE org_id = $1::uuid AND (session_id = ANY($2::uuid[]) OR session_date BETWEEN $3::date AND $4::date)
       UNION
       SELECT att.session_attendance_id AS entity_id
       FROM classroom_session_attendance att
       JOIN classroom_sessions cs ON cs.session_id = att.session_id
       WHERE cs.org_id = $1::uuid AND (cs.session_id = ANY($2::uuid[]) OR cs.session_date BETWEEN $3::date AND $4::date)`,
      GW_ORG_ID,
      createdSessionIds,
      genStart,
      genEnd,
    );
    const auditEntityIds = auditTargetRows.map((r) => r.entity_id);

    await prisma.$executeRawUnsafe(
      `DELETE FROM classroom_session_attendance
       WHERE org_id = $1::uuid
         AND session_id IN (
           SELECT session_id FROM classroom_sessions
           WHERE org_id = $1::uuid
             AND session_status = 'in_progress'
             AND (session_id = ANY($2::uuid[]) OR session_date BETWEEN $3::date AND $4::date)
         )`,
      GW_ORG_ID,
      createdSessionIds,
      genStart,
      genEnd,
    );

    await prisma.$executeRawUnsafe(
      `DELETE FROM classroom_sessions
       WHERE org_id = $1::uuid AND (session_id = ANY($2::uuid[]) OR session_date BETWEEN $3::date AND $4::date)`,
      GW_ORG_ID,
      createdSessionIds,
      genStart,
      genEnd,
    );
    if (auditEntityIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM classroom_session_audit_history
         WHERE org_id = $1::uuid AND entity_id = ANY($2::uuid[])`,
        GW_ORG_ID,
        auditEntityIds,
      );
    }
    await prisma.$executeRawUnsafe(
      `DELETE FROM notifications
       WHERE org_id = $1::uuid AND entity_type = 'classroom_session' AND created_at >= $2`,
      GW_ORG_ID,
      testRunStart,
    );

    if (createdLessonPlanIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM lesson_exit_tickets WHERE lesson_plan_id = ANY($1::uuid[])`,
        createdLessonPlanIds,
      );
      await prisma.$executeRawUnsafe(
        `DELETE FROM lesson_activities WHERE lesson_plan_id = ANY($1::uuid[])`,
        createdLessonPlanIds,
      );
      await prisma.$executeRawUnsafe(
        `DELETE FROM lesson_plan_resources WHERE lesson_plan_id = ANY($1::uuid[])`,
        createdLessonPlanIds,
      );
      await prisma.$executeRawUnsafe(
        `DELETE FROM lesson_plan_outcomes WHERE lesson_plan_id = ANY($1::uuid[])`,
        createdLessonPlanIds,
      );
      await prisma.$executeRawUnsafe(
        `DELETE FROM lesson_plans WHERE lesson_plan_id = ANY($1::uuid[])`,
        createdLessonPlanIds,
      );
    }

    await prisma.$disconnect();
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[Hybrid Classroom Backend Suite] FAILED:', err);
    process.exit(1);
  });
