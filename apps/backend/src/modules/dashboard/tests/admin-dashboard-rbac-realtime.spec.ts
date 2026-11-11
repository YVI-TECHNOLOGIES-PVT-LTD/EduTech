import assert from 'assert';
import http from 'http';
import { AddressInfo } from 'net';
import { WebSocket } from 'ws';
import { app } from '../../../app';
import prisma from '../../../lib/prismaClient';
import { normalizeRoleName, normalizeRoles } from '../../../rbac/role-normalization';
import { SessionService, sessionService, UserProfile } from '../../../auth/session.service';
import { NativeJwt } from '../../../auth/crypto.utils';
import { env } from '../../../config/env';
import { checkPermission, getEffectiveRoles } from '../../../rbac/rbac.middleware';
import { checkLoginApproval } from '../../../auth/auth.middleware';
import { PERMISSIONS } from '../../../rbac/permissions';
import { realtimeNotificationServer } from '../../notifications/realtime/notification.realtime';

const TENANT_A_ID = '00000000-0000-4000-8000-0000000000a1';
const TENANT_B_ID = '00000000-0000-4000-8000-0000000000b2';

async function httpRequest(
  baseUrl: string,
  path: string,
  headers: Record<string, string> = {},
): Promise<{ status: number; body: any }> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'GET',
    headers,
  });
  const text = await response.text();
  let body: any = text;
  try {
    body = JSON.parse(text);
  } catch {
    // Non-JSON body
  }
  return { status: response.status, body };
}

function makeMockRes() {
  const res: any = {
    statusCode: 200,
    payload: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.payload = data;
      return this;
    },
  };
  return res;
}

