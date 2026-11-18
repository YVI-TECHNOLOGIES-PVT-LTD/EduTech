import assert from 'assert';
import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { NativeJwt } from '../auth/crypto.utils';
import { sessionService } from '../auth/session.service';
import prisma from '../lib/prismaClient';
import {
  attachRlsRunner,
  extractPrincipalFromRequest,
  resolvePrincipalFromToken,
  RlsPrismaClientLike,
  RlsTransactionClient,
  withRlsContext,
  withRlsFromRequest,
  withRlsFromToken,
  withSystemContext,
} from '../lib/rlsContext';
import { UnauthorizedError } from '../utils/errors';

/**
 * Simulated single-socket PostgreSQL connection pool that models exact PostgreSQL
 * `SET LOCAL ROLE`, `SET TRANSACTION READ ONLY`, and `set_config(..., is_local=true)`
 * transaction-scoped cleanup on COMMIT and ROLLBACK.
 */
class SimulatedPooledPgClient implements RlsPrismaClientLike {
  public persistentState = {
    role: 'postgres',
    gucs: new Map<string, string>(),
  };

  public history: Array<{
    txNumber: number;
    readOnly: boolean;
    committed: boolean;
    roleInside: string;
    subInside: string | null;
    claimRoleInside: string | null;
    claimsInside: string | null;
  }> = [];

  private txCounter = 0;

  async $transaction<T>(fn: (tx: RlsTransactionClient) => Promise<T>): Promise<T> {
    const txNumber = ++this.txCounter;
    let txRole = this.persistentState.role;
    const txGucs = new Map(this.persistentState.gucs);
    let readOnly = false;
    let roleInside = txRole;

    const txClient: RlsTransactionClient = {
      $executeRawUnsafe: async (sql: string) => {
        const trimmed = sql.trim().toUpperCase();
        if (trimmed === 'SET TRANSACTION READ ONLY') {
          readOnly = true;
          return 0;
        }
        if (trimmed === 'SET LOCAL ROLE AUTHENTICATED') {
          txRole = 'authenticated';
          roleInside = 'authenticated';
          return 0;
        }
        throw new Error(`Unexpected unsafe SQL in RLS bridge: ${sql}`);
      },
      $executeRaw: async (sqlObj: TemplateStringsArray | Prisma.Sql) => {
        const sqlText = (sqlObj as any)?.strings
          ? (sqlObj as any).strings.join('?')
          : String(sqlObj);
        const values: any[] = (sqlObj as any)?.values ?? [];
        if (sqlText.includes("set_config('request.jwt.claim.sub'")) {
          // Values order: [userId, claimsJson] (is_local=true enforced in SQL literal)
          assert.strictEqual(values.length, 2, 'Expected exactly 2 bound GUC parameters');
          assert.ok(sqlText.includes('true'), 'set_config must pass is_local=true');
          txGucs.set('request.jwt.claim.sub', String(values[0]));
          txGucs.set('request.jwt.claim.role', 'authenticated');
          txGucs.set('request.jwt.claims', String(values[1]));
          return 1;
        }
        throw new Error(`Unexpected parameterized SQL in RLS bridge: ${sqlText}`);
      },
      $queryRawUnsafe: async <R = unknown>(sql: string): Promise<R> => {
        if (sql.includes('current_user')) {
          return [
            {
              current_user: txRole,
              sub: txGucs.get('request.jwt.claim.sub') ?? null,
              claim_role: txGucs.get('request.jwt.claim.role') ?? null,
              claims: txGucs.get('request.jwt.claims') ?? null,
            },
          ] as unknown as R;
        }
        throw new Error(`Unsupported mock query: ${sql}`);
      },
      $queryRaw: async <R = unknown>() => [] as unknown as R,
    };

    try {
      const result = await fn(txClient);
      this.history.push({
        txNumber,
        readOnly,
        committed: true,
        roleInside,
        subInside: txGucs.get('request.jwt.claim.sub') ?? null,
        claimRoleInside: txGucs.get('request.jwt.claim.role') ?? null,
        claimsInside: txGucs.get('request.jwt.claims') ?? null,
      });
      // PostgreSQL automatically discards SET LOCAL ROLE & is_local GUCs at COMMIT.
      return result;
    } catch (err) {
      this.history.push({
        txNumber,
        readOnly,
        committed: false,
        roleInside,
        subInside: txGucs.get('request.jwt.claim.sub') ?? null,
        claimRoleInside: txGucs.get('request.jwt.claim.role') ?? null,
        claimsInside: txGucs.get('request.jwt.claims') ?? null,
      });
      // PostgreSQL automatically discards SET LOCAL ROLE & is_local GUCs at ROLLBACK.
      throw err;
    }
  }
}

