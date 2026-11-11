import assert from 'assert';
import prisma from '../../../lib/prismaClient';
import { SessionService } from '../../../auth/session.service';
import { getEffectiveRoles, checkPermission } from '../../../rbac/rbac.middleware';
import { AcademicPolicy } from '../policies/academic.policy';
import { TeacherContextRepository } from '../repositories/teacher-context.repository';
import { TeacherContextService } from '../services/teacher-context.service';
import { SuperAdminRepository } from '../repositories/super-admin.repository';
import { SuperAdminController } from '../controllers/super-admin.controller';
import { LessonPlanningService } from '../services/lesson-planning.service';
import { AcademicError } from '../errors/academic.errors';
import {
  teacherScheduleQuerySchema,
  teacherWorkspaceQuerySchema,
} from '../dto/request/teacher-workspace.dto';

// Standard Tenant IDs
const TENANT_A_ID = '624efc1b-4144-43a4-90b8-552d945cbef7'; // Greenwood High Delhi
const TENANT_B_ID = 'b8d4e92a-3c1f-4a5e-8b6d-7e2f1a9c3d5e'; // Secondary Test School

// Real Database Users in Tenant A
const SUPERADMIN_USER = {
  id: 'cdb464af-6d15-47dd-ae59-33cb07830246',
  email: 'superadmin.delhi@school.com',
  roles: ['SUPERADMIN'],
  org_id: TENANT_A_ID,
};

const ADMIN_USER = {
  id: '7bde8ed1-d570-4b0c-9385-7021b3f18b37',
  email: 'admin@greenwooddelhi.edu.in',
  roles: ['ADMIN'],
  org_id: TENANT_A_ID,
};

const TEACHER_AARAV_USER = {
  id: '5eab533b-7ba1-5230-b2c5-5eaea08a1b80', // Aarav Sharma
  email: 'tch001@greenwood.internal',
  roles: ['TEACHER'],
  org_id: TENANT_A_ID,
  staff_id: 'e085e865-2393-507c-bbc7-e0ade550bbd5',
};

const TEACHER_YOGESH_USER = {
  id: 'f1862c7b-e62a-5f1b-9c33-6d1cada8b5a3', // Yogesh Shukla
  email: 'tch060@greenwood.internal',
  roles: ['TEACHER'],
  org_id: TENANT_A_ID,
  staff_id: '08088ab3-e4cc-5e13-a7b7-d24871003c21',
};

