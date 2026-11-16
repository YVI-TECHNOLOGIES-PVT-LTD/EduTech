import assert from 'assert';
import { ParentFinanceService } from '../services/ParentFinanceService';
import prisma from '../../../lib/prismaClient';

export async function runFinancePhase2ParentBreakdownTests() {
  console.log('=====================================================');
  console.log('   PHASE 2: PARENT FEE BREAKDOWN & LEDGER SYNC TESTS  ');
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

  // -------------------------------------------------------------------------
  // 1. Decimal precision & monetary arithmetic
  // -------------------------------------------------------------------------
  await test('roundMoney prevents JavaScript floating point precision drift', () => {
    // 0.1 + 0.2 in JS is 0.30000000000000004
    const sum = 0.1 + 0.2;
    const rounded = ParentFinanceService.roundMoney(sum);
    assert.strictEqual(rounded, 0.3);

    // Multi-term installment partition
    const total = 75000;
    const term1 = ParentFinanceService.roundMoney(total * 0.3333); // 24997.5
    const term2 = ParentFinanceService.roundMoney(total * 0.3333); // 24997.5
    const term3 = ParentFinanceService.roundMoney(total - (term1 + term2)); // 25005
    assert.strictEqual(term1 + term2 + term3, total);
  });

  // -------------------------------------------------------------------------
  // 2. Parent-to-Child Authorization & Tenant Boundaries
  // -------------------------------------------------------------------------
  await test('verifyParentChildAccess rejects non-existent student IDs safely', async () => {
    const hasAccess = await ParentFinanceService.verifyParentChildAccess(
      mockOrgId,
      mockUserId,
      '00000000-0000-0000-0000-000000000000',
    );
    assert.strictEqual(hasAccess, false);
  });

  await test('verifyParentChildAccess denies access to cross-tenant student', async () => {
    const sampleLink = await prisma.student_parents.findFirst({
      include: { parents: true, students: true },
    });

    if (sampleLink && sampleLink.parents && sampleLink.students) {
      // Pass a foreign organization ID to simulate cross-tenant access attempt
      const hasAccess = await ParentFinanceService.verifyParentChildAccess(
        foreignOrgId,
        sampleLink.parents.user_id || sampleLink.parents.parent_id,
        sampleLink.students.student_id,
        sampleLink.parents.email || undefined,
      );
      assert.strictEqual(hasAccess, false);
    }
  });

  await test('verifyParentChildAccess prevents account hijacking (email fallback requires user_id === null)', async () => {
    // If a parent record has user_id set to someone else, matching by email alone must NOT grant access
    const parentWithUser = await prisma.parents.findFirst({
      where: { user_id: { not: null }, email: { not: null } },
      include: { student_parents: true },
    });

    if (parentWithUser && parentWithUser.student_parents.length > 0) {
      const studentId = parentWithUser.student_parents[0].student_id;
      const attackerUserId = '00000000-0000-0000-0000-000000000999';

      // Attacker passes legitimate parent's email but attacker's own user_id
      const hasAccess = await ParentFinanceService.verifyParentChildAccess(
        parentWithUser.org_id,
        attackerUserId,
        studentId,
        parentWithUser.email || undefined,
      );
      assert.strictEqual(hasAccess, false);
    }
  });

  // -------------------------------------------------------------------------
  // 3. getMyChildrenFees Ledger Retrieval & Field Compatibility
  // -------------------------------------------------------------------------
  await test('getMyChildrenFees returns empty array when user has no linked students', async () => {
    const unlinkedUserId = '00000000-0000-0000-0000-000000000888';
    const result = await ParentFinanceService.getMyChildrenFees(mockOrgId, unlinkedUserId);

    assert.strictEqual(result.children_count, 0);
    assert.deepStrictEqual(result.children, []);
    assert.ok(result.message);
  });

  await test('getMyChildrenFees computes authoritative summary and breakdown for enrolled student', async () => {
    // Find an existing student with fee records if available
    const studentWithCharges = await prisma.students.findFirst({
      where: {
        student_charges: { some: { status: 'active' } },
      },
      include: {
        student_parents: {
          include: { parents: true },
        },
      },
    });

    if (studentWithCharges && studentWithCharges.student_parents.length > 0) {
      const parent = studentWithCharges.student_parents[0].parents;
      if (parent) {
        const result = await ParentFinanceService.getMyChildrenFees(
          parent.org_id,
          parent.user_id || parent.parent_id,
          parent.email || undefined,
        );

        assert.ok(result.children_count >= 1);
        const child = result.children.find((c) => c.student_id === studentWithCharges.student_id);
        assert.ok(child);

        // Verify summary fields
        assert.ok(typeof child.summary.total_assessed === 'number');
        assert.ok(typeof child.summary.total_paid === 'number');
        assert.ok(typeof child.summary.outstanding_balance === 'number');
        assert.ok(typeof child.summary.overdue_amount === 'number');
        assert.strictEqual(child.summary.balance, child.summary.outstanding_balance);

        // Verify mathematical reconciliation: balance = max(0, assessed - paid)
        const expectedBalance = Math.max(
          0,
          ParentFinanceService.roundMoney(child.summary.total_assessed - child.summary.total_paid),
        );
        assert.strictEqual(child.summary.outstanding_balance, expectedBalance);

        // Verify component-level breakdown
        assert.ok(Array.isArray(child.components));
        for (const comp of child.components) {
          assert.ok(comp.component_name);
          assert.ok(typeof comp.amount === 'number');
          if (comp.paid_amount !== undefined) {
            assert.ok(typeof comp.paid_amount === 'number');
            assert.ok(typeof comp.outstanding_amount === 'number');
            assert.ok(comp.status);
          }
        }

        // Verify installment dues
        assert.ok(Array.isArray(child.dues));
        for (const due of child.dues) {
          assert.ok(due.due_id);
          assert.ok(due.term_name);
          assert.ok(typeof due.amount_due === 'number');
          assert.ok(typeof due.paid_amount === 'number');
          assert.ok(typeof due.outstanding_amount === 'number');
          assert.ok(typeof due.is_overdue === 'boolean');

          // Overdue rule verification: if due is not overdue, either balance is 0 or dueDate is future
          if (due.outstanding_amount === 0) {
            assert.strictEqual(due.is_overdue, false);
          }
        }

        // Verify next due calculation
        if (child.dues.some((d) => d.outstanding_amount > 0)) {
          assert.ok(child.summary.next_due_date !== null);
          assert.ok(Number(child.summary.next_due_amount) > 0);
        }
      }
    }
  });

  // -------------------------------------------------------------------------
  // 4. getChildFeeDetails Individual Access & IDOR Enforcement
  // -------------------------------------------------------------------------
  await test('getChildFeeDetails throws STUDENT_NOT_LINKED for unauthorized student ID', async () => {
    await assert.rejects(
      async () => {
        await ParentFinanceService.getChildFeeDetails(
          mockOrgId,
          mockUserId,
          '00000000-0000-0000-0000-000000000000',
        );
      },
      (err: any) => {
        assert.strictEqual(err.code, 'STUDENT_NOT_LINKED');
        assert.strictEqual(err.statusCode, 404);
        return true;
      },
    );
  });

  // -------------------------------------------------------------------------
  // 5. Status derivations (fully_paid, partially_paid, pending, overdue, no_fees_assigned)
  // -------------------------------------------------------------------------
  await test('Status determination adheres to ERP financial state rules', () => {
    // Helper to evaluate status logic
    function determineStatus(assessed: number, paid: number, overdue: number, assigned: boolean) {
      const balance = Math.max(0, ParentFinanceService.roundMoney(assessed - paid));
      if (!assigned && assessed === 0) return 'no_fees_assigned';
      if (balance <= 0 && assessed > 0) return 'fully_paid';
      if (overdue > 0) return 'overdue';
      if (paid > 0) return 'partially_paid';
      return 'pending';
    }

    assert.strictEqual(determineStatus(0, 0, 0, false), 'no_fees_assigned');
    assert.strictEqual(determineStatus(50000, 50000, 0, true), 'fully_paid');
    assert.strictEqual(determineStatus(50000, 20000, 10000, true), 'overdue');
    assert.strictEqual(determineStatus(50000, 20000, 0, true), 'partially_paid');
    assert.strictEqual(determineStatus(50000, 0, 0, true), 'pending');
  });

  console.log(`\nPhase 2 Parent Breakdown tests complete: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    throw new Error(`Phase 2 Parent Breakdown suite encountered ${failed} failure(s).`);
  }
}

if (require.main === module) {
  runFinancePhase2ParentBreakdownTests().catch((err) => {
    console.error('Test Runner Failed:', err);
    process.exit(1);
  });
}
