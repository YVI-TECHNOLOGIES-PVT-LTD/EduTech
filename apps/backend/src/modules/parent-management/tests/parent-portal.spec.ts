import assert from 'assert';
import prisma from '../../../lib/prismaClient';
import { extractParentSessionContext, ParentPortalPolicy } from '../policies/parent-portal.policy';
import {
  buildDayScheduleSlots,
  ParentPortalService,
  selectChildCurrentEnrollment,
} from '../services/parent-portal.service';
import {
  ParentPortalRepository,
  RawBellPeriodRow,
  RawChildEnrollment,
  RawLinkedChild,
  RawTimetableEntryRow,
} from '../repositories/parent-portal.repository';
import { ParentError, ParentForbiddenError } from '../errors/parent.errors';
import { ParentOverviewService } from '../../dashboard/services/parent-overview.service';
import { HelpdeskService } from '../../communication/services/HelpdeskService';
import { StudentAcademicsService } from '../../student-management/services/student-academics.service';

type TestFn = () => void | Promise<void>;

async function runTests() {
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: TestFn) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed += 1;
    } catch (err: any) {
      console.error(`  [FAIL] ${name}: ${err?.message || err}`);
      if (err?.stack) console.error(err.stack);
      failed += 1;
    }
  }

  function simulatePolicy(
    userObj: {
      id?: string;
      org_id?: string;
      email?: string;
      roles?: string[];
    } | null,
    queryOrgOverride?: string,
  ): Promise<{ allowed: boolean; statusCode?: number; error?: string }> {
    return new Promise((resolve) => {
      const middleware = ParentPortalPolicy.requireParentRole();
      const req: any = {
        query: queryOrgOverride ? { org_id: queryOrgOverride } : {},
        context: userObj ? { user: userObj } : {},
      };
      const res: any = {
        statusCode: 200,
        status(code: number) {
          this.statusCode = code;
          return this;
        },
        json(payload: any) {
          resolve({
            allowed: false,
            statusCode: this.statusCode,
            error: payload?.error,
          });
        },
      };
      middleware(req, res, () => resolve({ allowed: true }));
    });
  }

  console.log('\n=======================================================');
  console.log(' EduTrack Parent Portal Stage-2 Integration & Security ');
  console.log('=======================================================\n');

  const ORG_A = '11111111-1111-4111-8111-111111111111';
  const ORG_B = '22222222-2222-4222-8222-222222222222';
  const USER_PARENT_A = '33333333-3333-4333-8333-333333333333';
  const USER_PARENT_B = '44444444-4444-4444-8444-444444444444';
  const CHILD_A1 = '55555555-5555-4555-8555-555555555555';
  const CHILD_A2 = '66666666-6666-4666-8666-666666666666';
  const CHILD_B1 = '77777777-7777-4777-8777-777777777777';
  const PARENT_REC_A = '88888888-8888-4888-8888-888888888888';

  // ── SUITE 1: Strict Parent Role Segregation & Session Tenant Extraction ─────
  console.log('[Suite 1: RBAC Role Segregation & Session Extraction]');

  await test('Allows PARENT, GUARDIAN, and ENROLLED_PARENT roles', async () => {
    for (const role of ['PARENT', 'GUARDIAN', 'ENROLLED_PARENT']) {
      const res = await simulatePolicy({
        id: USER_PARENT_A,
        org_id: ORG_A,
        roles: [role],
      });
      assert.strictEqual(res.allowed, true, `Expected role ${role} to be allowed`);
    }
  });

  await test('Rejects non-parent roles (ADMIN, SUPERADMIN, TEACHER, STAFF, STUDENT) with 403', async () => {
    for (const role of ['ADMIN', 'SUPERADMIN', 'TEACHER', 'FACULTY', 'STAFF', 'STUDENT']) {
      const res = await simulatePolicy({
        id: USER_PARENT_A,
        org_id: ORG_A,
        roles: [role],
      });
      assert.strictEqual(res.allowed, false, `Expected role ${role} to be blocked`);
      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.error, 'FORBIDDEN');
    }
  });

  await test('Rejects unauthenticated or missing org context with 401', async () => {
    const noUser = await simulatePolicy(null);
    assert.strictEqual(noUser.allowed, false);
    assert.strictEqual(noUser.statusCode, 401);

    const noOrg = await simulatePolicy({ id: USER_PARENT_A, roles: ['PARENT'] });
    assert.strictEqual(noOrg.allowed, false);
    assert.strictEqual(noOrg.statusCode, 401);
  });

  await test('extractParentSessionContext ignores client query/body org_id override', () => {
    const req: any = {
      query: { org_id: ORG_B },
      body: { org_id: ORG_B },
      context: {
        user: {
          id: USER_PARENT_A,
          org_id: ORG_A,
          email: 'parent.a@example.com',
          roles: ['PARENT'],
        },
      },
    };
    const ctx = extractParentSessionContext(req);
    assert.strictEqual(ctx.orgId, ORG_A);
    assert.strictEqual(ctx.userId, USER_PARENT_A);
    assert.strictEqual(ctx.email, 'parent.a@example.com');
  });

  // ── SUITE 2: Timetable Merging, Status Calculation & Enrollment Priority ───
  console.log('\n[Suite 2: Timetable Slot Merge & Enrollment Selector]');

  await test('buildDayScheduleSlots merges breaks, lunch, ongoing/upcoming/completed classes, and co-teachers', () => {
    const bellPeriods: RawBellPeriodRow[] = [
      {
        bell_schedule_id: 'bs-1',
        schedule_name: 'Regular Bell',
        bell_schedule_period_id: 'p1',
        period_number: 1,
        period_name: 'Period 1',
        period_type: 'teaching',
        start_time: '08:00',
        end_time: '08:45',
      },
      {
        bell_schedule_id: 'bs-1',
        schedule_name: 'Regular Bell',
        bell_schedule_period_id: 'p2',
        period_number: 2,
        period_name: 'Short Break',
        period_type: 'break',
        start_time: '08:45',
        end_time: '09:00',
      },
      {
        bell_schedule_id: 'bs-1',
        schedule_name: 'Regular Bell',
        bell_schedule_period_id: 'p3',
        period_number: 3,
        period_name: 'Period 2',
        period_type: 'teaching',
        start_time: '09:00',
        end_time: '09:45',
      },
      {
        bell_schedule_id: 'bs-1',
        schedule_name: 'Regular Bell',
        bell_schedule_period_id: 'p4',
        period_number: 4,
        period_name: 'Lunch Break',
        period_type: 'lunch',
        start_time: '09:45',
        end_time: '10:30',
      },
      {
        bell_schedule_id: 'bs-1',
        schedule_name: 'Regular Bell',
        bell_schedule_period_id: 'p5',
        period_number: 5,
        period_name: 'Period 3',
        period_type: 'teaching',
        start_time: '10:30',
        end_time: '11:15',
      },
      {
        bell_schedule_id: 'bs-1',
        schedule_name: 'Regular Bell',
        bell_schedule_period_id: 'p6',
        period_number: 6,
        period_name: 'Period 4',
        period_type: 'teaching',
        start_time: '11:15',
        end_time: '12:00',
      },
    ];

    const dayEntries: RawTimetableEntryRow[] = [
      {
        timetable_entry_id: 'e1',
        timetable_version_id: 'v1',
        section_id: 'sec1',
        academic_year_grade_subject_id: 'aygs-math',
        faculty_assignment_id: 'fa-1',
        weekday: 1,
        bell_schedule_period_id: 'p1',
        period_number: 1,
        period_name: 'Period 1',
        period_type: 'teaching',
        start_time: '08:00',
        end_time: '08:45',
        subject_id: 's-math',
        subject_code: 'MATH',
        subject_name: 'Mathematics',
        staff_id: 'st-1',
        teacher_name: 'Ms. Priya',
        teacher_email: 'priya@school.edu',
        classroom_id: 'cr-1',
        room_code: 'R101',
        room_name: 'Room 101',
        building_name: 'Main Block',
        floor_name: '1st Floor',
        notes: null,
      },
      {
        timetable_entry_id: 'e2',
        timetable_version_id: 'v1',
        section_id: 'sec1',
        academic_year_grade_subject_id: 'aygs-sci',
        faculty_assignment_id: 'fa-2',
        weekday: 1,
        bell_schedule_period_id: 'p3',
        period_number: 3,
        period_name: 'Period 2',
        period_type: 'teaching',
        start_time: '09:00',
        end_time: '09:45',
        subject_id: 's-sci',
        subject_code: 'SCI',
        subject_name: 'Science Lab',
        staff_id: 'st-2',
        teacher_name: 'Mr. Kiran',
        teacher_email: 'kiran@school.edu',
        classroom_id: 'cr-2',
        room_code: 'LAB1',
        room_name: null,
        building_name: 'Science Wing',
        floor_name: 'Ground',
        notes: 'Bring lab manual',
      },
      {
        timetable_entry_id: 'e3',
        timetable_version_id: 'v1',
        section_id: 'sec1',
        academic_year_grade_subject_id: 'aygs-eng',
        faculty_assignment_id: 'fa-3',
        weekday: 1,
        bell_schedule_period_id: 'p5',
        period_number: 5,
        period_name: 'Period 3',
        period_type: 'teaching',
        start_time: '10:30',
        end_time: '11:15',
        subject_id: 's-eng',
        subject_code: 'ENG',
        subject_name: 'English',
        staff_id: 'st-3',
        teacher_name: 'Ms. Ananya',
        teacher_email: null,
        classroom_id: null,
        room_code: null,
        room_name: null,
        building_name: null,
        floor_name: null,
        notes: null,
      },
    ];

    const coTeachers = new Map<string, string[]>([['aygs-sci', ['Mr. Kiran', 'Ms. Neha']]]);

    const slots = buildDayScheduleSlots(1, bellPeriods, dayEntries, coTeachers, {
      currentWeekday: 1,
      currentTimeHHMM: '09:15',
    });

    assert.strictEqual(slots.length, 6);
    assert.strictEqual(slots[0].status, 'completed');
    assert.strictEqual(slots[0].classroom_label, 'Room 101 (R101)');
    assert.strictEqual(slots[1].status, 'break');
    assert.strictEqual(slots[1].is_break, true);
    assert.strictEqual(slots[2].status, 'ongoing');
    assert.deepStrictEqual(slots[2].co_teachers, ['Ms. Neha']);
    assert.strictEqual(slots[3].status, 'lunch');
    assert.strictEqual(slots[3].is_break, true);
    assert.strictEqual(slots[4].status, 'upcoming');
    assert.strictEqual(slots[5].status, 'free');
  });

  await test('selectChildCurrentEnrollment handles empty vs ordered enrollments cleanly', () => {
    assert.strictEqual(selectChildCurrentEnrollment([]), null);
    const mockEnr: RawChildEnrollment = {
      enrollment_id: 'enr-1',
      academic_year_grade_id: 'ayg-1',
      academic_year_id: 'ay-1',
      academic_year_name: '2026-2027',
      academic_year_status: 'teaching',
      grade_id: 'g-5',
      grade_code: 'G5',
      grade_name: 'Grade 5',
      grade_board: 'CBSE',
      section_id: 'sec-a',
      section_name: 'A',
      section_room_no: '101',
      class_teacher_staff_id: 'st-1',
      class_teacher_name: 'Teacher A',
      class_teacher_email: null,
      class_teacher_designation: 'PRT',
      roll_number: '12',
      enrollment_status: 'active',
      enrollment_date: '2026-04-01',
      created_at: '2026-04-01T00:00:00.000Z',
    };
    assert.strictEqual(selectChildCurrentEnrollment([mockEnr])?.enrollment_id, 'enr-1');
  });

  // ── SUITE 3: Cross-Parent IDOR, Multi-Child, Resource Downloads & No Fake Data ──
  console.log('\n[Suite 3: Deterministic Multi-Child, IDOR & Permission Isolation]');

  const makeMockChild = (id: string, name: string, grade: string, sec: string): RawLinkedChild => ({
    student_id: id,
    org_id: ORG_A,
    application_id: null,
    user_id: null,
    avatar_url: null,
    admission_no: `ADM-${id.slice(0, 4)}`,
    first_name: name.split(' ')[0],
    last_name: name.split(' ')[1] || null,
    full_name: name,
    dob: '2016-05-10',
    gender: 'female',
    admission_date: '2025-04-01',
    student_status: 'active',
    relationship: 'mother',
    is_primary_contact: true,
    enrollments: [
      {
        enrollment_id: `enr-${id}`,
        academic_year_grade_id: `ayg-${grade}`,
        academic_year_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        academic_year_name: '2026-2027',
        academic_year_status: 'teaching',
        grade_id: `grade-${grade}`,
        grade_code: grade,
        grade_name: `Grade ${grade}`,
        grade_board: 'CBSE',
        section_id: `sec-${sec}`,
        section_name: sec,
        section_room_no: '204',
        class_teacher_staff_id: 'st-ct',
        class_teacher_name: 'Ms. Sunita Rao',
        class_teacher_email: 'sunita@school.edu',
        class_teacher_designation: 'Class Teacher',
        roll_number: '15',
        enrollment_status: 'active',
        enrollment_date: '2026-04-01',
        created_at: '2026-04-01T00:00:00.000Z',
      },
    ],
  });

  const origRepo = {
    studentExistsInOrg: ParentPortalRepository.studentExistsInOrg,
    resolveAuthorizedParentRecords: ParentPortalRepository.resolveAuthorizedParentRecords,
    findAuthorizedChildren: ParentPortalRepository.findAuthorizedChildren,
    getOrganizationMeta: ParentPortalRepository.getOrganizationMeta,
    getCurrentAcademicYear: ParentPortalRepository.getCurrentAcademicYear,
    findChildCurriculum: ParentPortalRepository.findChildCurriculum,
    checkChildResourceAccess: ParentPortalRepository.checkChildResourceAccess,
  };
  const origNotifCount = prisma.notifications.count;

  try {
    ParentPortalRepository.studentExistsInOrg = async (orgId, studentId) =>
      orgId === ORG_A && [CHILD_A1, CHILD_A2, CHILD_B1].includes(studentId);

    ParentPortalRepository.resolveAuthorizedParentRecords = async (orgId, userId) => {
      if (orgId === ORG_A && userId === USER_PARENT_A) {
        return [
          {
            parent_id: PARENT_REC_A,
            user_id: USER_PARENT_A,
            first_name: 'Meera',
            last_name: 'Nair',
            email: 'meera@example.com',
            phone: '9999900001',
          },
        ];
      }
      return [];
    };

    ParentPortalRepository.findAuthorizedChildren = async (orgId, parentIds, filterChildId) => {
      if (orgId !== ORG_A || !parentIds.includes(PARENT_REC_A)) return [];
      const kids = [
        makeMockChild(CHILD_A1, 'Anika Nair', '4', 'A'),
        makeMockChild(CHILD_A2, 'Rohan Nair', '7', 'B'),
      ];
      return filterChildId ? kids.filter((k) => k.student_id === filterChildId) : kids;
    };

    ParentPortalRepository.getOrganizationMeta = async () => ({
      org_id: ORG_A,
      org_name: 'Greenwood International School',
      board_affiliation: 'CBSE',
    });

    ParentPortalRepository.getCurrentAcademicYear = async () => ({
      academic_year_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      academic_year_name: '2026-2027',
      start_date: '2026-04-01',
      end_date: '2027-03-31',
      status: 'teaching',
    });

    ParentPortalRepository.findChildCurriculum = async () => [
      {
        curriculum_plan_id: 'cp-1',
        academic_year_grade_subject_id: 'aygs-1',
        version_number: 1,
        plan_title: 'Grade 4 Mathematics Syllabus',
        plan_description: 'Core numeracy and geometry',
        status: 'published',
        planned_start_date: '2026-04-01',
        planned_end_date: '2027-03-31',
        published_at: '2026-04-02T00:00:00Z',
        subject_id: 'subj-1',
        subject_code: 'MATH',
        subject_name: 'Mathematics',
        framework_code: 'CBSE',
        framework_name: 'CBSE NCF',
        authority_name: 'CBSE',
        framework_version_code: '2024',
        framework_version_name: 'NCF 2024',
        units: [
          {
            curriculum_unit_id: 'u-past',
            unit_code: 'U1',
            unit_title: 'Number Systems',
            unit_description: null,
            sequence_number: 1,
            planned_duration_periods: 12,
            planned_start_date: '2025-04-01',
            planned_end_date: '2025-05-01',
            outcomes: [
              {
                learning_outcome_id: 'lo-1',
                outcome_code: 'LO1',
                outcome_statement: 'Understands place value up to 100,000',
                bloom_level: 'Understand',
                assessment_criteria: null,
                sequence_number: 1,
              },
            ],
          },
          {
            curriculum_unit_id: 'u-future',
            unit_code: 'U2',
            unit_title: 'Fractions & Decimals',
            unit_description: null,
            sequence_number: 2,
            planned_duration_periods: 10,
            planned_start_date: '2029-01-01',
            planned_end_date: '2029-02-01',
            outcomes: [],
          },
        ],
      },
    ];

    ParentPortalRepository.checkChildResourceAccess = async (
      _org,
      _cid,
      _gid,
      _sid,
      resourceId,
    ) => {
      if (resourceId === 'res-view-only') {
        return { accessible: true, allowDownload: false };
      }
      if (resourceId === 'res-downloadable') {
        return { accessible: true, allowDownload: true };
      }
      return { accessible: false, allowDownload: false };
    };

    await test('Supports multi-child listing for authorized parent without hardcoded child counts', async () => {
      const listRes = await ParentPortalService.listAuthorizedChildren(ORG_A, USER_PARENT_A);
      assert.strictEqual(listRes.children.length, 2);
      assert.strictEqual(listRes.children[0].full_name, 'Anika Nair');
      assert.strictEqual(listRes.children[1].full_name, 'Rohan Nair');
      assert.strictEqual(listRes.organization?.org_name, 'Greenwood International School');
    });

    await test('Blocks cross-parent IDOR with 403 Forbidden for another family child in same org', async () => {
      let rejected = false;
      try {
        await ParentPortalService.assertAndResolveChild(ORG_A, USER_PARENT_A, null, CHILD_B1);
      } catch (err) {
        assert.ok(err instanceof ParentForbiddenError);
        assert.strictEqual(err.statusCode, 403);
        rejected = true;
      }
      assert.strictEqual(rejected, true);
    });

    await test('Blocks cross-tenant childId with 404 without leaking other tenant student', async () => {
      let rejected = false;
      try {
        await ParentPortalService.assertAndResolveChild(ORG_B, USER_PARENT_A, null, CHILD_A1);
      } catch (err) {
        assert.ok(err instanceof ParentError);
        assert.strictEqual(err.statusCode, 404);
        rejected = true;
      }
      assert.strictEqual(rejected, true);
    });

    await test('Blocks unauthorized resource preview & enforces allow_download=false policy', async () => {
      let unsharedBlocked = false;
      try {
        await ParentPortalService.getChildResourcePreviewUrl(
          ORG_A,
          USER_PARENT_A,
          null,
          CHILD_A1,
          'res-draft-other-grade',
        );
      } catch (err) {
        assert.ok(err instanceof ParentForbiddenError);
        assert.strictEqual(err.statusCode, 403);
        unsharedBlocked = true;
      }
      assert.strictEqual(unsharedBlocked, true);

      let downloadRestricted = false;
      try {
        await ParentPortalService.getChildResourceDownloadUrl(
          ORG_A,
          USER_PARENT_A,
          null,
          CHILD_A1,
          'res-view-only',
        );
      } catch (err) {
        assert.ok(err instanceof ParentForbiddenError);
        assert.strictEqual(err.statusCode, 403);
        assert.ok(err.message.includes('restricted'));
        downloadRestricted = true;
      }
      assert.strictEqual(downloadRestricted, true);
    });

    await test('Curriculum pacing strictly derives from planned unit dates and flags unsupported metrics', async () => {
      const prog = await ParentPortalService.getChildCurriculumAndProgress(
        ORG_A,
        USER_PARENT_A,
        null,
        CHILD_A1,
      );
      assert.strictEqual(prog.plans.length, 1);
      assert.strictEqual(prog.pacing_summary.total_units, 2);
      assert.strictEqual(prog.pacing_summary.total_outcomes, 1);
      assert.strictEqual(prog.pacing_summary.scheduled_completed_units, 1);
      assert.strictEqual(prog.pacing_summary.scheduled_upcoming_units, 1);
      assert.strictEqual(prog.pacing_summary.scheduled_timeline_percent, 50);
      assert.deepStrictEqual(prog.unsupported_tracking, {
        attendance: false,
        exam_marks: false,
        report_cards: false,
        assignment_submissions: false,
        verified_topic_completion: false,
      });
    });
  } finally {
    ParentPortalRepository.studentExistsInOrg = origRepo.studentExistsInOrg;
    ParentPortalRepository.resolveAuthorizedParentRecords = origRepo.resolveAuthorizedParentRecords;
    ParentPortalRepository.findAuthorizedChildren = origRepo.findAuthorizedChildren;
    ParentPortalRepository.getOrganizationMeta = origRepo.getOrganizationMeta;
    ParentPortalRepository.getCurrentAcademicYear = origRepo.getCurrentAcademicYear;
    ParentPortalRepository.findChildCurriculum = origRepo.findChildCurriculum;
    ParentPortalRepository.checkChildResourceAccess = origRepo.checkChildResourceAccess;
    prisma.notifications.count = origNotifCount;
  }

  // ── SUITE 4: Live PostgreSQL Schema & Anti-Hijack Verification ─────────────
  console.log('\n[Suite 4: Live PostgreSQL Anti-Hijack & Parent/Student Contracts]');

  await test('Claimed parent profile cannot be hijacked via matching email in ParentPortalRepository', async () => {
    const claimedParent = await prisma.parents.findFirst({
      where: {
        user_id: { not: null },
        email: { not: null },
      },
      select: {
        org_id: true,
        user_id: true,
        email: true,
        parent_id: true,
      },
    });

    if (!claimedParent || !claimedParent.email) {
      console.log('    (skipped: no claimed parent with email in database)');
      return;
    }

    const attackerUserId = '99999999-9999-4999-8999-999999999999';
    const spoofed = await ParentPortalRepository.resolveAuthorizedParentRecords(
      claimedParent.org_id,
      attackerUserId,
      claimedParent.email,
    );
    assert.strictEqual(
      spoofed.some((p) => p.parent_id === claimedParent.parent_id),
      false,
      'Attacker with matching email must NEVER resolve a parent row already bound to another user_id',
    );

    const helpdeskKids = await HelpdeskService.getParentChildren(
      claimedParent.org_id,
      attackerUserId,
    );
    assert.strictEqual(
      helpdeskKids.length,
      0,
      'HelpdeskService must return 0 children for attacker user_id even if email matches another parent',
    );
  });

  await test('ParentOverviewService returns real data with zero fabricated attendance (95) or exam_stats (88)', async () => {
    const linked = await prisma.student_parents.findFirst({
      include: {
        parents: true,
      },
    });
    if (!linked || !linked.parents?.org_id || !linked.parents?.user_id) {
      console.log('    (skipped: no linked active parent with user_id in database)');
      return;
    }
    const overview = await ParentOverviewService.getParentOverview(
      linked.parents.org_id,
      linked.parents.user_id,
      linked.parents.email || undefined,
    );
    for (const c of overview.children) {
      assert.deepStrictEqual(c.student.attendance, [], 'Must not fabricate attendance percentages');
      assert.deepStrictEqual(c.student.exam_stats, [], 'Must not fabricate exam statistics');
    }
  });

  await test('Live PostgreSQL ParentPortalService end-to-end overview & cross-parent isolation', async () => {
    const linked = await prisma.student_parents.findFirst({
      where: {
        parents: { user_id: { not: null } },
      },
      include: {
        parents: true,
        students: true,
      },
    });
    if (!linked || !linked.parents?.user_id) {
      console.log('    (skipped: no linked parent fixture with user_id in database)');
      return;
    }

    const orgId = linked.parents.org_id;
    const userId = linked.parents.user_id;
    const overview = await ParentPortalService.getDashboardOverview(
      orgId,
      userId,
      linked.parents.email,
    );
    assert.ok(overview.children.length >= 1, 'Expected at least 1 linked child in live overview');
    assert.deepStrictEqual(overview.unsupported_metrics, {
      attendance_percentage: false,
      exam_results: false,
      assignment_completion: false,
    });

    const childId = overview.children[0].student_id;
    const [profile, todayTt, weekTt, subjects, curriculum, resources, calendar] = await Promise.all(
      [
        ParentPortalService.getChildProfile(orgId, userId, linked.parents.email, childId),
        ParentPortalService.getChildTodayTimetable(orgId, userId, linked.parents.email, childId),
        ParentPortalService.getChildWeeklyTimetable(orgId, userId, linked.parents.email, childId),
        ParentPortalService.getChildSubjects(orgId, userId, linked.parents.email, childId),
        ParentPortalService.getChildCurriculumAndProgress(
          orgId,
          userId,
          linked.parents.email,
          childId,
        ),
        ParentPortalService.getChildResources(orgId, userId, linked.parents.email, childId),
        ParentPortalService.getChildCalendar(orgId, userId, linked.parents.email, childId),
      ],
    );
    assert.strictEqual(profile.child.student_id, childId);
    assert.strictEqual(todayTt.child_id, childId);
    assert.strictEqual(weekTt.child_id, childId);
    assert.strictEqual(subjects.child_id, childId);
    assert.strictEqual(curriculum.child_id, childId);
    assert.strictEqual(resources.child_id, childId);
    assert.strictEqual(calendar.child_id, childId);

    // Ensure another parent (or synthetic unrelated user) cannot read this child via StudentAcademicsService
    let studentAccessBlocked = false;
    try {
      await StudentAcademicsService.getTodayTimetable(
        childId,
        {
          id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
          email: 'other.student@example.com',
          roles: ['STUDENT'],
          org_id: orgId,
        },
        orgId,
      );
    } catch (err: any) {
      assert.strictEqual(err?.statusCode, 403);
      studentAccessBlocked = true;
    }
    assert.strictEqual(studentAccessBlocked, true);
  });

  console.log(`\nParent Portal Spec Summary: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