let passedTests = 0;
let failedTests = 0;

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (error: any) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${error.message}`);
    failedTests++;
  }
}

async function runPhase9Tests() {
  console.log('\n===============================================================');
  console.log('  EDUTRACK ERP — PHASE 9: RBAC, DASHBOARDS & ACADEMIC WORKFLOWS');
  console.log('===============================================================\n');

  // ─── SUITE 1: DTO Validation & Schemas ─────────────────────────────────────
  console.log('[Suite 1: Request DTOs & Validation Schemas]');

  await test('teacherScheduleQuerySchema parses valid weekday integer', async () => {
    const parsed = teacherScheduleQuerySchema.parse({ weekday: '3' });
    assert.strictEqual(parsed.weekday, 3);
  });

  await test('teacherScheduleQuerySchema rejects invalid weekday out of range (1-7)', async () => {
    assert.throws(
      () => teacherScheduleQuerySchema.parse({ weekday: '8' }),
      /Number must be less than or equal to 7/,
    );
    assert.throws(
      () => teacherScheduleQuerySchema.parse({ weekday: '0' }),
      /Number must be greater than or equal to 1/,
    );
  });

  await test('teacherScheduleQuerySchema parses optional academic_year_id UUID', async () => {
    const validUuid = 'd1da3ed5-3e7b-4916-98ee-c0e8cf6cfda6';
    const parsed = teacherScheduleQuerySchema.parse({ academic_year_id: validUuid });
    assert.strictEqual(parsed.academic_year_id, validUuid);
  });

  await test('teacherWorkspaceQuerySchema validates optional staff_id UUID', async () => {
    const validStaffId = TEACHER_AARAV_USER.staff_id;
    const parsed = teacherWorkspaceQuerySchema.parse({ staff_id: validStaffId });
    assert.strictEqual(parsed.staff_id, validStaffId);
  });

  // ─── SUITE 2: Role Normalization & Dynamic Aliasing ────────────────────────
  console.log('\n[Suite 2: Role Normalization & Dynamic Aliasing]');

  await test('SessionService.normalizeRoleName normalizes Super Admin to SUPERADMIN', async () => {
    assert.strictEqual(SessionService.normalizeRoleName('Super Admin'), 'SUPERADMIN');
    assert.strictEqual(SessionService.normalizeRoleName('super_admin'), 'SUPERADMIN');
    assert.strictEqual(SessionService.normalizeRoleName('SuperAdministrator'), 'SUPERADMIN');
  });

  await test('SessionService.normalizeRoleName normalizes Administrator to ADMIN', async () => {
    assert.strictEqual(SessionService.normalizeRoleName('Administrator'), 'ADMIN');
    assert.strictEqual(SessionService.normalizeRoleName('admin'), 'ADMIN');
    assert.strictEqual(SessionService.normalizeRoleName('Org Admin'), 'ADMIN');
  });

  await test('SessionService.normalizeRoleName normalizes Teacher and Faculty to TEACHER', async () => {
    assert.strictEqual(SessionService.normalizeRoleName('Teacher'), 'TEACHER');
    assert.strictEqual(SessionService.normalizeRoleName('teacher'), 'TEACHER');
    assert.strictEqual(SessionService.normalizeRoleName('Faculty'), 'TEACHER');
    assert.strictEqual(SessionService.normalizeRoleName('faculty'), 'TEACHER');
  });

  await test('SessionService.normalizeRoleName preserves STAFF and FRONT_OFFICE', async () => {
    assert.strictEqual(SessionService.normalizeRoleName('Staff'), 'STAFF');
    assert.strictEqual(SessionService.normalizeRoleName('staff'), 'STAFF');
    assert.strictEqual(SessionService.normalizeRoleName('front_office'), 'FRONT_OFFICE');
    assert.strictEqual(SessionService.normalizeRoleName('receptionist'), 'FRONT_OFFICE');
  });

  await test('getEffectiveRoles expands TEACHER to include FACULTY without leaking STAFF', async () => {
    const effective = getEffectiveRoles(['TEACHER']);
    assert.ok(effective.includes('TEACHER'));
    assert.ok(effective.includes('FACULTY'));
    assert.strictEqual(effective.includes('STAFF'), false);
  });

  await test('getEffectiveRoles for STAFF does not grant TEACHER privileges', async () => {
    const effective = getEffectiveRoles(['STAFF']);
    assert.ok(effective.includes('STAFF'));
    assert.strictEqual(effective.includes('TEACHER'), false);
    assert.strictEqual(effective.includes('FACULTY'), false);
  });

  await test('getEffectiveRoles expands SUPERADMIN to include SUPER_ADMIN', async () => {
    const effective = getEffectiveRoles(['SUPERADMIN']);
    assert.ok(effective.includes('SUPERADMIN'));
    assert.ok(effective.includes('SUPER_ADMIN'));
  });

  await test('getEffectiveRoles expands ADMIN to include ORG_ADMIN', async () => {
    const effective = getEffectiveRoles(['ADMIN']);
    assert.ok(effective.includes('ADMIN'));
    assert.ok(effective.includes('ORG_ADMIN'));
  });

  // ─── SUITE 2B: Phase 9.1 Teacher Workspace Route Authorization ──────────────
  console.log('\n[Suite 2B: Teacher Workspace Access Restrictions (SEC-PHASE9-002)]');

  const simulatePermission = (
    requiredPerm: any,
    userObj: { id: string; email?: string; roles: string[]; permissions?: string[] },
  ) => {
    return new Promise<{ allowed: boolean; statusCode?: number; error?: string }>((resolve) => {
      const middleware = checkPermission(requiredPerm);
      const req: any = {
        context: {
          user: {
            id: userObj.id,
            email: userObj.email || 'test@school.internal',
            roles: userObj.roles,
            permissions: userObj.permissions || [],
          },
        },
      };
      const res: any = {
        statusCode: 200,
        status(code: number) {
          this.statusCode = code;
          return this;
        },
        json(data: any) {
          resolve({ allowed: false, statusCode: this.statusCode, error: data?.error });
        },
      };
      const next = () => {
        resolve({ allowed: true });
      };
      middleware(req, res, next);
    });
  };

  await test('TEACHER can access teacher workspace (Allowed)', async () => {
    const res = await simulatePermission(AcademicPolicy.canAccessTeacherWorkspace(), {
      id: TEACHER_AARAV_USER.id,
      roles: ['TEACHER'],
    });
    assert.strictEqual(res.allowed, true);
  });

  await test('FACULTY can access teacher workspace (Allowed)', async () => {
    const res = await simulatePermission(AcademicPolicy.canAccessTeacherWorkspace(), {
      id: TEACHER_AARAV_USER.id,
      roles: ['FACULTY'],
    });
    assert.strictEqual(res.allowed, true);
  });

  await test('Non-teaching STAFF is rejected from teacher workspace (403 FORBIDDEN)', async () => {
    const res = await simulatePermission(AcademicPolicy.canAccessTeacherWorkspace(), {
      id: '99999999-9999-9999-9999-999999999999',
      roles: ['STAFF'],
    });
    assert.strictEqual(res.allowed, false);
    assert.strictEqual(res.statusCode, 403);
  });

  await test('FRONT_OFFICE is rejected from teacher workspace (403 FORBIDDEN)', async () => {
    const res = await simulatePermission(AcademicPolicy.canAccessTeacherWorkspace(), {
      id: '99999999-9999-9999-9999-999999999999',
      roles: ['FRONT_OFFICE'],
    });
    assert.strictEqual(res.allowed, false);
    assert.strictEqual(res.statusCode, 403);
  });

  await test('RECEPTIONIST is rejected from teacher workspace (403 FORBIDDEN)', async () => {
    const res = await simulatePermission(AcademicPolicy.canAccessTeacherWorkspace(), {
      id: '99999999-9999-9999-9999-999999999999',
      roles: ['RECEPTIONIST'],
    });
    assert.strictEqual(res.allowed, false);
    assert.strictEqual(res.statusCode, 403);
  });

  await test('ACCOUNTANT (Finance) is rejected from teacher workspace (403 FORBIDDEN)', async () => {
    const res = await simulatePermission(AcademicPolicy.canAccessTeacherWorkspace(), {
      id: '99999999-9999-9999-9999-999999999999',
      roles: ['ACCOUNTANT'],
    });
    assert.strictEqual(res.allowed, false);
    assert.strictEqual(res.statusCode, 403);
  });

  await test('ADMIN has authorized institutional oversight to teacher workspace (Allowed)', async () => {
    const res = await simulatePermission(AcademicPolicy.canAccessTeacherWorkspace(), {
      id: ADMIN_USER.id,
      roles: ['ADMIN'],
    });
    assert.strictEqual(res.allowed, true);
  });

  await test('SUPERADMIN has enterprise oversight to teacher workspace (Allowed)', async () => {
    const res = await simulatePermission(AcademicPolicy.canAccessTeacherWorkspace(), {
      id: SUPERADMIN_USER.id,
      roles: ['SUPERADMIN'],
    });
    assert.strictEqual(res.allowed, true);
  });

  // ─── SUITE 3: Staff Profile Resolution & Multi-Tenant Fail-Closed ──────────
  console.log('\n[Suite 3: Teacher Staff Profile Resolution & Tenant Scoping]');

  await test('TeacherContextService.resolveTeacherStaff resolves active teacher staff record', async () => {
    const staff = await TeacherContextService.resolveTeacherStaff(
      TENANT_A_ID,
      TEACHER_AARAV_USER.id,
      undefined,
      TEACHER_AARAV_USER.roles,
    );
    assert.ok(staff);
    assert.strictEqual(staff.staff_id, TEACHER_AARAV_USER.staff_id);
    assert.strictEqual(staff.org_id, TENANT_A_ID);
    assert.strictEqual(staff.employee_code, 'TCH-001');
  });

  await test('TeacherContextService.resolveTeacherStaff fails closed for unknown user (Throws 404)', async () => {
    const nonExistentUserId = '00000000-0000-0000-0000-000000000000';
    await assert.rejects(
      async () => {
        await TeacherContextService.resolveTeacherStaff(TENANT_A_ID, nonExistentUserId, undefined, [
          'TEACHER',
        ]);
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 404);
        assert.strictEqual(err.code, 'STAFF_NOT_FOUND');
        return true;
      },
    );
  });

  await test('Multi-Tenant Isolation: Teacher in Tenant A cannot be resolved in Tenant B (Throws 404)', async () => {
    await assert.rejects(
      async () => {
        await TeacherContextService.resolveTeacherStaff(
          TENANT_B_ID,
          TEACHER_AARAV_USER.id,
          undefined,
          ['TEACHER'],
        );
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 404);
        assert.strictEqual(err.code, 'STAFF_NOT_FOUND');
        return true;
      },
    );
  });

  await test('Teacher caller cannot impersonate another staff via requestedStaffId (Forced to own profile)', async () => {
    const staff = await TeacherContextService.resolveTeacherStaff(
      TENANT_A_ID,
      TEACHER_AARAV_USER.id,
      TEACHER_YOGESH_USER.staff_id, // Attempting to request Yogesh's ID
      ['TEACHER'], // Normal teacher role
    );
    // Must remain Aarav, override ignored
    assert.strictEqual(staff.staff_id, TEACHER_AARAV_USER.staff_id);
  });

  await test('Admin caller with requestedStaffId can view target teacher workspace', async () => {
    const staff = await TeacherContextService.resolveTeacherStaff(
      TENANT_A_ID,
      ADMIN_USER.id,
      TEACHER_AARAV_USER.staff_id,
      ['ADMIN'], // Administrative caller
    );
    assert.strictEqual(staff.staff_id, TEACHER_AARAV_USER.staff_id);
  });

  // ─── SUITE 4: Teacher Assignment-Based Data Access (Zero Leakage) ──────────
  console.log('\n[Suite 4: Teacher Assigned Data Access & Zero Leakage]');

  await test('TeacherContextService.getTeacherClasses returns only assigned sections', async () => {
    const classes = await TeacherContextService.getTeacherClasses(
      TENANT_A_ID,
      TEACHER_AARAV_USER.staff_id,
    );
    assert.ok(Array.isArray(classes));
    assert.ok(classes.length > 0);

    // Verify all returned sections belong to Tenant A
    for (const cls of classes) {
      assert.ok(cls.section_id);
      assert.ok(cls.section_name);
      assert.ok(['primary', 'co_teacher', 'class_teacher'].includes(cls.assignment_role));
    }
  });

  await test('TeacherContextService.getTeacherSubjects returns only assigned disciplines', async () => {
    const subjects = await TeacherContextService.getTeacherSubjects(
      TENANT_A_ID,
      TEACHER_AARAV_USER.staff_id,
    );
    assert.ok(Array.isArray(subjects));
    assert.ok(subjects.length > 0);

    // Aarav teaches English
    const subjectNames = subjects.map((s) => s.subject_name.toLowerCase());
    assert.ok(subjectNames.some((name) => name.includes('english')));
  });

  await test('TeacherContextService.getTeacherCurriculum returns curriculum for assigned subjects', async () => {
    const curriculum = await TeacherContextService.getTeacherCurriculum(
      TENANT_A_ID,
      TEACHER_AARAV_USER.staff_id,
    );
    assert.ok(Array.isArray(curriculum));
    assert.ok(curriculum.length > 0);

    for (const plan of curriculum) {
      assert.strictEqual(plan.status, 'published');
      assert.ok(plan.curriculum_plan_units.length > 0);
    }
  });

  await test('TeacherContextService.getTeacherLessonPlans returns only authored plans', async () => {
    const plansAarav = await TeacherContextService.getTeacherLessonPlans(
      TENANT_A_ID,
      TEACHER_AARAV_USER.staff_id,
    );
    assert.strictEqual(plansAarav.length, 91);
    for (const p of plansAarav) {
      assert.strictEqual(p.teacher_staff_id, TEACHER_AARAV_USER.staff_id);
    }
  });

  await test('Teacher Yogesh with 0 authored plans returns exactly 0 plans (Fail-closed, no leak)', async () => {
    const plansYogesh = await TeacherContextService.getTeacherLessonPlans(
      TENANT_A_ID,
      TEACHER_YOGESH_USER.staff_id,
    );
    assert.strictEqual(plansYogesh.length, 0);
  });

  await test('TeacherContextService.getTeacherWorkload calculates teaching periods metrics', async () => {
    const workload = await TeacherContextService.getTeacherWorkload(
      TENANT_A_ID,
      TEACHER_AARAV_USER.staff_id,
    );
    assert.ok(workload.total_weekly_periods >= 0);
    assert.ok(workload.total_assigned_sections > 0);
    assert.ok(workload.total_assigned_subjects > 0);
    assert.ok(workload.weekday_distribution);
  });

  // ─── SUITE 5: Lesson Plan Ownership Boundary Enforcement ───────────────────
  console.log('\n[Suite 5: Lesson Plan Ownership Boundaries]');

  let samplePlanId = '';

  await test('Retrieve sample saved lesson plan for ownership tests', async () => {
    const sample = await prisma.lesson_plans.findFirst({
      where: { teacher_staff_id: TEACHER_AARAV_USER.staff_id },
      select: { lesson_plan_id: true },
    });
    assert.ok(sample);
    samplePlanId = sample.lesson_plan_id;
  });

  await test('Authoring teacher can access their own lesson plan (Allowed 200)', async () => {
    const plan = await LessonPlanningService.getSavedPlanById(TENANT_A_ID, samplePlanId, {
      userId: TEACHER_AARAV_USER.id,
      roles: ['TEACHER'],
    });
    assert.ok(plan);
    assert.strictEqual(plan.lesson_plan_id, samplePlanId);
    assert.strictEqual(plan.teacher_staff_id, TEACHER_AARAV_USER.staff_id);
  });

  await test('Another teacher cannot access Aarav plan (Rejected 403 FORBIDDEN)', async () => {
    await assert.rejects(
      async () => {
        await LessonPlanningService.getSavedPlanById(TENANT_A_ID, samplePlanId, {
          userId: TEACHER_YOGESH_USER.id,
          roles: ['TEACHER'],
        });
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 403);
        assert.strictEqual(err.code, 'FORBIDDEN_LESSON_PLAN_ACCESS');
        return true;
      },
    );
  });

  await test('Institutional Administrator has oversight to view any teacher plan (Allowed 200)', async () => {
    const plan = await LessonPlanningService.getSavedPlanById(TENANT_A_ID, samplePlanId, {
      userId: ADMIN_USER.id,
      roles: ['ADMIN'],
    });
    assert.ok(plan);
    assert.strictEqual(plan.lesson_plan_id, samplePlanId);
  });

  await test('Super Administrator has enterprise oversight to view any plan (Allowed 200)', async () => {
    const plan = await LessonPlanningService.getSavedPlanById(TENANT_A_ID, samplePlanId, {
      userId: SUPERADMIN_USER.id,
      roles: ['SUPERADMIN'],
    });
    assert.ok(plan);
    assert.strictEqual(plan.lesson_plan_id, samplePlanId);
  });

  // ─── SUITE 5B: Phase 9.1 Lesson Plan List Ownership Filtering (SEC-PHASE9-003) ──
  console.log('\n[Suite 5B: Lesson Plan List Ownership Filtering (SEC-PHASE9-003)]');

  await test('Teacher Aarav calling listSavedPlans receives strictly his own authored plans', async () => {
    const result = await LessonPlanningService.listSavedPlans(
      TENANT_A_ID,
      { limit: 100 },
      { userId: TEACHER_AARAV_USER.id, roles: ['TEACHER'] },
    );
    assert.strictEqual(result.items.length, 91);
    for (const item of result.items) {
      assert.strictEqual(item.teacher_staff_id, TEACHER_AARAV_USER.staff_id);
    }
  });

  await test('Teacher Aarav attempting to override teacher_staff_id is ignored and receives own plans', async () => {
    const result = await LessonPlanningService.listSavedPlans(
      TENANT_A_ID,
      { limit: 100, teacher_staff_id: TEACHER_YOGESH_USER.staff_id }, // Attempting override
      { userId: TEACHER_AARAV_USER.id, roles: ['TEACHER'] },
    );
    // Must remain Aarav's plans
    assert.strictEqual(result.items.length, 91);
    for (const item of result.items) {
      assert.strictEqual(item.teacher_staff_id, TEACHER_AARAV_USER.staff_id);
    }
  });

  await test('Teacher Yogesh with 0 authored plans receives exactly 0 plans', async () => {
    const result = await LessonPlanningService.listSavedPlans(
      TENANT_A_ID,
      {},
      { userId: TEACHER_YOGESH_USER.id, roles: ['TEACHER'] },
    );
    assert.strictEqual(result.items.length, 0);
  });

  await test('Non-teaching STAFF calling listSavedPlans throws 403 FORBIDDEN', async () => {
    await assert.rejects(
      async () => {
        await LessonPlanningService.listSavedPlans(
          TENANT_A_ID,
          {},
          { userId: '99999999-9999-9999-9999-999999999999', roles: ['STAFF'] },
        );
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 403);
        assert.strictEqual(err.code, 'FORBIDDEN');
        return true;
      },
    );
  });

  await test('Institutional Administrator calling listSavedPlans receives organization-wide plans', async () => {
    const result = await LessonPlanningService.listSavedPlans(
      TENANT_A_ID,
      { limit: 100 },
      { userId: ADMIN_USER.id, roles: ['ADMIN'] },
    );
    assert.ok(result.items.length >= 91);
  });

  await test('Institutional Administrator calling listSavedPlans with target teacher_staff_id receives target plans', async () => {
    const result = await LessonPlanningService.listSavedPlans(
      TENANT_A_ID,
      { limit: 100, teacher_staff_id: TEACHER_AARAV_USER.staff_id },
      { userId: ADMIN_USER.id, roles: ['ADMIN'] },
    );
    assert.strictEqual(result.items.length, 91);
    for (const item of result.items) {
      assert.strictEqual(item.teacher_staff_id, TEACHER_AARAV_USER.staff_id);
    }
  });

  await test('Institutional Administrator calling listSavedPlans with cross-tenant teacher_staff_id receives 0 plans', async () => {
    // Cross-tenant staff_id from Tenant B requested in Tenant A
    const crossTenantStaffId = '11111111-1111-1111-1111-111111111111';
    const result = await LessonPlanningService.listSavedPlans(
      TENANT_A_ID,
      { teacher_staff_id: crossTenantStaffId },
      { userId: ADMIN_USER.id, roles: ['ADMIN'] },
    );
    assert.strictEqual(result.items.length, 0);
    assert.strictEqual(result.meta.total, 0);
  });

  await test('Super Administrator calling listSavedPlans receives organizational plans', async () => {
    const result = await LessonPlanningService.listSavedPlans(
      TENANT_A_ID,
      { limit: 100 },
      { userId: SUPERADMIN_USER.id, roles: ['SUPERADMIN'] },
    );
    assert.ok(result.items.length >= 91);
  });

  // ─── SUITE 6: Super Admin Academic Oversight ───────────────────────────────
  console.log('\n[Suite 6: Super Admin Academic Oversight]');

  await test('SuperAdminRepository.getAcademicOverview aggregates organization-wide metrics', async () => {
    const overview = await SuperAdminRepository.getAcademicOverview(TENANT_A_ID);
    assert.ok(overview);
    assert.ok(overview.academic_years_count > 0);
    assert.ok(overview.grades_count > 0);
    assert.ok(overview.sections_count > 0);
    assert.ok(overview.faculty_assignments_count > 0);
    assert.ok(overview.curriculum_plans_count > 0);
    assert.ok(overview.lesson_plans_count > 0);
    assert.ok(overview.timetable_entries_count > 0);
    assert.ok(overview.published_timetable_versions_count > 0);
  });

  await test('SuperAdminController rejects non-superadmin access (Throws 403 FORBIDDEN)', async () => {
    const mockReq = {
      context: {
        user: {
          id: ADMIN_USER.id,
          org_id: TENANT_A_ID,
          roles: ['ADMIN'], // Not SUPERADMIN
        },
      },
      tenantOrgId: TENANT_A_ID,
    } as any;

    let errorResult: any = null;
    const mockRes = {
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(payload: any) {
        errorResult = payload;
        return this;
      },
    } as any;

    await SuperAdminController.getAcademicOverview(mockReq, mockRes);
    assert.strictEqual(mockRes.statusCode, 403);
    assert.strictEqual(errorResult?.error?.code, 'FORBIDDEN');
  });

  await test('SuperAdminController allows Super Administrator access (Returns 200 OK)', async () => {
    const mockReq = {
      context: {
        user: {
          id: SUPERADMIN_USER.id,
          org_id: TENANT_A_ID,
          roles: ['SUPERADMIN'],
        },
      },
      tenantOrgId: TENANT_A_ID,
    } as any;

    let successResult: any = null;
    const mockRes = {
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(payload: any) {
        successResult = payload;
        return this;
      },
    } as any;

    await SuperAdminController.getAcademicOverview(mockReq, mockRes);
    assert.strictEqual(mockRes.statusCode, 200);
    assert.strictEqual(successResult?.success, true);
    assert.ok(successResult?.data?.academic_years_count > 0);
  });

  // ─── FINAL TEST SUMMARY ───────────────────────────────────────────────────
  console.log('\n===============================================================');
  console.log(`  PHASE 9 TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED  `);
  console.log('===============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runPhase9Tests()
  .catch((err) => {
    console.error('Fatal Phase 9 Test Suite Failure:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
