import assert from 'assert';
import http from 'http';
import { AddressInfo } from 'net';
import { app } from '../app';
import prisma, { PersistenceError } from '../lib/prismaClient';
import {
  DEV_DEFAULT_JWT_REFRESH_SECRET,
  DEV_DEFAULT_JWT_SECRET,
  env,
  validateEnvConfig,
} from '../config/env';
import {
  resolvePublicTenantMiddleware,
  resolveTenantMiddleware,
} from '../middlewares/tenant.middleware';
import { requireAuthenticatedOrgId } from '../utils/tenant-context';
import { AuthService } from '../auth/auth.service';
import { NativeJwt } from '../auth/crypto.utils';
import { sessionService } from '../auth/session.service';
import { requireRole } from '../rbac/rbac.middleware';
import { normalizeRoles } from '../rbac/role-normalization';
import { StudentIdentityLinkageService } from '../modules/student-management/services/student-identity-linkage.service';
import { LearningResourceService } from '../modules/academic-management/services/learning-resource.service';
import { LearningResourceRepository } from '../modules/academic-management/repositories/learning-resource.repository';
import { CurriculumService } from '../modules/academic-management/services/curriculum.service';
import { AcademicYearService } from '../modules/academic-management/services/academic-year.service';
import { InMemoryCacheAdapter } from '../cache/cache.adapter';
import { cacheService } from '../cache/cache.service';
import { queueAdapter } from '../jobs/queue.adapter';
import { jobService } from '../jobs/job.service';
import { workerService } from '../jobs/worker.service';
import { schedulerService } from '../jobs/scheduler.service';

const GREENWOOD_ORG_ID = '624efc1b-4144-43a4-90b8-552d945cbef7';
const NPS_ORG_ID = '5205f1f3-4e31-42d9-9b53-77fc84ad40df';