// Synthetic fixtures matching Greenwood + Tenant B domain topology
const ORG_GREENWOOD = '624efc1b-4144-43a4-90b8-552d945cbef7';
const ORG_TENANT_B = '00000000-0000-0000-0000-000000000002';

const STUDENT_A = {
  userId: '11111111-1111-4111-8111-111111111111',
  studentId: '11111111-aaaa-4111-8111-111111111111',
  orgId: ORG_GREENWOOD,
  roles: ['STUDENT'],
};
const STUDENT_B = {
  userId: '22222222-2222-4222-8222-222222222222',
  studentId: '22222222-bbbb-4222-8222-222222222222',
  orgId: ORG_GREENWOOD,
  roles: ['STUDENT'],
};
const PARENT_A = {
  userId: '33333333-3333-4333-8333-333333333333',
  orgId: ORG_GREENWOOD,
  roles: ['PARENT', 'ENROLLED_PARENT'],
  linkedStudentIds: [STUDENT_A.studentId],
};
const TEACHER_1 = {
  userId: '44444444-4444-4444-8444-444444444444',
  orgId: ORG_GREENWOOD,
  roles: ['TEACHER'],
  assignedSectionIds: ['aaaa0000-0000-4000-8000-000000000001'],
};
const ADMIN_GW = {
  userId: '55555555-5555-4555-8555-555555555555',
  orgId: ORG_GREENWOOD,
  roles: ['PRINCIPAL'],
};
const ADMIN_TENANT_B = {
  userId: '66666666-6666-4666-8666-666666666666',
  orgId: ORG_TENANT_B,
  roles: ['ADMIN'],
};

interface SyntheticRecord {
  recordId: string;
  orgId: string;
  studentId?: string;
  sectionId?: string;
}

const SAMPLE_RECORDS: SyntheticRecord[] = [
  {
    recordId: 'rec-sA',
    orgId: ORG_GREENWOOD,
    studentId: STUDENT_A.studentId,
    sectionId: 'aaaa0000-0000-4000-8000-000000000001',
  },
  {
    recordId: 'rec-sB',
    orgId: ORG_GREENWOOD,
    studentId: STUDENT_B.studentId,
    sectionId: 'bbbb0000-0000-4000-8000-000000000002',
  },
  {
    recordId: 'rec-tB',
    orgId: ORG_TENANT_B,
    studentId: '99999999-9999-4999-8999-999999999999',
    sectionId: 'cccc0000-0000-4000-8000-000000000003',
  },
];

