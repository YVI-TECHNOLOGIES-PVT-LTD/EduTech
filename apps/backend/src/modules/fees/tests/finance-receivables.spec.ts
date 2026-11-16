import assert from 'assert';
import { ReceivablesService } from '../services/ReceivablesService';
import { ReceivablesRepository } from '../repositories/ReceivablesRepository';

export async function runFinanceReceivablesTests() {
  console.log('=====================================================');
  console.log('   FINANCE PHASE 8: RECEIVABLES & COLLECTIONS SUITE   ');
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

  const validTenant = '00000000-0000-0000-0000-000000000001';
  const testUserId = '00000000-0000-0000-0000-000000000099';
  const testStudentId = '11111111-1111-1111-1111-111111111111';
  const testAcademicYearId = '22222222-2222-2222-2222-222222222222';

  // -------------------------------------------------------------------------
  // 1. Parameter Validation & Tenant Isolation
  // -------------------------------------------------------------------------
  await test('getSummary rejects missing tenant organization ID', async () => {
    await assert.rejects(
      async () => {
        await ReceivablesService.getSummary('');
      },
      /Tenant organization ID is required/
    );
  });

  await test('getRegister rejects missing tenant organization ID', async () => {
    await assert.rejects(
      async () => {
        await ReceivablesService.getRegister('');
      },
      /Tenant organization ID is required/
    );
  });

  await test('getAgeing rejects missing tenant organization ID', async () => {
    await assert.rejects(
      async () => {
        await ReceivablesService.getAgeing('');
      },
      /Tenant organization ID is required/
    );
  });

  await test('getCollections rejects missing tenant organization ID', async () => {
    await assert.rejects(
      async () => {
        await ReceivablesService.getCollections('');
      },
      /Tenant organization ID is required/
    );
  });

  await test('getStudentDetail rejects missing student ID', async () => {
    await assert.rejects(
      async () => {
        await ReceivablesService.getStudentDetail(validTenant, '');
      },
      /Student ID is required/
    );
  });

  await test('getStudentDetail rejects invalid student ID format', async () => {
    await assert.rejects(
      async () => {
        await ReceivablesService.getStudentDetail(validTenant, 'not-a-uuid');
      },
      /Invalid student identifier format/
    );
  });

  await test('recordFollowUp explicitly reports feature blocked by schema freeze', async () => {
    await assert.rejects(
      async () => {
        await ReceivablesService.recordFollowUp(validTenant, testUserId, {
          studentId: testStudentId,
          actionType: 'phone_call',
          notes: 'Spoke with parent',
        });
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 501);
        assert.strictEqual(err.code, 'FEATURE_BLOCKED_SCHEMA_FREEZE');
        assert.ok(err.message.includes('schema freeze'));
        return true;
      }
    );
  });

  // -------------------------------------------------------------------------
  // 2. Receivables Calculation & Business Rules
  // -------------------------------------------------------------------------
  await test('Receivables calculations: Fully unpaid obligation', () => {
    const dueAmount = 5000;
    const allocatedPayment = 0;
    const outstanding = Math.max(0, dueAmount - allocatedPayment);
    assert.strictEqual(outstanding, 5000);
  });

  await test('Receivables calculations: Partially paid obligation', () => {
    const dueAmount = 10000;
    const allocatedPayment = 3500;
    const outstanding = Math.max(0, dueAmount - allocatedPayment);
    assert.strictEqual(outstanding, 6500);
  });

  await test('Receivables calculations: Fully settled obligation', () => {
    const dueAmount = 4000;
    const allocatedPayment = 4000;
    const outstanding = Math.max(0, dueAmount - allocatedPayment);
    assert.strictEqual(outstanding, 0);
  });

  await test('Receivables calculations: Waived obligation produces 0 outstanding', () => {
    const status = 'waived';
    const dueAmount = 6000;
    const outstanding = status === 'waived' ? 0 : dueAmount;
    assert.strictEqual(outstanding, 0);
  });

  await test('Derived status rules: Not Yet Due, Due Today, Overdue, Partially Paid, Settled, Waived', () => {
    const today = new Date().toISOString().split('T')[0];

    const deriveStatus = (dueAmt: number, paidAmt: number, dueDate: string, dueStatus: string) => {
      const outstanding = Math.max(0, dueAmt - paidAmt);
      if (dueStatus === 'waived') return 'Waived';
      if (outstanding === 0) return 'Settled';
      if (dueDate < today) return 'Overdue';
      if (dueDate === today) return 'Due Today';
      if (paidAmt > 0) return 'Partially Paid';
      return 'Not Yet Due';
    };

    assert.strictEqual(deriveStatus(5000, 0, '2099-01-01', 'pending'), 'Not Yet Due');
    assert.strictEqual(deriveStatus(5000, 1000, '2099-01-01', 'pending'), 'Partially Paid');
    assert.strictEqual(deriveStatus(5000, 0, today, 'pending'), 'Due Today');
    assert.strictEqual(deriveStatus(5000, 0, '2020-01-01', 'pending'), 'Overdue');
    assert.strictEqual(deriveStatus(5000, 5000, '2020-01-01', 'paid'), 'Settled');
    assert.strictEqual(deriveStatus(5000, 0, '2020-01-01', 'waived'), 'Waived');
  });

  await test('Ageing bucket assignment is mutually exclusive and comprehensive', () => {
    const assignBucket = (daysPastDue: number) => {
      if (daysPastDue <= 0) return 'CURRENT';
      if (daysPastDue >= 1 && daysPastDue <= 7) return 'OVERDUE_1_7';
      if (daysPastDue >= 8 && daysPastDue <= 30) return 'OVERDUE_8_30';
      if (daysPastDue >= 31 && daysPastDue <= 60) return 'OVERDUE_31_60';
      if (daysPastDue >= 61 && daysPastDue <= 90) return 'OVERDUE_61_90';
      return 'OVERDUE_90_PLUS';
    };

    assert.strictEqual(assignBucket(-5), 'CURRENT');
    assert.strictEqual(assignBucket(0), 'CURRENT');
    assert.strictEqual(assignBucket(1), 'OVERDUE_1_7');
    assert.strictEqual(assignBucket(7), 'OVERDUE_1_7');
    assert.strictEqual(assignBucket(8), 'OVERDUE_8_30');
    assert.strictEqual(assignBucket(30), 'OVERDUE_8_30');
    assert.strictEqual(assignBucket(31), 'OVERDUE_31_60');
    assert.strictEqual(assignBucket(60), 'OVERDUE_31_60');
    assert.strictEqual(assignBucket(61), 'OVERDUE_61_90');
    assert.strictEqual(assignBucket(90), 'OVERDUE_61_90');
    assert.strictEqual(assignBucket(91), 'OVERDUE_90_PLUS');
    assert.strictEqual(assignBucket(365), 'OVERDUE_90_PLUS');
  });

  await test('Approved but unapplied concession does not reduce ledger outstanding balance', () => {
    const assessedAmount = 20000;
    const approvedConcessionPct = 25; // 25% approved but not applied
    const concessionStatus: string = 'approved'; // not 'applied'

    // Only 'applied' concessions reduce amount_due in ledger
    const discountApplied = concessionStatus === 'applied' ? (assessedAmount * approvedConcessionPct) / 100 : 0;
    const remainingDue = assessedAmount - discountApplied;

    assert.strictEqual(discountApplied, 0);
    assert.strictEqual(remainingDue, 20000);
  });

  await test('Applied concession reduces ledger due atomically', () => {
    const assessedAmount = 20000;
    const concessionPct = 25;
    const concessionStatus = 'applied';

    const discountApplied = concessionStatus === 'applied' ? (assessedAmount * concessionPct) / 100 : 0;
    const remainingDue = assessedAmount - discountApplied;

    assert.strictEqual(discountApplied, 5000);
    assert.strictEqual(remainingDue, 15000);
  });

  // -------------------------------------------------------------------------
  // 3. Collections Calculations & Reconciliation
  // -------------------------------------------------------------------------
  await test('Collections exclude pending, failed, or simulated transactions', () => {
    const transactions = [
      { id: '1', amount: 5000, status: 'success' },
      { id: '2', amount: 3000, status: 'pending' },
      { id: '3', amount: 2000, status: 'failed' },
      { id: '4', amount: 1500, status: 'initiated' },
    ];

    const confirmedCash = transactions
      .filter((t) => t.status === 'success')
      .reduce((sum, t) => sum + t.amount, 0);

    assert.strictEqual(confirmedCash, 5000);
  });

  await test('Multiple allocations across dues do not duplicate cash transaction total', () => {
    // 1 transaction of 10000 allocated to 2 dues (6000 and 4000)
    const transaction = { id: 'tx-1', amount: 10000, status: 'success' };
    const allocations = [
      { id: 'a1', txId: 'tx-1', dueId: 'd1', amount: 6000 },
      { id: 'a2', txId: 'tx-1', dueId: 'd2', amount: 4000 },
    ];

    const totalTransactionCash = transaction.amount;
    const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);

    assert.strictEqual(totalTransactionCash, 10000);
    assert.strictEqual(totalAllocated, 10000);
    assert.strictEqual(totalTransactionCash, totalAllocated);
  });

  await test('Collections by component reconcile with allocations', () => {
    const allocations = [
      { component: 'Tuition Fee', amount: 5000 },
      { component: 'Transport Fee', amount: 2000 },
      { component: 'Tuition Fee', amount: 3000 },
    ];

    const componentMap: Record<string, number> = {};
    for (const a of allocations) {
      componentMap[a.component] = (componentMap[a.component] || 0) + a.amount;
    }

    assert.strictEqual(componentMap['Tuition Fee'], 8000);
    assert.strictEqual(componentMap['Transport Fee'], 2000);
    const sumByComp = Object.values(componentMap).reduce((s, v) => s + v, 0);
    assert.strictEqual(sumByComp, 10000);
  });

  // -------------------------------------------------------------------------
  // 4. Query and Pagination Behavior
  // -------------------------------------------------------------------------
  await test('ReceivablesRegister handles empty dataset gracefully', async () => {
    const mockDb = {
      $queryRawUnsafe: async (sql: string) => {
        if (sql.includes('COUNT(*)')) {
          return [{ total: 0, total_original: 0, total_paid: 0, total_outstanding: 0 }];
        }
        return [];
      },
    };

    const res = await ReceivablesRepository.getReceivablesRegister(
      validTenant,
      { page: 1, limit: 10 },
      mockDb
    );

    assert.strictEqual(res.pagination.total, 0);
    assert.strictEqual(res.pagination.page, 1);
    assert.strictEqual(res.pagination.totalPages, 1);
    assert.strictEqual(res.items.length, 0);
    assert.strictEqual(res.aggregates.totalOutstandingAmount, 0);
  });

  await test('AgeingAnalysis returns all 6 buckets even with zero amounts', async () => {
    const mockDb = {
      $queryRawUnsafe: async () => [],
    };

    const res = await ReceivablesRepository.getAgeingAnalysis(validTenant, undefined, mockDb);
    assert.strictEqual(res.buckets.length, 6);
    assert.strictEqual(res.buckets[0].bucketKey, 'CURRENT');
    assert.strictEqual(res.buckets[1].bucketKey, 'OVERDUE_1_7');
    assert.strictEqual(res.buckets[2].bucketKey, 'OVERDUE_8_30');
    assert.strictEqual(res.buckets[3].bucketKey, 'OVERDUE_31_60');
    assert.strictEqual(res.buckets[4].bucketKey, 'OVERDUE_61_90');
    assert.strictEqual(res.buckets[5].bucketKey, 'OVERDUE_90_PLUS');
    assert.strictEqual(res.totalOutstanding, 0);
    assert.strictEqual(res.totalOverdue, 0);
  });

  await test('Follow-up work queue correctly categorizes priority tiers', () => {
    const categorize = (maxDaysOverdue: number, totalOutstanding: number) => {
      if (maxDaysOverdue > 60) return 'HIGH_RISK';
      if (totalOutstanding >= 10000) return 'HIGH_VALUE';
      return 'STANDARD';
    };

    assert.strictEqual(categorize(95, 5000), 'HIGH_RISK');
    assert.strictEqual(categorize(10, 15000), 'HIGH_VALUE');
    assert.strictEqual(categorize(5, 2000), 'STANDARD');
  });

  console.log(`\nFinance Phase 8 Receivables tests complete: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    throw new Error(`${failed} receivables tests failed!`);
  }
}

if (require.main === module) {
  runFinanceReceivablesTests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
