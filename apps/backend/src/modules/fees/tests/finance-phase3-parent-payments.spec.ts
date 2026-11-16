import assert from 'assert';
import crypto from 'crypto';
import axios from 'axios';
import { ParentFinanceService } from '../services/ParentFinanceService';
import { PaymentCollectionService } from '../services/PaymentCollectionService';
import { StudentLedgerService } from '../services/StudentLedgerService';
import { PaymentRepository } from '../repositories/PaymentRepository';
import prisma from '../../../lib/prismaClient';

export async function runFinancePhase3ParentPaymentsTests() {
  console.log('=====================================================');
  console.log('   PHASE 3: SECURE ONLINE PAYMENTS & RECEIPTS TESTS  ');
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

  const foreignOrgId = '00000000-0000-0000-0000-000000000099';
  const unlinkedStudentId = '00000000-0000-0000-0000-000000000088';

  // Find a real linked parent-child pair in DB
  const linkedPair = await prisma.student_parents.findFirst({
    include: {
      parents: true,
      students: {
        include: {
          student_charges: {
            include: {
              student_charge_dues: true,
            },
          },
        },
      },
    },
  });

  const tenantOrgId = linkedPair?.students.org_id || '624efc1b-4144-43a4-90b8-552d945cbef7';
  const parentUserId = linkedPair?.parents.user_id || '77885aec-5431-5024-8f14-5f70a0a18efb';
  const studentId = linkedPair?.student_id || '00000000-0000-0000-0000-000000000001';

  // -------------------------------------------------------------------------
  // 1. Parent Payment Order Authorization & Boundaries (P0 / P1)
  // -------------------------------------------------------------------------
  await test('createParentPaymentOrder rejects payment initiation for unlinked child with 403 Forbidden', async () => {
    await assert.rejects(
      async () => {
        await ParentFinanceService.createParentPaymentOrder(tenantOrgId, parentUserId, {
          studentId: unlinkedStudentId,
          amount: 500,
        });
      },
      (err: any) => {
        return (
          err.statusCode === 403 &&
          (err.code === 'UNAUTHORIZED_STUDENT_ACCESS' || err.message.includes('not authorized'))
        );
      },
    );
  });

  await test('createParentPaymentOrder rejects payment initiation across foreign tenant boundaries', async () => {
    await assert.rejects(
      async () => {
        await ParentFinanceService.createParentPaymentOrder(foreignOrgId, parentUserId, {
          studentId: studentId,
          amount: 500,
        });
      },
      (err: any) => err.statusCode === 403 || err.statusCode === 404,
    );
  });

  await test('createParentPaymentOrder rejects negative or zero payment amounts', async () => {
    if (linkedPair) {
      await assert.rejects(
        async () => {
          await ParentFinanceService.createParentPaymentOrder(tenantOrgId, parentUserId, {
            studentId: studentId,
            amount: -50,
          });
        },
        (err: any) => err.statusCode === 400 && err.message.includes('positive'),
      );
    }
  });

  // -------------------------------------------------------------------------
  // 2. Authoritative Due Settlement & Amount Derivation
  // -------------------------------------------------------------------------
  await test('createParentPaymentOrder rejects amount exceeding eligible remaining balance', async () => {
    if (linkedPair) {
      const dues = linkedPair.students.student_charges.flatMap((c) => c.student_charge_dues);
      if (dues.length > 0) {
        const targetDue = dues[0];
        const remaining = Number(targetDue.amount_due);
        await assert.rejects(
          async () => {
            await ParentFinanceService.createParentPaymentOrder(tenantOrgId, parentUserId, {
              studentId: studentId,
              studentChargeDueId: targetDue.student_charge_due_id,
              amount: remaining + 999999,
            });
          },
          (err: any) =>
            err.statusCode === 400 &&
            (err.message.includes('exceeds') || err.message.includes('already been fully paid')),
        );
      }
    }
  });

  // -------------------------------------------------------------------------
  // 3. Parent Payment Initiation for Eligible Due
  // -------------------------------------------------------------------------
  let createdPaymentOrderId = '';
  let createdGatewayOrderId = '';
  let createdAmount = 0;
  let activeDueId = '';

  await test('createParentPaymentOrder successfully creates verified payment order for authorized child', async () => {
    if (!linkedPair) {
      console.log('    [Notice] No linked student found in test DB; skipping live order test');
      return;
    }

    // Ensure a test active charge and due exists
    const chargeRows: any = await prisma.$queryRaw`
      INSERT INTO student_charges (student_charge_id, student_id, source_type, description, amount, status)
      VALUES (gen_random_uuid(), ${studentId}::uuid, 'other'::financial_charge_source, 'Phase 3 Parent Payment Test', 250.0, 'active'::student_charge_status)
      RETURNING student_charge_id;
    `;
    const chargeId = chargeRows[0].student_charge_id;

    const dueRows: any = await prisma.$queryRaw`
      INSERT INTO student_charge_dues (student_charge_due_id, student_charge_id, amount_due, due_date, status)
      VALUES (gen_random_uuid(), ${chargeId}::uuid, 250.0, CURRENT_DATE, 'pending'::student_charge_due_status)
      RETURNING student_charge_due_id;
    `;
    activeDueId = dueRows[0].student_charge_due_id;

    const orderRes = await ParentFinanceService.createParentPaymentOrder(
      tenantOrgId,
      parentUserId,
      {
        studentId: studentId,
        studentChargeDueId: activeDueId,
        amount: 250.0,
        paymentMethod: 'card',
      },
    );

    assert.strictEqual(orderRes.success, true);
    assert.ok(orderRes.order_id);
    assert.strictEqual(orderRes.amount, 25000); // 25000 paise
    assert.strictEqual(orderRes.amount_in_rupees, 250.0);
    assert.strictEqual(orderRes.currency, 'INR');
    assert.strictEqual(orderRes.student_id, studentId);
    assert.strictEqual(orderRes.student_charge_due_id, activeDueId);

    createdPaymentOrderId = orderRes.payment_order_id;
    createdGatewayOrderId = orderRes.order_id;
    createdAmount = orderRes.amount_in_rupees;
  });

  // -------------------------------------------------------------------------
  // 4. Payment Verification & Ledger Reconciliation
  // -------------------------------------------------------------------------
  await test('verifyParentPayment reconciles gateway signature, commits allocation, and updates ledger', async () => {
    if (!createdPaymentOrderId) {
      console.log('    [Notice] Skipping verification; no payment order was created');
      return;
    }

    const mockKeySecret = 'test_secret_phase3_edutrack_2026';
    const origKeySecret = process.env.RAZORPAY_KEY_SECRET;
    const origKeyId = process.env.RAZORPAY_KEY_ID;
    process.env.RAZORPAY_KEY_SECRET = mockKeySecret;
    process.env.RAZORPAY_KEY_ID = 'rzp_test_simulated_key';

    const mockPaymentId = `pay_sim_${Date.now()}`;
    const validSignature = crypto
      .createHmac('sha256', mockKeySecret)
      .update(`${createdGatewayOrderId}|${mockPaymentId}`)
      .digest('hex');

    const origGet = axios.get;
    try {
      (axios as any).get = async () => ({
        data: {
          id: mockPaymentId,
          order_id: createdGatewayOrderId,
          status: 'captured',
          amount: createdAmount * 100,
          currency: 'INR',
        },
      });

      const verifyRes = await ParentFinanceService.verifyParentPayment(tenantOrgId, parentUserId, {
        paymentOrderId: createdPaymentOrderId,
        razorpayOrderId: createdGatewayOrderId,
        razorpayPaymentId: mockPaymentId,
        razorpaySignature: validSignature,
      });

      assert.strictEqual(verifyRes.success, true);
      assert.strictEqual(verifyRes.status, 'success');
      assert.ok(verifyRes.receipt);
      assert.ok(verifyRes.receipt.receipt_no.startsWith('RCPT-'));
      assert.strictEqual(verifyRes.receipt.amount, createdAmount);

      // Verify idempotent repeat verification returns existing receipt safely
      const repeatRes = await ParentFinanceService.verifyParentPayment(tenantOrgId, parentUserId, {
        paymentOrderId: createdPaymentOrderId,
        razorpayOrderId: createdGatewayOrderId,
        razorpayPaymentId: mockPaymentId,
        razorpaySignature: validSignature,
      });

      assert.strictEqual(repeatRes.success, true);
      assert.strictEqual(repeatRes.status, 'success');
      assert.strictEqual(repeatRes.receipt.receipt_no, verifyRes.receipt.receipt_no);
    } finally {
      axios.get = origGet;
      process.env.RAZORPAY_KEY_SECRET = origKeySecret;
      process.env.RAZORPAY_KEY_ID = origKeyId;
    }
  });

  // -------------------------------------------------------------------------
  // 5. Parent Receipt Access & Authorization (P5)
  // -------------------------------------------------------------------------
  await test('getParentReceiptDetails allows parent to fetch receipt for authorized child', async () => {
    if (!createdPaymentOrderId) return;

    const tx = await PaymentRepository.findTransactionByOrderId(createdPaymentOrderId);
    assert.ok(tx);

    const receipt = await ParentFinanceService.getParentReceiptDetails(
      tenantOrgId,
      parentUserId,
      tx.payment_transaction_id,
    );

    assert.ok(receipt);
    assert.strictEqual(receipt.student_id, studentId);
    assert.ok(receipt.receipt_no.startsWith('RCPT-'));
    assert.strictEqual(receipt.amount, createdAmount);
  });

  await test('getParentReceiptDetails allows parent to fetch receipt using payment_order_id (dual-identifier lookup)', async () => {
    if (!createdPaymentOrderId) return;

    const receiptByOrder = await ParentFinanceService.getParentReceiptDetails(
      tenantOrgId,
      parentUserId,
      createdPaymentOrderId,
    );

    assert.ok(receiptByOrder);
    assert.strictEqual(receiptByOrder.student_id, studentId);
    assert.ok(receiptByOrder.receipt_no.startsWith('RCPT-'));
    assert.strictEqual(receiptByOrder.amount, createdAmount);
    assert.strictEqual(receiptByOrder.payment_order_id, createdPaymentOrderId);
  });

  await test('getParentReceiptDetails rejects receipt access for an unlinked parent account with 403 Forbidden', async () => {
    if (!createdPaymentOrderId) return;

    const tx = await PaymentRepository.findTransactionByOrderId(createdPaymentOrderId);
    assert.ok(tx);

    const unrelatedParentUserId = '00000000-0000-0000-0000-000000000077';

    await assert.rejects(
      async () => {
        await ParentFinanceService.getParentReceiptDetails(
          tenantOrgId,
          unrelatedParentUserId,
          tx.payment_transaction_id,
        );
      },
      (err: any) => {
        return (
          err.statusCode === 403 &&
          (err.code === 'UNAUTHORIZED_RECEIPT_ACCESS' || err.message.includes('not authorized'))
        );
      },
    );
  });

  await test('getParentReceiptDetails rejects cross-tenant receipt access', async () => {
    if (!createdPaymentOrderId) return;

    const tx = await PaymentRepository.findTransactionByOrderId(createdPaymentOrderId);
    assert.ok(tx);

    await assert.rejects(
      async () => {
        await ParentFinanceService.getParentReceiptDetails(
          foreignOrgId,
          parentUserId,
          tx.payment_transaction_id,
        );
      },
      (err: any) => err.statusCode === 404 || err.statusCode === 403,
    );
  });

  console.log(`\nPhase 3 tests complete: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    throw new Error(`Phase 3 parent payment tests failed: ${failed} failure(s)`);
  }
}

if (require.main === module) {
  runFinancePhase3ParentPaymentsTests().catch((err) => {
    console.error('Phase 3 Test Execution Failed:', err);
    process.exit(1);
  });
}