export async function runAdminDashboardRbacAndRealtimeTests() {
  console.log('\n==============================================================');
  console.log('   ADMIN DASHBOARD 403, RBAC & REALTIME REGRESSION SUITE      ');
  console.log('==============================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ ${name}: ${err?.stack || err?.message || String(err)}`);
      failed++;
    }
  }

  // 1. Canonical role normalization
  await test('1. Role normalization maps all DB variants to canonical tokens', () => {
    assert.strictEqual(normalizeRoleName('Administrator'), 'ADMIN');
    assert.strictEqual(normalizeRoleName('administrator'), 'ADMIN');
    assert.strictEqual(normalizeRoleName('ADMIN'), 'ADMIN');
    assert.strictEqual(normalizeRoleName('org_admin'), 'ADMIN');
    assert.strictEqual(normalizeRoleName('org-admin'), 'ADMIN');
    assert.strictEqual(normalizeRoleName('Super Administrator'), 'SUPERADMIN');
    assert.strictEqual(normalizeRoleName('Super Admin'), 'SUPERADMIN');
    assert.strictEqual(normalizeRoleName('SUPER_ADMIN'), 'SUPERADMIN');
    assert.strictEqual(normalizeRoleName('Principal'), 'HOI');
    assert.strictEqual(normalizeRoleName('Head of Institute'), 'HOI');
    assert.strictEqual(normalizeRoleName('Faculty'), 'TEACHER');
    assert.strictEqual(normalizeRoleName('Teacher'), 'TEACHER');
    assert.strictEqual(normalizeRoleName('Receptionist'), 'FRONT_OFFICE');
    assert.strictEqual(normalizeRoleName('Front Office'), 'FRONT_OFFICE');
    assert.strictEqual(normalizeRoleName('Finance'), 'FINANCE_OFFICER');
    assert.strictEqual(normalizeRoleName('Finance Manager'), 'FINANCE_MANAGER');
    assert.strictEqual(normalizeRoleName('Accountant'), 'ACCOUNTANT');
    assert.strictEqual(normalizeRoleName('Staff'), 'STAFF');
    assert.strictEqual(normalizeRoleName('Student'), 'STUDENT');
    assert.strictEqual(normalizeRoleName('Guardian'), 'PARENT');
    assert.deepStrictEqual(normalizeRoles(['Administrator', 'ADMIN', 'admin']), ['ADMIN']);
    assert.strictEqual(SessionService.normalizeRoleName('Administrator'), 'ADMIN');
  });

  // 2. getEffectiveRoles expands raw & canonical variants
  await test('2. getEffectiveRoles handles raw DB strings and canonical role names', () => {
    const adminRoles = getEffectiveRoles(['Administrator']);
    assert.ok(adminRoles.includes('ADMIN'));
    assert.ok(adminRoles.includes('ORG_ADMIN'));

    const superRoles = getEffectiveRoles(['Super Administrator']);
    assert.ok(superRoles.includes('SUPERADMIN'));
    assert.ok(superRoles.includes('SUPER_ADMIN'));

    const hoiRoles = getEffectiveRoles(['Principal']);
    assert.ok(hoiRoles.includes('HOI'));
    assert.ok(hoiRoles.includes('PRINCIPAL'));
  });

  // 3. SessionService permission injection boundary check (read-only mocked Prisma lookups)
  await test('3. SessionService injects DASHBOARD_VIEW_ADMIN & admin.dashboard.view ONLY for Admin leadership', async () => {
    const usersAny: any = prisma.users;
    const userRolesAny: any = prisma.user_roles;
    const parentsAny: any = prisma.parents;
    const origFindUnique = usersAny.findUnique;
    const origFindUserRoles = userRolesAny.findMany;
    const origFindParent = parentsAny.findFirst;

    const buildTokenForRole = (uid: string) =>
      NativeJwt.sign(
        { userId: uid, email: `${uid}@school.test`, orgId: TENANT_A_ID, roles: [] },
        env.JWT_SECRET,
        120,
      );

    const mockRoleMap: Record<string, string> = {
      'uid-admin-raw': 'Administrator',
      'uid-hoi': 'Principal',
      'uid-teacher': 'Faculty',
      'uid-staff': 'Staff',
      'uid-front-office': 'Front Office',
      'uid-finance': 'Finance Officer',
      'uid-student': 'Student',
      'uid-parent': 'Parent',
    };

    try {
      usersAny.findUnique = async ({ where }: any) => ({
        user_id: where.user_id,
        email: `${where.user_id}@school.test`,
        org_id: TENANT_A_ID,
        first_name: 'Test',
        last_name: 'User',
        phone: null,
        country_id: null,
        countries: null,
        status: 'active',
      });
      userRolesAny.findMany = async ({ where }: any) => [
        { roles: { role_name: mockRoleMap[where.user_id], is_active: true } },
      ];
      parentsAny.findFirst = async () => null;

      const adminProfile = await sessionService.validateSession(buildTokenForRole('uid-admin-raw'));
      assert.ok(adminProfile, 'Admin session must validate');
      assert.deepStrictEqual(adminProfile!.roles, ['ADMIN']);
      assert.ok(adminProfile!.permissions.includes('DASHBOARD_VIEW_ADMIN'));
      assert.ok(adminProfile!.permissions.includes('admin.dashboard.view'));

      const hoiProfile = await sessionService.validateSession(buildTokenForRole('uid-hoi'));
      assert.ok(hoiProfile?.permissions.includes('DASHBOARD_VIEW_ADMIN'));
      assert.ok(hoiProfile?.permissions.includes('admin.dashboard.view'));

      for (const uid of [
        'uid-teacher',
        'uid-staff',
        'uid-front-office',
        'uid-finance',
        'uid-student',
        'uid-parent',
      ]) {
        const profile = await sessionService.validateSession(buildTokenForRole(uid));
        assert.ok(profile, `${uid} profile should validate`);
        assert.strictEqual(
          profile!.permissions.includes('DASHBOARD_VIEW_ADMIN'),
          false,
          `${uid} must NOT receive DASHBOARD_VIEW_ADMIN`,
        );
        assert.strictEqual(
          profile!.permissions.includes('admin.dashboard.view'),
          false,
          `${uid} must NOT receive admin.dashboard.view`,
        );
      }
    } finally {
      usersAny.findUnique = origFindUnique;
      userRolesAny.findMany = origFindUserRoles;
      parentsAny.findFirst = origFindParent;
    }
  });

  // 4. checkLoginApproval bypasses Admin/Teacher/HOI/ORG_ADMIN cleanly while gating pending Parent
  await test('4. checkLoginApproval allows normalized ADMIN/HOI/TEACHER and gates unapproved PARENT', () => {
    for (const roles of [
      ['Administrator'],
      ['ORG_ADMIN'],
      ['Principal'],
      ['Faculty'],
      ['SUPERADMIN'],
    ]) {
      let calledNext = false;
      const res = makeMockRes();
      checkLoginApproval(
        {
          path: '/dashboard/admin/overview',
          context: { user: { roles, login_status: 'PENDING' } },
        } as any,
        res,
        () => {
          calledNext = true;
        },
      );
      assert.strictEqual(calledNext, true, `Role ${roles.join(',')} should pass login approval`);
    }

    let parentNext = false;
    const parentRes = makeMockRes();
    checkLoginApproval(
      {
        path: '/dashboard/admin/overview',
        context: { user: { roles: ['PARENT'], login_status: 'PENDING' } },
      } as any,
      parentRes,
      () => {
        parentNext = true;
      },
    );
    assert.strictEqual(parentNext, false);
    assert.strictEqual(parentRes.statusCode, 403);
  });

  // 5. Real DB read verification via SessionService on an existing active user (read-only)
  await test('5. Read-only SessionService resolution against real PostgreSQL users resolves canonical roles', async () => {
    const sampleUserRole = await prisma.user_roles.findFirst({
      where: {
        users_user_roles_user_idTousers: { status: 'active' },
        roles: { is_active: true },
      },
      include: {
        users_user_roles_user_idTousers: true,
        roles: true,
      },
    });

    const dbUser = sampleUserRole?.users_user_roles_user_idTousers;
    if (dbUser && sampleUserRole?.roles) {
      const token = NativeJwt.sign(
        {
          userId: dbUser.user_id,
          email: dbUser.email,
          orgId: dbUser.org_id,
          roles: [],
          testNonce: Date.now(),
        } as any,
        env.JWT_SECRET,
        60,
      );
      const profile = await sessionService.validateSession(token);
      assert.ok(profile, 'Active DB user session must resolve');
      const expectedCanonical = normalizeRoleName(sampleUserRole.roles.role_name);
      assert.ok(
        profile!.roles.includes(expectedCanonical),
        `Expected ${expectedCanonical} in resolved roles ${profile!.roles.join(',')}`,
      );
    } else {
      console.log('    (skipped DB active user check — no active user_roles rows found)');
    }
  });

  // 6-9. Full Express HTTP + WebSocket Integration on ephemeral local server (zero DB writes)
  const server = http.createServer(app);
  realtimeNotificationServer.init(server);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  const origValidateSession = sessionService.validateSession;
  const studentsAny: any = prisma.students;
  const sectionsAny: any = prisma.sections;
  const appsAny: any = prisma.admissions_applications;
  const payAny: any = prisma.payment_transactions;

  const origStudentsCount = studentsAny.count;
  const origSectionsCount = sectionsAny.count;
  const origAppsCount = appsAny.count;
  const origPayAggregate = payAny.aggregate;

  const capturedOrgIds: string[] = [];

  try {
    const makeProfile = (
      id: string,
      roles: string[],
      permissions: string[] = [],
      orgId: string = TENANT_A_ID,
    ): UserProfile => ({
      id,
      email: `${id}@edutrack.test`,
      org_id: orgId,
      school_id: orgId,
      full_name: id,
      roles,
      permissions,
      login_status: 'APPROVED',
    });

    const sessionsByToken: Record<string, UserProfile> = {
      'tok-admin-canonical': makeProfile(
        'u-admin',
        ['ADMIN'],
        ['DASHBOARD_VIEW_ADMIN', 'admin.dashboard.view'],
      ),
      'tok-admin-raw': makeProfile('u-admin-raw', ['Administrator'], []),
      'tok-org-admin': makeProfile('u-org-admin', ['ORG_ADMIN'], ['admin.dashboard.view']),
      'tok-superadmin': makeProfile('u-superadmin', ['SUPERADMIN'], ['admin.dashboard.view']),
      'tok-hoi': makeProfile('u-hoi', ['HOI'], ['admin.dashboard.view']),
      'tok-teacher': makeProfile('u-teacher', ['TEACHER'], ['DASHBOARD_VIEW_FACULTY']),
      'tok-staff': makeProfile('u-staff', ['STAFF'], []),
      'tok-front-office': makeProfile('u-fo', ['FRONT_OFFICE'], ['admission.dashboard.view']),
      'tok-finance-unauth': makeProfile('u-fin', ['FINANCE_OFFICER'], ['fees.dashboard.view']),
      'tok-finance-explicit': makeProfile(
        'u-fin-admin',
        ['FINANCE_MANAGER'],
        ['fees.dashboard.view', 'DASHBOARD_VIEW_ADMIN'],
      ),
      'tok-student': makeProfile('u-student', ['STUDENT'], ['student.dashboard.view']),
      'tok-parent': makeProfile('u-parent', ['PARENT'], ['DASHBOARD_VIEW_PARENT']),
      'tok-no-org': makeProfile('u-noorg', ['ADMIN'], ['DASHBOARD_VIEW_ADMIN'], ''),
      'tok-tenant-b': makeProfile('u-tenant-b', ['ADMIN'], ['DASHBOARD_VIEW_ADMIN'], TENANT_B_ID),
    };

    (sessionService as any).validateSession = async (token: string) => {
      return sessionsByToken[token] || null;
    };

    studentsAny.count = async ({ where }: any) => {
      capturedOrgIds.push(where.org_id);
      return 42;
    };
    sectionsAny.count = async ({ where }: any) => {
      capturedOrgIds.push(where.academic_year_grades.academic_years.org_id);
      return 7;
    };
    appsAny.count = async ({ where }: any) => {
      capturedOrgIds.push(where.org_id);
      return where.status ? 5 : 19;
    };
    payAny.aggregate = async ({ where }: any) => {
      capturedOrgIds.push(where.payment_orders.students.org_id);
      return { _sum: { amount: 125000 } };
    };

    await test('6. GET /api/dashboard/admin/overview allows Admin/ORG_ADMIN/SuperAdmin/HOI/Administrator', async () => {
      for (const tok of [
        'tok-admin-canonical',
        'tok-admin-raw',
        'tok-org-admin',
        'tok-superadmin',
        'tok-hoi',
      ]) {
        const res = await httpRequest(baseUrl, '/dashboard/admin/overview', {
          Authorization: `Bearer ${tok}`,
        });
        assert.strictEqual(res.status, 200, `${tok} expected 200, got ${res.status}`);
        assert.strictEqual(res.body.students, 42);
        assert.strictEqual(res.body.classes, 7);
        assert.strictEqual(res.body.pendingAdmissions, 5);
        assert.strictEqual(res.body.totalApplications, 19);
        assert.strictEqual(res.body.feeCollection, 125000);
      }
    });

    await test('7. GET /api/dashboard/admin/overview & /api/admin/departments reject Teacher, Staff, Front Office, Finance, Student, Parent with 403', async () => {
      for (const tok of [
        'tok-teacher',
        'tok-staff',
        'tok-front-office',
        'tok-finance-unauth',
        'tok-student',
        'tok-parent',
      ]) {
        const overviewRes = await httpRequest(baseUrl, '/dashboard/admin/overview', {
          Authorization: `Bearer ${tok}`,
        });
        assert.strictEqual(
          overviewRes.status,
          403,
          `${tok} must get 403 on /dashboard/admin/overview, got ${overviewRes.status}`,
        );

        const adminRouteRes = await httpRequest(baseUrl, '/admin/departments', {
          Authorization: `Bearer ${tok}`,
        });
        assert.strictEqual(
          adminRouteRes.status,
          403,
          `${tok} must get 403 on /admin/departments, got ${adminRouteRes.status}`,
        );
      }

      // Finance explicitly granted DASHBOARD_VIEW_ADMIN is permitted
      const explicitFinRes = await httpRequest(baseUrl, '/dashboard/admin/overview', {
        Authorization: `Bearer tok-finance-explicit`,
      });
      assert.strictEqual(explicitFinRes.status, 200);
    });

    await test('8. Unauthenticated -> 401; missing tenant -> 403; client org_id override ignored', async () => {
      const unauthRes = await httpRequest(baseUrl, '/dashboard/admin/overview');
      assert.strictEqual(unauthRes.status, 401);

      const noOrgRes = await httpRequest(baseUrl, '/dashboard/admin/overview', {
        Authorization: 'Bearer tok-no-org',
      });
      assert.strictEqual(noOrgRes.status, 403);

      capturedOrgIds.length = 0;
      const spoofRes = await httpRequest(
        baseUrl,
        `/dashboard/admin/overview?org_id=${TENANT_B_ID}&school_id=${TENANT_B_ID}`,
        {
          Authorization: 'Bearer tok-admin-canonical',
          'x-tenant-id': TENANT_B_ID,
        },
      );
      assert.strictEqual(spoofRes.status, 200);
      assert.ok(capturedOrgIds.length > 0);
      assert.ok(
        capturedOrgIds.every((id) => id === TENANT_A_ID),
        `Expected every Prisma query to scope strictly to ${TENANT_A_ID}, got ${capturedOrgIds.join(',')}`,
      );
    });

    await test('9. Optional metric error degrades safely to 0 while total DB failure returns 500', async () => {
      const savedPay = payAny.aggregate;
      const savedStudents = studentsAny.count;
      const savedSections = sectionsAny.count;
      const savedApps = appsAny.count;

      try {
        payAny.aggregate = async () => {
          throw new Error('Transient aggregate error');
        };
        const partialRes = await httpRequest(baseUrl, '/dashboard/admin/overview', {
          Authorization: 'Bearer tok-admin-canonical',
        });
        assert.strictEqual(partialRes.status, 200);
        assert.strictEqual(partialRes.body.students, 42);
        assert.strictEqual(partialRes.body.feeCollection, 0);

        studentsAny.count = async () => {
          throw new Error('DB offline');
        };
        sectionsAny.count = async () => {
          throw new Error('DB offline');
        };
        appsAny.count = async () => {
          throw new Error('DB offline');
        };
        const downRes = await httpRequest(baseUrl, '/dashboard/admin/overview', {
          Authorization: 'Bearer tok-admin-canonical',
        });
        assert.strictEqual(downRes.status, 500);
      } finally {
        payAny.aggregate = savedPay;
        studentsAny.count = savedStudents;
        sectionsAny.count = savedSections;
        appsAny.count = savedApps;
      }
    });

    await test('10. WebSocket /ws/notifications rejects missing/invalid token with 401 and completes authenticated ack, ping/pong, tenant-isolated push & clean disconnect', async () => {
      // Unauthenticated upgrade rejection
      const missingStatus = await new Promise<number>((resolve, reject) => {
        const ws = new WebSocket(`ws://127.0.0.1:${port}/ws/notifications`);
        ws.on('unexpected-response', (_req, res) => resolve(res.statusCode || 0));
        ws.on('open', () => reject(new Error('Should not open without token')));
        ws.on('error', () => {});
      });
      assert.strictEqual(missingStatus, 401);

      const invalidStatus = await new Promise<number>((resolve, reject) => {
        const ws = new WebSocket(`ws://127.0.0.1:${port}/ws/notifications?token=invalid-jwt`);
        ws.on('unexpected-response', (_req, res) => resolve(res.statusCode || 0));
        ws.on('open', () => reject(new Error('Should not open with invalid token')));
        ws.on('error', () => {});
      });
      assert.strictEqual(invalidStatus, 401);

      // Authenticated upgrade for Tenant A Admin and Tenant B Admin
      const connectAndReadAck = (tok: string) =>
        new Promise<{ ws: WebSocket; msgs: any[] }>((resolve, reject) => {
          const msgs: any[] = [];
          const ws = new WebSocket(`ws://127.0.0.1:${port}/ws/notifications?token=${tok}`);
          ws.on('message', (raw) => {
            const parsed = JSON.parse(raw.toString());
            msgs.push(parsed);
            if (parsed.type === 'connection.ack') {
              resolve({ ws, msgs });
            }
          });
          ws.on('error', reject);
        });

      const clientA = await connectAndReadAck('tok-admin-canonical');
      const clientB = await connectAndReadAck('tok-tenant-b');

      assert.strictEqual(clientA.msgs[0].type, 'connection.ack');
      assert.strictEqual(clientA.msgs[0].orgId, TENANT_A_ID);
      assert.strictEqual(clientB.msgs[0].orgId, TENANT_B_ID);

      // Verify ping/pong
      const pongPromise = new Promise<any>((resolve) => {
        const handler = (raw: any) => {
          const parsed = JSON.parse(raw.toString());
          if (parsed.type === 'pong') {
            clientA.ws.off('message', handler);
            resolve(parsed);
          }
        };
        clientA.ws.on('message', handler);
      });
      clientA.ws.send(JSON.stringify({ type: 'ping' }));
      const pong = await pongPromise;
      assert.strictEqual(pong.type, 'pong');

      // Verify user/org scoped push
      realtimeNotificationServer.sendToUser(TENANT_A_ID, 'u-admin', {
        type: 'notification.created',
        data: { title: 'Tenant A Admin Alert' },
      });
      await new Promise((r) => setTimeout(r, 80));
      assert.ok(clientA.msgs.some((m) => m.type === 'notification.created'));
      assert.strictEqual(
        clientB.msgs.some((m) => m.type === 'notification.created'),
        false,
        'Tenant B client must NOT receive Tenant A push',
      );

      // Close cleanly and ensure active connections return to 0
      await Promise.all([
        new Promise<void>((res) => {
          clientA.ws.once('close', () => res());
          clientA.ws.close(1000, 'Test done');
        }),
        new Promise<void>((res) => {
          clientB.ws.once('close', () => res());
          clientB.ws.close(1000, 'Test done');
        }),
      ]);
      await new Promise((r) => setTimeout(r, 50));
      assert.strictEqual(realtimeNotificationServer.getConnectedCount(), 0);
    });

    // Double check middleware direct behavior when no superadmin bypass
    await test('11. Direct checkPermission returns 403 for empty/non-admin roles on DASHBOARD_VIEW_ADMIN & admin.dashboard.view', () => {
      for (const perm of [PERMISSIONS.DASHBOARD_VIEW_ADMIN, PERMISSIONS.ADMIN_DASHBOARD_VIEW]) {
        const deniedRes = makeMockRes();
        let nextCalled = false;
        checkPermission(perm)(
          {
            context: { user: { id: 'u1', email: 't@s.com', roles: ['TEACHER'], permissions: [] } },
          } as any,
          deniedRes,
          () => {
            nextCalled = true;
          },
        );
        assert.strictEqual(nextCalled, false);
        assert.strictEqual(deniedRes.statusCode, 403);
      }
    });
  } finally {
    sessionService.validateSession = origValidateSession;
    studentsAny.count = origStudentsCount;
    sectionsAny.count = origSectionsCount;
    appsAny.count = origAppsCount;
    payAny.aggregate = origPayAggregate;
    realtimeNotificationServer.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  console.log(`\n[Admin Dashboard RBAC & Realtime Suite] ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runAdminDashboardRbacAndRealtimeTests()
    .catch((err) => {
      console.error('Fatal suite failure:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
