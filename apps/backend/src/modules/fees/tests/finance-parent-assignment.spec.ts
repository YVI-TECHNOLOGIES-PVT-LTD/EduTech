import assert from 'assert';
import { FeeStructureManagerService } from '../services/FeeStructureManagerService';
import { StudentLedgerService } from '../services/StudentLedgerService';
import { ParentFinanceService } from '../services/ParentFinanceService';
import prisma from '../../../lib/prismaClient';

export async function runFinanceParentAssignmentTests() {
  console.log('=====================================================');
  console.log('   FINANCE: FEE ASSIGNMENT & PARENT ACCESS TEST SUITE');
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

  const mockOrgId = '624efc1b-4144-43a4-90b8-552d945cbef7';
  const foreignOrgId = '00000000-0000-0000-0000-000000000099';
  const mockUserId = '77885aec-5431-5024-8f14-5f70a0a18efb';

  const sampleAy = await prisma.academic_years.findFirst({
    where: { org_id: mockOrgId },
  });
  const validAyId = sampleAy?.academic_year_id || '00000000-0000-0000-0000-000000000001';

  // -------------------------------------------------------------------------
  // 1. Variable Installment Plan Validation
  // -------------------------------------------------------------------------
  await test('createInstallmentPlan rejects plans whose term percentages do not total 100%', async () => {
    await assert.rejects(async () => {
      await FeeStructureManagerService.createInstallmentPlan(mockOrgId, mockUserId, {
        plan_name: 'Invalid 3-Term Plan',
        academic_year_id: validAyId,
        terms: [
          { term_number: 1, term_name: 'Term 1', percentage: 30, due_date: '2026-06-01' },
          { term_number: 2, term_name: 'Term 2', percentage: 30, due_date: '2026-10-01' },
          { term_number: 3, term_name: 'Term 3', percentage: 30, due_date: '2027-01-01' }, // Totals 90%
        ],
      });
    }, /must total exactly 100/i);
  });

  await test('createInstallmentPlan rejects plans with missing terms', async () => {
    await assert.rejects(async () => {
      await FeeStructureManagerService.createInstallmentPlan(mockOrgId, mockUserId, {
        plan_name: 'Empty Terms Plan',
        academic_year_id: validAyId,
        terms: [],
      });
    }, /At least one installment term is required/);
  });

  await test('createInstallmentPlan rejects terms with negative percentages', async () => {
    await assert.rejects(async () => {
      await FeeStructureManagerService.createInstallmentPlan(mockOrgId, mockUserId, {
        plan_name: 'Negative Percentage Plan',
        academic_year_id: validAyId,
        terms: [
          { term_number: 1, term_name: 'Term 1', percentage: -20, due_date: '2026-06-01' },
          { term_number: 2, term_name: 'Term 2', percentage: 120, due_date: '2026-10-01' },
        ],
      });
    }, /must be greater than 0%/);
  });

  // -------------------------------------------------------------------------
  // 2. Student Fee Assignment Validation & Idempotency
  // -------------------------------------------------------------------------
  await test('assignFeeStructure rejects missing student ID or fee structure ID', async () => {
    await assert.rejects(async () => {
      await StudentLedgerService.assignFeeStructure(mockOrgId, mockUserId, {
        studentId: '',
        feeStructureId: '00000000-0000-0000-0000-000000000001',
      });
    }, /student ID is required/i);

    await assert.rejects(async () => {
      await StudentLedgerService.assignFeeStructure(mockOrgId, mockUserId, {
        studentId: '00000000-0000-0000-0000-000000000001',
        feeStructureId: '',
      });
    }, /fee structure ID is required/i);
  });

  await test('assignFeeStructure rejects cross-tenant student assignment (404)', async () => {
    await assert.rejects(async () => {
      await StudentLedgerService.assignFeeStructure(foreignOrgId, mockUserId, {
        studentId: '00000000-0000-0000-0000-000000000001',
        feeStructureId: '00000000-0000-0000-0000-000000000001',
      });
    }, /Student not found in the current organization|Fee structure not found/i);
  });

  await test('bulkAssignFeeStructure rejects empty student IDs list', async () => {
    await assert.rejects(async () => {
      await StudentLedgerService.bulkAssignFeeStructure(mockOrgId, mockUserId, {
        studentIds: [],
        feeStructureId: '00000000-0000-0000-0000-000000000001',
      });
    }, /At least one student ID is required for bulk assignment/);
  });

  await test('bulkAssignFeeStructure reports failures gracefully without throwing top-level exception', async () => {
    const res = await StudentLedgerService.bulkAssignFeeStructure(mockOrgId, mockUserId, {
      studentIds: ['00000000-0000-0000-0000-000000000099'],
      feeStructureId: '00000000-0000-0000-0000-000000000099',
    });

    assert.strictEqual(res.total, 1);
    assert.strictEqual(res.failed, 1);
    assert.strictEqual(res.succeeded, 0);
    assert.ok(res.results[0].error);
  });

  // -------------------------------------------------------------------------
  // 3. Parent-to-Student Authorization & IDOR Prevention
  // -------------------------------------------------------------------------
  await test('verifyParentChildAccess rejects non-existent student', async () => {
    const hasAccess = await ParentFinanceService.verifyParentChildAccess(
      mockOrgId,
      mockUserId,
      '00000000-0000-0000-0000-000000000099',
    );
    assert.strictEqual(hasAccess, false);
  });

  await test('verifyParentChildAccess rejects unrelated parent IDOR access', async () => {
    // Look up an existing student and an unrelated user
    const sampleStudent = await prisma.students.findFirst({
      where: { org_id: mockOrgId },
    });

    if (sampleStudent) {
      // Unrelated user ID not linked to this student
      const unrelatedUserId = '00000000-0000-0000-0000-000000000999';
      const hasAccess = await ParentFinanceService.verifyParentChildAccess(
        mockOrgId,
        unrelatedUserId,
        sampleStudent.student_id,
      );
      assert.strictEqual(hasAccess, false);
    }
  });

  await test('verifyParentChildAccess confirms linked parent in student_parents', async () => {
    const link = await prisma.student_parents.findFirst({
      include: {
        parents: true,
        students: true,
      },
    });

    if (link && link.parents && link.students) {
      const hasAccess = await ParentFinanceService.verifyParentChildAccess(
        link.parents.org_id,
        link.parents.user_id || link.parents.parent_id,
        link.students.student_id,
        link.parents.email || undefined,
      );
      assert.strictEqual(hasAccess, true);
    }
  });

  await test('verifyParentChildAccess rejects parent from another organization (tenant isolation)', async () => {
    const link = await prisma.student_parents.findFirst({
      include: {
        parents: true,
        students: true,
      },
    });

    if (link && link.parents && link.students) {
      const hasAccess = await ParentFinanceService.verifyParentChildAccess(
        foreignOrgId,
        link.parents.user_id || link.parents.parent_id,
        link.students.student_id,
        link.parents.email || undefined,
      );
      assert.strictEqual(hasAccess, false);
    }
  });

  // -------------------------------------------------------------------------
  // 4. Parent Multi-Child Fee Calculation & Output
  // -------------------------------------------------------------------------
  await test('getMyChildrenFees returns structured overview with zero records for unlinked user', async () => {
    const unlinkedUserId = '00000000-0000-0000-0000-000000000999';
    const result = await ParentFinanceService.getMyChildrenFees(mockOrgId, unlinkedUserId);

    assert.strictEqual(result.children_count, 0);
    assert.deepStrictEqual(result.children, []);
    assert.ok(result.message);
  });

  await test('roundMoney ensures decimal accuracy on dues partitioning', () => {
    // 50,000 fee split 33.33%, 33.33%, 33.34%
    const total = 50000;
    const term1 = ParentFinanceService.roundMoney(total * 0.3333);
    const term2 = ParentFinanceService.roundMoney(total * 0.3333);
    const term3 = ParentFinanceService.roundMoney(total - (term1 + term2));

    assert.strictEqual(term1 + term2 + term3, total);
  });

  console.log(`\nFinance Parent & Assignment tests complete: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    throw new Error(`Finance Parent & Assignment test suite encountered ${failed} failure(s).`);
  }
}

if (require.main === module) {
  runFinanceParentAssignmentTests().catch((err) => {
    console.error('Test Runner Failed:', err);
    process.exit(1);
  });
}
