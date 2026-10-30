import assert from 'assert';
import prisma from '../../../lib/prismaClient';

export async function runDashboardRoutesTests() {
  console.log('=====================================================');
  console.log('   DASHBOARD ROUTES: SCHEMA-ALIGNED TEST SUITE       ');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ ${name}: ${err.message}`);
      failed++;
    }
  }

  const testOrgId = '00000000-0000-0000-0000-000000000001';
  const testUserId = '00000000-0000-0000-0000-000000000002';

  // 1. Admin overview queries schema-aligned models
  await test('1. Admin overview queries schema.prisma models without non-existent table errors', async () => {
    const [studentsCount, sectionsCount, pendingAdmissionsCount, totalApplicationsCount, feeAgg] =
      await Promise.all([
        prisma.students.count({
          where: { org_id: testOrgId, status: 'active' },
        }),
        prisma.sections.count({
          where: { academic_year_grades: { academic_years: { org_id: testOrgId } } },
        }),
        prisma.admissions_applications.count({
          where: {
            org_id: testOrgId,
            status: { in: ['submitted', 'under_review', 'documents_pending'] },
          },
        }),
        prisma.admissions_applications.count({
          where: { org_id: testOrgId },
        }),
        prisma.payment_transactions.aggregate({
          where: {
            payment_orders: {
              students: {
                org_id: testOrgId,
              },
            },
            status: 'success',
          },
          _sum: { amount: true },
        }),
      ]);

    assert.strictEqual(typeof studentsCount, 'number');
    assert.strictEqual(typeof sectionsCount, 'number');
    assert.strictEqual(typeof pendingAdmissionsCount, 'number');
    assert.strictEqual(typeof totalApplicationsCount, 'number');
    assert.ok(feeAgg);
  });

  // 2. Faculty overview queries sections linked to staff user_id
  await test('2. Faculty overview queries sections linking staff.user_id cleanly', async () => {
    const sectionsCount = await prisma.sections.count({
      where: {
        staff: {
          user_id: testUserId,
        },
        is_active: true,
      },
    });

    assert.strictEqual(typeof sectionsCount, 'number');
  });

  // 3. Timeline queries applications and payment transactions
  await test('3. Timeline queries applications and payments scoped to org_id', async () => {
    const [applications, payments] = await Promise.all([
      prisma.admissions_applications.findMany({
        where: { org_id: testOrgId },
        orderBy: { created_at: 'desc' },
        take: 5,
        select: {
          application_id: true,
          application_number: true,
          status: true,
          created_at: true,
        },
      }),
      prisma.payment_transactions.findMany({
        where: {
          payment_orders: {
            students: {
              org_id: testOrgId,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: 5,
        select: {
          payment_transaction_id: true,
          amount: true,
          payment_method: true,
          status: true,
          created_at: true,
        },
      }),
    ]);

    assert.ok(Array.isArray(applications));
    assert.ok(Array.isArray(payments));
  });

  console.log(`\n[Dashboard Routes] Tests finished: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runDashboardRoutesTests();
}