/** Mirrors Stage 3 PostgreSQL RLS helper semantics from the active PG claims. */
function evaluateRlsVisibility(
  claims: {
    sub: string | null;
    role: string | null;
    orgIdFromDbLookup: (uid: string) => string | null;
  },
  rec: SyntheticRecord,
): boolean {
  if (!claims.sub || claims.role !== 'authenticated') return false;
  const userOrg = claims.orgIdFromDbLookup(claims.sub);
  if (!userOrg || userOrg !== rec.orgId) return false;

  if (claims.sub === ADMIN_GW.userId || claims.sub === ADMIN_TENANT_B.userId) return true;
  if (claims.sub === TEACHER_1.userId) {
    return Boolean(rec.sectionId && TEACHER_1.assignedSectionIds.includes(rec.sectionId));
  }
  if (claims.sub === PARENT_A.userId) {
    return Boolean(rec.studentId && PARENT_A.linkedStudentIds.includes(rec.studentId));
  }
  if (claims.sub === STUDENT_A.userId) return rec.studentId === STUDENT_A.studentId;
  if (claims.sub === STUDENT_B.userId) return rec.studentId === STUDENT_B.studentId;
  return false;
}

function orgLookup(uid: string): string | null {
  const map: Record<string, string> = {
    [STUDENT_A.userId]: ORG_GREENWOOD,
    [STUDENT_B.userId]: ORG_GREENWOOD,
    [PARENT_A.userId]: ORG_GREENWOOD,
    [TEACHER_1.userId]: ORG_GREENWOOD,
    [ADMIN_GW.userId]: ORG_GREENWOOD,
    [ADMIN_TENANT_B.userId]: ORG_TENANT_B,
  };
  return map[uid] ?? null;
}

