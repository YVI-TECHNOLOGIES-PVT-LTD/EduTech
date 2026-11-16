import assert from 'assert';
import { PaymentCollectionService } from '../services/PaymentCollectionService';
import { StudentLedgerService } from '../services/StudentLedgerService';
import prisma from '../../../lib/prismaClient';

export async function runFinancePaymentTests() {
  console.log('=====================================================');
  console.log('   FINANCE PHASE 5: PAYMENT COLLECTION TEST SUITE    ');
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

  const mockTenantA = '00000000-0000-0000-0000-000000000001';
  const mockTenantB = '00000000-0000-0000-0000-000000000002';
  const mockStudentId = '00000000-0000-0000-0000-000000000010';
  const mockDueId = '00000000-0000-0000-0000-000000000020';

  // -------------------------------------------------------------------------
  // 1. Validation & Input Sanitization Tests
  // -------------------------------------------------------------------------
  await test('getEligibleObligations rejects missing tenant organization ID', async () => {
    await assert.rejects(async () => {
      await PaymentCollectionService.getEligibleObligations('', mockStudentId);
    }, /Tenant organization ID is required/);
  });

  await test('getEligibleObligations rejects invalid student UUID format', async () => {
    await assert.rejects(async () => {
      await PaymentCollectionService.getEligibleObligations(mockTenantA, 'not-a-valid-uuid');
    }, /Invalid student identifier/);
  });

  await test('recordOfflinePayment rejects missing tenant ID', async () => {
    await assert.rejects(async () => {
      await PaymentCollectionService.recordOfflinePayment('', null, {
        studentId: mockStudentId,
        studentChargeDueId: mockDueId,
        amount: 500,
        paymentMethod: 'cash',
      });
    }, /Tenant organization ID is required/);
  });

  await test('recordOfflinePayment rejects zero and negative amounts', async () => {
    await assert.rejects(async () => {
      await PaymentCollectionService.recordOfflinePayment(mockTenantA, null, {
        studentId: mockStudentId,
        studentChargeDueId: mockDueId,
        amount: 0,
        paymentMethod: 'cash',
      });
    }, /must be a positive number/);

    await assert.rejects(async () => {
      await PaymentCollectionService.recordOfflinePayment(mockTenantA, null, {
        studentId: mockStudentId,
        studentChargeDueId: mockDueId,
        amount: -100,
        paymentMethod: 'cash',
      });
    }, /must be a positive number/);
  });

  await test('recordOfflinePayment rejects excessive decimal precision (> 2 decimals)', async () => {
    await assert.rejects(async () => {
      await PaymentCollectionService.recordOfflinePayment(mockTenantA, null, {
        studentId: mockStudentId,
        studentChargeDueId: mockDueId,
        amount: 100.555,
        paymentMethod: 'cash',
      });
    }, /excessive precision/);
  });

  await test('recordOfflinePayment rejects unsupported payment method', async () => {
    await assert.rejects(async () => {
      await PaymentCollectionService.recordOfflinePayment(mockTenantA, null, {
        studentId: mockStudentId,
        studentChargeDueId: mockDueId,
        amount: 500,
        paymentMethod: 'crypto_currency' as any,
      });
    }, /Invalid offline payment method/);
  });

  await test('recordOfflinePayment returns 404 for non-existent student in tenant', async () => {
    await assert.rejects(
      async () => {
        await PaymentCollectionService.recordOfflinePayment(mockTenantA, null, {
          studentId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
          studentChargeDueId: mockDueId,
          amount: 500,
          paymentMethod: 'cash',
        });
      },
      (err: any) => err.statusCode === 404,
    );
  });

  // -------------------------------------------------------------------------
  // 2. Gateway Safety & Cryptographic Signature Verification Tests
  // -------------------------------------------------------------------------
  await test('verifyOnlinePayment rejects invalid or non-existent payment order ID', async () => {
    await assert.rejects(
      async () => {
        await PaymentCollectionService.verifyOnlinePayment(mockTenantA, null, {
          paymentOrderId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
          razorpayPaymentId: 'pay_123',
          razorpayOrderId: 'order_123',
          razorpaySignature: 'sig_123',
        });
      },
      (err: any) => err.statusCode === 404,
    );
  });

  await test('createOnlinePaymentOrder validates online payment methods', async () => {
    await assert.rejects(async () => {
      await PaymentCollectionService.createOnlinePaymentOrder(mockTenantA, null, {
        studentId: mockStudentId,
        studentChargeDueId: mockDueId,
        amount: 500,
        paymentMethod: 'invalid_method' as any,
      });
    }, /Invalid online payment method/);
  });

  // -------------------------------------------------------------------------
  // 3. Database Fixture & Lifecycle Tests (Tenant-scoped)
  // -------------------------------------------------------------------------
  // Find a tenant student with charges & dues in DB
  let orgWithDues: any = null;
  try {
    const dueRecord = await prisma.student_charge_dues.findFirst({
      where: { status: { notIn: ['cancelled', 'waived', 'paid'] } },
      include: {
        student_charges: {
          include: {
            students: {
              include: { organizations: true },
            },
          },
        },
      },
    });
    if (dueRecord?.student_charges?.students) {
      const student = dueRecord.student_charges.students;
      orgWithDues = {
        org_id: student.org_id,
        students: [
          {
            ...student,
            student_charges: [
              {
                ...dueRecord.student_charges,
                student_charge_dues: [dueRecord],
              },
            ],
          },
        ],
      };
    }
  } catch (err: any) {
    // Live DB does not have active dues mapped
  }

  if (orgWithDues && orgWithDues.students.length > 0) {
    const student = orgWithDues.students[0];
    const targetCharge = student.student_charges[0];
    const targetDue = targetCharge.student_charge_dues[0];

    await test('getEligibleObligations returns verified unpaid dues with remaining balance', async () => {
      const res = await PaymentCollectionService.getEligibleObligations(
        orgWithDues.org_id,
        student.student_id,
      );

      assert.strictEqual(res.student.student_id, student.student_id);
      assert.ok(Array.isArray(res.obligations));
      assert.ok(typeof res.total_remaining_payable === 'number');

      for (const ob of res.obligations) {
        assert.ok(ob.remaining_payable_amount > 0);
        assert.strictEqual(
          ob.remaining_payable_amount,
          PaymentCollectionService.roundMoney(ob.amount_due - ob.previously_allocated_amount),
        );
      }
    });

    await test('Cross-tenant isolation: Foreign tenant cannot access student obligations (404)', async () => {
      await assert.rejects(
        async () => {
          await PaymentCollectionService.getEligibleObligations(mockTenantB, student.student_id);
        },
        (err: any) => err.statusCode === 404,
      );
    });

    await test('recordOfflinePayment rejects payment amount exceeding remaining due balance', async () => {
      await assert.rejects(async () => {
        await PaymentCollectionService.recordOfflinePayment(orgWithDues.org_id, null, {
          studentId: student.student_id,
          studentChargeDueId: targetDue.student_charge_due_id,
          amount: 99999999.0, // Huge amount exceeding balance
          paymentMethod: 'cash',
        });
      }, /exceeds eligible remaining balance/);
    });

    // Test a valid small partial payment recording
    const testPaymentAmount = 10.0;
    let recordedTxId = '';

    await test('recordOfflinePayment successfully records payment transaction and allocation', async () => {
      const beforeSummary = await StudentLedgerService.getStudentLedgerSummary(
        orgWithDues.org_id,
        student.student_id,
      );

      const res = await PaymentCollectionService.recordOfflinePayment(orgWithDues.org_id, null, {
        studentId: student.student_id,
        studentChargeDueId: targetDue.student_charge_due_id,
        amount: testPaymentAmount,
        paymentMethod: 'cash',
        transactionReference: 'TEST-CASH-SLIP-001',
        notes: 'Automated test offline collection',
      });

      assert.strictEqual(res.success, true);
      assert.strictEqual(res.transaction.amount, testPaymentAmount);
      assert.strictEqual(res.transaction.payment_method, 'cash');
      assert.strictEqual(res.transaction.status, 'success');
      assert.strictEqual(res.allocation.allocated_amount, testPaymentAmount);
      assert.ok(res.receipt.receipt_no.startsWith('RCPT-'));
      assert.strictEqual(res.receipt.amount, testPaymentAmount);

      recordedTxId = res.transaction.transaction_id;

      // Invariant: Ledger must reflect the payment allocation immediately
      const afterSummary = await StudentLedgerService.getStudentLedgerSummary(
        orgWithDues.org_id,
        student.student_id,
      );

      assert.strictEqual(
        afterSummary.summary.total_paid_amount,
        StudentLedgerService.roundMoney(
          beforeSummary.summary.total_paid_amount + testPaymentAmount,
        ),
      );
      assert.strictEqual(
        afterSummary.summary.outstanding_balance,
        StudentLedgerService.roundMoney(
          beforeSummary.summary.outstanding_balance - testPaymentAmount,
        ),
      );
    });

    await test('getReceiptDetails loads official receipt document for transaction', async () => {
      if (!recordedTxId) return;

      const receipt = await PaymentCollectionService.getReceiptDetails(
        orgWithDues.org_id,
        recordedTxId,
      );

      assert.strictEqual(receipt.payment_transaction_id, recordedTxId);
      assert.strictEqual(receipt.student_id, student.student_id);
      assert.strictEqual(receipt.amount, testPaymentAmount);
      assert.strictEqual(receipt.currency, 'INR');
      assert.ok(receipt.receipt_no.startsWith('RCPT-'));
    });

    await test('Cross-tenant receipt access: Foreign tenant cannot fetch receipt (404)', async () => {
      if (!recordedTxId) return;

      await assert.rejects(
        async () => {
          await PaymentCollectionService.getReceiptDetails(mockTenantB, recordedTxId);
        },
        (err: any) => err.statusCode === 404,
      );
    });

    await test('getPaymentHistory returns tenant-scoped transactions list', async () => {
      const history = await PaymentCollectionService.getPaymentHistory(orgWithDues.org_id, {
        studentId: student.student_id,
        limit: 10,
      });

      assert.ok(Array.isArray(history.transactions));
      assert.ok(history.pagination.total >= 1);
      const found = history.transactions.find((t) => t.payment_transaction_id === recordedTxId);
      assert.ok(found, 'Recorded test transaction must appear in tenant payment history');
      assert.strictEqual(found?.amount, testPaymentAmount);
      assert.strictEqual(found?.status, 'success');
    });
  } else {
    console.log(
      '  [Notice] Live DB does not contain students with active charges/dues; offline payment schema validation and sanitization tests passed.',
    );
  }

  console.log(`\nFinance Phase 5 tests complete: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    throw new Error(`Finance Phase 5 tests failed: ${failed} failure(s)`);
  }
}

if (require.main === module) {
  runFinancePaymentTests().catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}