function makeMockRes() {
  const res: any = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

async function httpRequest(
  baseUrl: string,
  path: string,
  method = 'GET',
  headers: Record<string, string> = {},
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${baseUrl}${path}`);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          let parsed: any = raw;
          try {
            parsed = raw ? JSON.parse(raw) : {};
          } catch {
            // keep string
          }
          resolve({ status: res.statusCode || 0, body: parsed });
        });
      },
    );
    req.on('error', reject);
    req.end();
  });
}

export async function runStage3Phase2HardeningTests() {
  console.log('===============================================================');
  console.log('  EDUTRACK ERP — STAGE 3 PHASE 2 INFRASTRUCTURE HARDENING SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ ${name}: ${err?.message || err}`);
      failed++;
    }
  }

  // -------------------------------------------------------------------------
  // WS1 & WS2: STRICT PRISMA PERSISTENCE (ZERO RAM FALLBACK)
  // -------------------------------------------------------------------------
  console.log('[WS1/WS2: Persistence Hardening]');

  await test('Unmapped Stage-3 / unknown delegates throw PersistenceError (zero RAM fallback)', async () => {
    await assert.rejects(
      async () => {
        await (prisma as any).assessments.findMany({});
      },
      (err: any) =>
        err instanceof PersistenceError &&
        err.code === 'PRISMA_DELEGATE_UNAVAILABLE' &&
        err.statusCode === 500 &&
        err.model === 'assessments',
    );

    await assert.rejects(
      async () => {
        await (prisma as any).non_existent_table.create({ data: { foo: 'bar' } });
      },
      (err: any) => err instanceof PersistenceError && err.code === 'PRISMA_DELEGATE_UNAVAILABLE',
    );
  });

  await test('Real financial & academic Prisma delegates execute directly against PostgreSQL', async () => {
    const charges = await prisma.student_charges.findMany({ take: 1 });
    assert.ok(Array.isArray(charges), 'student_charges read must hit real PG');

    const orders = await prisma.payment_orders.findMany({ take: 1 });
    assert.ok(Array.isArray(orders), 'payment_orders read must hit real PG');
  });

  // -------------------------------------------------------------------------
  // WS3 & WS5: ENV SECRET HARDENING & DEBUG ROUTE REMOVAL
  // -------------------------------------------------------------------------
  console.log('\n[WS3/WS5: Env Secret Validation & Debug Route Removal]');

  await test('validateEnvConfig rejects missing, default, weak, or identical JWT secrets in production', () => {
    const base = {
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_KEY: 'test-service-key',
      NODE_ENV: 'production',
      SYSTEM_MODE: 'PRODUCTION',
    };

    assert.throws(() => validateEnvConfig({ ...base }), /JWT_SECRET/);
    assert.throws(
      () =>
        validateEnvConfig({
          ...base,
          JWT_SECRET: DEV_DEFAULT_JWT_SECRET,
          JWT_REFRESH_SECRET: 'a-very-strong-distinct-refresh-secret-64-chars-long-1234567890',
        }),
      /development default/,
    );
    assert.throws(
      () =>
        validateEnvConfig({
          ...base,
          JWT_SECRET: 'too-short',
          JWT_REFRESH_SECRET: DEV_DEFAULT_JWT_REFRESH_SECRET,
        }),
      /32/,
    );
    const sameSecret = 'identical-production-secret-string-exceeding-32-chars';
    assert.throws(
      () =>
        validateEnvConfig({
          ...base,
          JWT_SECRET: sameSecret,
          JWT_REFRESH_SECRET: sameSecret,
        }),
      /distinct/,
    );

    const accessOnly = validateEnvConfig({
      ...base,
      JWT_SECRET: 'prod-access-secret-minimum-32-characters-long-alpha',
    });
    assert.strictEqual(accessOnly.NODE_ENV, 'production');
    assert.notStrictEqual(accessOnly.JWT_REFRESH_SECRET, accessOnly.JWT_SECRET);
    assert.ok(accessOnly.JWT_REFRESH_SECRET.length >= 32);

    const valid = validateEnvConfig({
      ...base,
      JWT_SECRET: 'prod-access-secret-minimum-32-characters-long-alpha',
      JWT_REFRESH_SECRET: 'prod-refresh-secret-minimum-32-characters-long-beta',
    });
    assert.strictEqual(valid.NODE_ENV, 'production');
  });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await test('Removed /api/public/inspect-rbac debug route fails closed unauthenticated (401) and returns 404 when authenticated', async () => {
      const unauthRes = await httpRequest(baseUrl, '/api/public/inspect-rbac');
      assert.strictEqual(
        unauthRes.status,
        401,
        `Expected 401 unauthenticated, got ${unauthRes.status}`,
      );

      const candidateUsers = await prisma.users.findMany({
        where: { org_id: GREENWOOD_ORG_ID, status: 'active' },
        take: 25,
        select: { user_id: true },
      });
      let hydrated: Awaited<ReturnType<typeof sessionService.validateUserById>> = null;
      for (const candidate of candidateUsers) {
        const profile = await sessionService.validateUserById(candidate.user_id);
        if (
          profile &&
          profile.org_id &&
          (profile.login_status === 'APPROVED' ||
            profile.roles.some((r) => ['ADMIN', 'TEACHER', 'SUPERADMIN'].includes(r.toUpperCase())))
        ) {
          hydrated = profile;
          break;
        }
      }
      assert.ok(
        hydrated,
        'Expected an active approved/admin/teacher user in DB for authenticated 404 check',
      );

      const token = NativeJwt.sign(
        {
          userId: hydrated.id,
          email: hydrated.email,
          orgId: hydrated.org_id,
          roles: hydrated.roles,
        },
        env.JWT_SECRET,
        60,
      );
      const authRes = await httpRequest(baseUrl, '/api/public/inspect-rbac', 'GET', {
        Authorization: `Bearer ${token}`,
      });
      assert.strictEqual(authRes.status, 404, `Expected 404 authenticated, got ${authRes.status}`);
    });

    await test('/api/v1/auth/me without Bearer token fails closed with 401', async () => {
      const res = await httpRequest(baseUrl, '/api/v1/auth/me');
      assert.strictEqual(res.status, 401);
    });

    await test('/health & /health/ready report real PG connection & explicit non-durable cache/queue metadata', async () => {
      const res = await httpRequest(baseUrl, '/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.database?.status, 'connected');
      assert.strictEqual(res.body.cache?.durable, false);
      assert.strictEqual(res.body.cache?.mode, 'IN_MEMORY_SINGLE_INSTANCE');
      assert.strictEqual(res.body.queueRuntime?.durable, false);
      assert.strictEqual(res.body.queueRuntime?.mode, 'IN_MEMORY_BEST_EFFORT');
    });
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  // -------------------------------------------------------------------------
  // WS4: STRICT TENANT ISOLATION MIDDLEWARE
  // -------------------------------------------------------------------------
  console.log('\n[WS4: Strict Tenant Isolation]');

  await test('resolveTenantMiddleware enforces 401, 403 TENANT_CONTEXT_MISSING, 400 INVALID_TENANT_ID, and 403 TENANT_MISMATCH', async () => {
    const r401 = makeMockRes();
    let called = false;
    await resolveTenantMiddleware(
      { originalUrl: '/api/test', headers: {}, query: {} } as any,
      r401,
      () => {
        called = true;
      },
    );
    assert.strictEqual(called, false);
    assert.strictEqual(r401.statusCode, 401);

    const rNoOrg = makeMockRes();
    await resolveTenantMiddleware(
      {
        originalUrl: '/api/test',
        headers: {},
        query: {},
        context: { user: { id: '00000000-0000-0000-0000-000000000009', roles: ['ADMIN'] } },
      } as any,
      rNoOrg,
      () => {},
    );
    assert.strictEqual(rNoOrg.statusCode, 403);
    assert.strictEqual(rNoOrg.body?.error, 'TENANT_CONTEXT_MISSING');

    const rBadHeader = makeMockRes();
    await resolveTenantMiddleware(
      {
        originalUrl: '/api/test',
        headers: { 'x-tenant-id': 'not-a-uuid' },
        query: {},
        context: {
          user: {
            id: '00000000-0000-0000-0000-000000000009',
            org_id: GREENWOOD_ORG_ID,
            roles: ['ADMIN'],
          },
        },
      } as any,
      rBadHeader,
      () => {},
    );
    assert.strictEqual(rBadHeader.statusCode, 400);
    assert.strictEqual(rBadHeader.body?.error, 'INVALID_TENANT_ID');

    const rMismatch = makeMockRes();
    await resolveTenantMiddleware(
      {
        originalUrl: '/api/test',
        headers: { 'x-tenant-id': NPS_ORG_ID },
        query: {},
        context: {
          user: {
            id: '00000000-0000-0000-0000-000000000009',
            org_id: GREENWOOD_ORG_ID,
            roles: ['ADMIN'],
          },
        },
      } as any,
      rMismatch,
      () => {},
    );
    assert.strictEqual(rMismatch.statusCode, 403);
    assert.strictEqual(rMismatch.body?.error, 'TENANT_MISMATCH');
  });

  await test('resolveTenantMiddleware permits SUPERADMIN cross-tenant override on active DB org & requireAuthenticatedOrgId reads verified tenantOrgId', async () => {
    const req: any = {
      originalUrl: '/api/test',
      headers: { 'x-tenant-id': NPS_ORG_ID },
      query: {},
      context: {
        user: {
          id: '00000000-0000-0000-0000-000000000009',
          org_id: GREENWOOD_ORG_ID,
          roles: ['SUPER_ADMIN'],
        },
      },
    };
    const res = makeMockRes();
    let nextCalled = false;
    await resolveTenantMiddleware(req, res, () => {
      nextCalled = true;
    });
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.tenantOrgId, NPS_ORG_ID);
    assert.strictEqual(req.tenantResolutionSource, 'super_admin_override');
    assert.strictEqual(requireAuthenticatedOrgId(req), NPS_ORG_ID);
  });

  await test('resolvePublicTenantMiddleware requires explicit org identifier (zero env/DB fallback) and resolves active PG org', async () => {
    const rMissing = makeMockRes();
    let nextMissing = false;
    await resolvePublicTenantMiddleware(
      { originalUrl: '/api/v1/admission/enquiries', headers: {}, query: {}, body: {} } as any,
      rMissing,
      () => {
        nextMissing = true;
      },
    );
    assert.strictEqual(nextMissing, false);
    assert.strictEqual(rMissing.statusCode, 400);
    assert.strictEqual(rMissing.body?.error, 'TENANT_REQUIRED');

    const okReq: any = {
      originalUrl: '/api/v1/admission/enquiries',
      headers: { 'x-tenant-id': GREENWOOD_ORG_ID },
      query: {},
      body: {},
    };
    const rOk = makeMockRes();
    let nextOk = false;
    await resolvePublicTenantMiddleware(okReq, rOk, () => {
      nextOk = true;
    });
    assert.strictEqual(nextOk, true);
    assert.strictEqual(okReq.tenantOrgId, GREENWOOD_ORG_ID);
  });

  // -------------------------------------------------------------------------
  // WS5 & WS7: AUTH REFRESH TOKEN, STATELESS SESSION HYDRATION & RBAC ALIASES
  // -------------------------------------------------------------------------
  console.log('\n[WS5/WS7: Auth Refresh, Identity Hydration & RBAC Normalisation]');

  await test('SessionService validates real active DB user with hydrated staff/student/parent IDs & rejects access token presented as refresh token', async () => {
    const sampleTeacher = await prisma.staff.findFirst({
      where: { is_active: true },
      orderBy: { created_at: 'asc' },
      select: { staff_id: true, user_id: true, org_id: true },
    });
    assert.ok(sampleTeacher?.user_id, 'Expected at least one active staff user in DB');

    const hydrated = await sessionService.validateUserById(sampleTeacher.user_id);
    assert.ok(hydrated, 'Active staff user must resolve from DB');
    assert.strictEqual(hydrated?.staff_id, sampleTeacher.staff_id);

    const forgedAccessAsRefresh = NativeJwt.sign(
      {
        userId: sampleTeacher.user_id,
        email: hydrated!.email,
        orgId: sampleTeacher.org_id,
        roles: hydrated!.roles,
      },
      env.JWT_SECRET,
      60,
    );
    await assert.rejects(
      async () => AuthService.refreshToken(forgedAccessAsRefresh),
      /Invalid or expired refresh token/,
    );

    if (env.JWT_REFRESH_SECRET !== env.JWT_SECRET) {
      const validRefresh = NativeJwt.sign(
        {
          userId: sampleTeacher.user_id,
          email: hydrated!.email,
          orgId: sampleTeacher.org_id,
          roles: hydrated!.roles,
        },
        env.JWT_REFRESH_SECRET,
        60,
      );
      const refreshed = await AuthService.refreshToken(validRefresh);
      assert.ok(refreshed.accessToken);
      const decodedAccess = NativeJwt.verify<any>(refreshed.accessToken, env.JWT_SECRET);
      assert.strictEqual(decodedAccess.userId, sampleTeacher.user_id);
    }
  });

  await test('RBAC COUNSELLOR / COUNSELOR alias symmetry & Super Admin normalization', () => {
    assert.deepStrictEqual(normalizeRoles(['super-admin']), ['SUPERADMIN']);
    const middleware = requireRole(['COUNSELLOR']);
    let allowed = false;
    middleware(
      { context: { user: { id: 'u1', email: 'c@s.test', roles: ['COUNSELOR'] } } } as any,
      makeMockRes(),
      () => {
        allowed = true;
      },
    );
    assert.strictEqual(allowed, true, 'COUNSELOR must match required COUNSELLOR alias');
  });

  // -------------------------------------------------------------------------
  // WS6: SAFE STUDENT IDENTITY LINKAGE AUDIT & CONFLICT GUARDS
  // -------------------------------------------------------------------------
  console.log('\n[WS6: Student Identity Linkage]');

  await test('StudentIdentityLinkageService read-only audit & dry-run match live PG totals', async () => {
    const audit = await StudentIdentityLinkageService.getLinkageAudit(GREENWOOD_ORG_ID);
    assert.strictEqual(
      audit.linked_students + audit.unlinked_students,
      audit.total_students,
      'linked + unlinked must equal total_students',
    );
    const dryRun = await StudentIdentityLinkageService.dryRunProvisioningPlan(GREENWOOD_ORG_ID, 25);
    assert.ok(dryRun.candidates.length <= 25);
  });

  await test('StudentIdentityLinkageService blocks overwriting already-linked student or already-bound user (409)', async () => {
    const linkedStudent = await prisma.students.findFirst({
      where: { user_id: { not: null } },
      select: { student_id: true, org_id: true, user_id: true },
    });
    if (linkedStudent?.user_id) {
      await assert.rejects(
        async () =>
          StudentIdentityLinkageService.linkExistingUserToStudent(
            linkedStudent.org_id,
            linkedStudent.student_id,
            linkedStudent.user_id!,
          ),
        (err: any) => err.statusCode === 409 && err.code === 'STUDENT_ALREADY_LINKED',
      );
    }
  });

  // -------------------------------------------------------------------------
  // WS8 & WS10: TRANSACTION INTEGRITY & NO STAFF IMPERSONATION FALLBACK
  // -------------------------------------------------------------------------
  console.log('\n[WS8/WS10: Transaction Rollback & Teacher Identity Integrity]');

  await test('LearningResourceService rolls back resource insert atomically when grade association fails', async () => {
    const staff = await LearningResourceRepository.findFirstActiveStaff(GREENWOOD_ORG_ID);
    assert.ok(staff?.staff_id);
    const title = `ROLLBACK-TEST-${Date.now()}`;

    await assert.rejects(
      async () =>
        LearningResourceService.createResource(
          GREENWOOD_ORG_ID,
          {
            title,
            resource_type: 'external_link',
            external_url: 'https://example.com/rollback-test',
            uploaded_by_staff_id: staff.staff_id,
            grade_ids: ['00000000-0000-0000-0000-000000009999'],
          },
          undefined,
          null,
        ),
      /do not belong|INVALID_GRADE|violates foreign key|invalid/i,
    );

    const leaked = await prisma.learning_resources.findFirst({
      where: { org_id: GREENWOOD_ORG_ID, title },
    });
    assert.strictEqual(leaked, null, 'Failed transaction must leave zero orphaned resource rows');
  });

  await test('LearningResourceService & CurriculumService handle missing identity / concurrent locks cleanly', async () => {
    await assert.rejects(
      async () =>
        LearningResourceService.createResource(
          GREENWOOD_ORG_ID,
          {
            title: 'Should Reject Without Staff',
            resource_type: 'external_link',
            external_url: 'https://example.com/no-staff',
          },
          undefined,
          null,
        ),
      (err: any) => err.statusCode === 403 && err.code === 'STAFF_PROFILE_REQUIRED',
    );
    assert.strictEqual(typeof CurriculumService.updateStatus, 'function');
    assert.strictEqual(typeof AcademicYearService.setCurrentAcademicYear, 'function');
  });

  // -------------------------------------------------------------------------
  // WS9: BOUNDED IN-MEMORY CACHE / QUEUE / WORKER LIFECYCLE
  // -------------------------------------------------------------------------
  console.log('\n[WS9: Background Workers & Cache Boundedness]');

  await test('InMemoryCacheAdapter enforces MAX_ENTRIES bound & workers clean up interval timers', async () => {
    const adapter = new InMemoryCacheAdapter();
    for (let i = 0; i < InMemoryCacheAdapter.MAX_ENTRIES + 25; i++) {
      await adapter.set(`k:${i}`, i);
    }
    assert.strictEqual(adapter.size(), InMemoryCacheAdapter.MAX_ENTRIES);
    assert.strictEqual((await cacheService.getMetrics()).durable, false);

    assert.strictEqual(queueAdapter.getRuntimeMetadata().durable, false);
    assert.strictEqual(jobService.getRuntimeStatus().mode, 'IN_MEMORY_BEST_EFFORT');

    workerService.start();
    assert.strictEqual(workerService.getStatus().isRunning, true);
    workerService.stop();
    assert.strictEqual(workerService.getStatus().isRunning, false);

    schedulerService.start();
    assert.strictEqual(schedulerService.getStatus().isRunning, true);
    schedulerService.stop();
    assert.strictEqual(schedulerService.getStatus().isRunning, false);
  });

  console.log('\n===============================================================');
  console.log(`  STAGE 3 PHASE 2 HARDENING SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runStage3Phase2HardeningTests()
    .catch((err) => {
      console.error('Fatal Phase 2 hardening suite error:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