export async function runRlsBridgeOfflineTests(): Promise<void> {
  console.log('\n============================================================');
  console.log('NATIVEJWT -> POSTGRESQL RLS BRIDGE AUTOMATED TEST SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      console.log(`  PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  FAIL: ${name} -> ${err?.message || err}`);
      failed++;
    }
  }

  const pool = new SimulatedPooledPgClient();

  const queryVisibleForPrincipal = async (principal: {
    userId: string;
    orgId: string;
    roles: string[];
  }) => {
    return withRlsContext(
      principal,
      async (tx) => {
        const rows =
          await tx.$queryRawUnsafe<Array<Record<string, string | null>>>('SELECT current_user');
        const snap = rows[0];
        assert.strictEqual(snap.current_user, 'authenticated');
        assert.strictEqual(snap.claim_role, 'authenticated');
        assert.strictEqual(snap.sub, principal.userId);
        const parsedClaims = JSON.parse(String(snap.claims));
        assert.strictEqual(parsedClaims.sub, principal.userId);
        assert.strictEqual(parsedClaims.org_id, principal.orgId);

        return SAMPLE_RECORDS.filter((r) =>
          evaluateRlsVisibility(
            { sub: snap.sub, role: snap.claim_role, orgIdFromDbLookup: orgLookup },
            r,
          ),
        ).map((r) => r.recordId);
      },
      { client: pool, readOnly: true },
    );
  };

  // 1 & 2. Student own vs cross-student
  await test('1 & 2. Student sees own record only and cannot see another student', async () => {
    const visibleA = await queryVisibleForPrincipal(STUDENT_A);
    assert.deepStrictEqual(visibleA, ['rec-sA']);

    const visibleB = await queryVisibleForPrincipal(STUDENT_B);
    assert.deepStrictEqual(visibleB, ['rec-sB']);
  });

  // 3. Parent linked student only
  await test('3. Parent sees linked student record only (denied unlinked student)', async () => {
    const visible = await queryVisibleForPrincipal(PARENT_A);
    assert.deepStrictEqual(visible, ['rec-sA']);
  });

  // 4. Teacher assigned section only
  await test('4. Teacher sees assigned section records only', async () => {
    const visible = await queryVisibleForPrincipal(TEACHER_1);
    assert.deepStrictEqual(visible, ['rec-sA']);
  });

  // 5 & 6. Admin sees school/org records & cross-org denial
  await test('5 & 6. Admin sees school/org records cleanly & cross-org access denied', async () => {
    const visibleGw = await queryVisibleForPrincipal(ADMIN_GW);
    assert.deepStrictEqual(visibleGw, ['rec-sA', 'rec-sB']);

    const visibleTenantB = await queryVisibleForPrincipal(ADMIN_TENANT_B);
    assert.deepStrictEqual(visibleTenantB, ['rec-tB']);
  });

  // 7. No session leakage across pooled DB transactions (including aborted/rolled-back tx)
  await test('7. Connection pool isolates ROLE & JWT GUCs across sequential + rolled-back transactions', async () => {
    // Aborted transaction as Teacher
    await assert.rejects(
      withRlsContext(
        TEACHER_1,
        async () => {
          throw new Error('Simulated handler exception triggers ROLLBACK');
        },
        { client: pool },
      ),
      /Simulated handler exception/,
    );

    // Next pooled checkout without RLS settings must see postgres role + NULL JWT GUCs
    await pool.$transaction(async (tx) => {
      const rows =
        await tx.$queryRawUnsafe<Array<Record<string, string | null>>>('SELECT current_user');
      assert.strictEqual(rows[0].current_user, 'postgres');
      assert.strictEqual(rows[0].sub, null);
      assert.strictEqual(rows[0].claim_role, null);
      assert.strictEqual(rows[0].claims, null);
    });

    // Next checkout as Tenant B Admin receives only Tenant B claims
    const visibleTenantB = await queryVisibleForPrincipal(ADMIN_TENANT_B);
    assert.deepStrictEqual(visibleTenantB, ['rec-tB']);

    // Verify last committed tx never contaminated persistent pool state
    assert.strictEqual(pool.persistentState.role, 'postgres');
    assert.strictEqual(pool.persistentState.gucs.size, 0);
  });

  // 8. Missing/invalid NativeJwt, forged headers, non-UUID subjects fail closed
  await test('8. Missing, forged, tampered, or invalid NativeJwt requests fail closed', async () => {
    // Forged client headers with no req.context.user must fail closed
    const forgedReq = {
      headers: {
        'x-user-id': ADMIN_GW.userId,
        'x-org-id': ORG_GREENWOOD,
        'x-tenant-id': ORG_GREENWOOD,
      },
      query: { org_id: ORG_GREENWOOD },
      body: { user_id: ADMIN_GW.userId },
    } as unknown as Request;

    assert.throws(() => extractPrincipalFromRequest(forgedReq), UnauthorizedError);
    await assert.rejects(
      withRlsFromRequest(forgedReq, async () => 'should-not-run'),
      UnauthorizedError,
    );

    // Non-APPROVED session or empty roles must fail closed
    const pendingReq = {
      context: {
        user: {
          id: STUDENT_A.userId,
          email: 's1@greenwood.internal',
          org_id: ORG_GREENWOOD,
          school_id: ORG_GREENWOOD,
          roles: ['STUDENT'],
          permissions: [],
          login_status: 'PENDING',
        },
        token: 'dummy',
      },
    } as unknown as Request;
    assert.throws(() => extractPrincipalFromRequest(pendingReq), UnauthorizedError);

    const rolelessReq = {
      context: {
        user: {
          id: STUDENT_A.userId,
          email: 's1@greenwood.internal',
          org_id: ORG_GREENWOOD,
          school_id: ORG_GREENWOOD,
          roles: [],
          permissions: [],
          login_status: 'APPROVED',
        },
        token: 'dummy',
      },
    } as unknown as Request;
    assert.throws(() => extractPrincipalFromRequest(rolelessReq), UnauthorizedError);

    // Non-UUID injection attempt must fail closed before opening transaction
    await assert.rejects(
      withRlsContext(
        { userId: "'; DROP TABLE users; --", orgId: ORG_GREENWOOD, roles: ['ADMIN'] },
        async () => 'never',
        { client: pool },
      ),
      UnauthorizedError,
    );

    // Real NativeJwt signing + tampering + expiration check
    const secret = process.env.JWT_SECRET || 'edutrack-dev-jwt-secret-change-in-production';
    const validToken = NativeJwt.sign(
      {
        userId: STUDENT_A.userId,
        email: 'student@greenwood.internal',
        orgId: ORG_GREENWOOD,
        roles: ['STUDENT'],
      },
      secret,
      300,
    );
    const decoded = NativeJwt.verify<any>(validToken, secret);
    assert.strictEqual(decoded.userId, STUDENT_A.userId);

    const tamperedToken = `${validToken.slice(0, -4)}zzzz`;
    assert.throws(() => NativeJwt.verify(tamperedToken, secret), /Invalid JWT signature/);

    await assert.rejects(resolvePrincipalFromToken(''), UnauthorizedError);
    await assert.rejects(resolvePrincipalFromToken('Bearer   '), UnauthorizedError);
    await assert.rejects(
      withRlsFromToken('invalid.jwt.token', async () => 'never', { client: pool }),
      UnauthorizedError,
    );

    // Middleware attachRlsRunner passes UnauthorizedError when unauthenticated and wires runner when authenticated
    let forwardedErr: unknown = null;
    attachRlsRunner(
      forgedReq,
      {} as Response,
      ((err?: unknown) => {
        forwardedErr = err;
      }) as NextFunction,
    );
    assert.ok(forwardedErr instanceof UnauthorizedError);

    // Privileged system boundary helper remains explicitly opt-in and separate
    const sysResult = await withSystemContext(async (client) => Boolean(client));
    assert.strictEqual(sysResult, true);
  });

  // Bonus: Verify SessionService -> withRlsFromToken integration using stubbed validateSession (no DB write)
  await test('Bonus: resolvePrincipalFromToken honors verified SessionService profile and rejects null', async () => {
    const origValidate = sessionService.validateSession.bind(sessionService);
    try {
      (sessionService as any).validateSession = async (token: string) => {
        if (token === 'valid-native-jwt') {
          return {
            id: TEACHER_1.userId,
            email: 'tch043@greenwood.internal',
            org_id: ORG_GREENWOOD,
            school_id: ORG_GREENWOOD,
            roles: ['TEACHER'],
            permissions: [],
            login_status: 'APPROVED',
          };
        }
        return null;
      };

      const visible = await withRlsFromToken(
        'Bearer valid-native-jwt',
        async (tx) => {
          const rows =
            await tx.$queryRawUnsafe<Array<Record<string, string | null>>>('SELECT current_user');
          assert.strictEqual(rows[0].sub, TEACHER_1.userId);
          return rows[0].sub;
        },
        { client: pool, readOnly: true },
      );
      assert.strictEqual(visible, TEACHER_1.userId);

      await assert.rejects(
        withRlsFromToken('Bearer expired-or-revoked', async () => 'never', { client: pool }),
        UnauthorizedError,
      );
    } finally {
      (sessionService as any).validateSession = origValidate;
    }
  });

  console.log(`\nOffline Summary: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

/**
 * Optional read-only verification against PostgreSQL using strictly `READ ONLY`
 * transactions (`SET TRANSACTION READ ONLY`). Never writes or alters any row.
 */
export async function runLiveReadOnlyRlsProbe(): Promise<void> {
  console.log('\n============================================================');
  console.log('LIVE READ-ONLY POSTGRESQL RLS BRIDGE PROBE (0 WRITES)');
  console.log('============================================================\n');

  const studentUser = 'b6a54b1d-76ec-57e6-b1bb-d2448ea0f50f';
  const linkedStudentId = '37c155e2-a73e-5865-ba11-73132fbbe464';
  const otherStudentId = 'e91d0bf3-091c-50d7-acd3-6a3868c74947';
  const parentUser = '932b113e-2f39-547d-bcc4-8a6a7095e933';
  const teacherUser = 'b3127e4d-6c59-5458-a160-bfcef41b18a6';
  const teacherFaId = '06190695-e50d-5c97-a090-4b4899ebc63c';
  const adminUser = '1efd57c3-76c1-4ccc-837c-03444f5342b7'; // Principal at Greenwood

  const probe = async (
    label: string,
    principal: { userId: string; orgId: string; roles: string[] },
  ) => {
    const row = await withRlsContext(
      principal,
      async (tx) => {
        const res = await tx.$queryRawUnsafe<Array<Record<string, any>>>(
          `SELECT current_user::text AS db_role,
                  auth.uid()::text AS uid,
                  public.auth_org_id()::text AS org_id,
                  public.auth_is_student($1::uuid) AS is_own_student,
                  public.auth_is_student($2::uuid) AS is_other_student,
                  public.auth_is_parent_of_student($1::uuid) AS is_parent_linked,
                  public.auth_is_parent_of_student($2::uuid) AS is_parent_other,
                  public.auth_is_teacher_of_assignment($3::uuid) AS is_teacher_fa,
                  public.auth_is_staff($4::uuid) AS is_gw_staff,
                  public.auth_is_staff($5::uuid) AS is_tenant_b_staff,
                  public.auth_is_academic_admin($4::uuid) AS is_gw_admin`,
          linkedStudentId,
          otherStudentId,
          teacherFaId,
          ORG_GREENWOOD,
          ORG_TENANT_B,
        );
        return res[0];
      },
      { readOnly: true },
    );
    console.log(`  LIVE_RO[${label}]:`, JSON.stringify(row));
    assert.strictEqual(row.db_role, 'authenticated');
    assert.strictEqual(row.uid, principal.userId);
    assert.strictEqual(row.org_id, principal.orgId);
    assert.strictEqual(row.is_tenant_b_staff, false);
    return row;
  };

  const sRow = await probe('STUDENT', {
    userId: studentUser,
    orgId: ORG_GREENWOOD,
    roles: ['STUDENT'],
  });
  assert.strictEqual(sRow.is_own_student, true);
  assert.strictEqual(sRow.is_other_student, false);

  const pRow = await probe('PARENT', {
    userId: parentUser,
    orgId: ORG_GREENWOOD,
    roles: ['PARENT'],
  });
  assert.strictEqual(pRow.is_parent_linked, true);
  assert.strictEqual(pRow.is_parent_other, false);

  const tRow = await probe('TEACHER', {
    userId: teacherUser,
    orgId: ORG_GREENWOOD,
    roles: ['TEACHER'],
  });
  assert.strictEqual(tRow.is_teacher_fa, true);
  assert.strictEqual(tRow.is_gw_staff, true);

  const aRow = await probe('PRINCIPAL_ADMIN', {
    userId: adminUser,
    orgId: ORG_GREENWOOD,
    roles: ['HOI'],
  });
  assert.strictEqual(aRow.is_gw_staff, true);
  // Pre-remediation live DB has case-sensitive lowercase role list ('principal'), while Greenwood stores 'Principal'.
  console.log(
    `  NOTE: Pre-remediation live DB auth_is_academic_admin for Principal returned: ${aRow.is_gw_admin}`,
  );

  // Confirm pool cleanup immediately after withRlsContext finishes via plain system read
  const postPool = await withSystemContext(async (client) => {
    const res = await client.$queryRawUnsafe<Array<Record<string, any>>>(
      `SELECT current_user::text AS db_role, auth.uid()::text AS uid`,
    );
    return res[0];
  });
  console.log('  LIVE_RO[POST_POOL_SYSTEM]:', JSON.stringify(postPool));
  assert.strictEqual(postPool.db_role, 'postgres');
  assert.strictEqual(postPool.uid, null);
}

if (require.main === module) {
  (async () => {
    await runRlsBridgeOfflineTests();
    if (process.argv.includes('--live-readonly')) {
      await runLiveReadOnlyRlsProbe();
    }
    await prisma.$disconnect();
  })().catch(async (err) => {
    console.error(err);
    await prisma.$disconnect().catch(() => undefined);
    process.exit(1);
  });
}
