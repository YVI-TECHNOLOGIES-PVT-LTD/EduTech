import assert from 'assert';
import crypto from 'crypto';
import axios from 'axios';
import { ParentFinanceService } from '../services/ParentFinanceService';
import { PaymentCollectionService } from '../services/PaymentCollectionService';
import { RazorpayGatewayService } from '../services/RazorpayGatewayService';
import { PaymentRepository } from '../repositories/PaymentRepository';
import prisma from '../../../lib/prismaClient';
import { razorpayRouter } from '../../../routes/razorpay.routes';
import express from 'express';

export async function runFinancePhase3HardeningTests() {
  console.log('=====================================================');
  console.log('   PHASE 3.1: PAYMENT INTEGRITY HARDENING TESTS      ');
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

  // Setup test environment
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

  async function createTestChargeAndDue(
    amount = 1000,
  ): Promise<{ chargeId: string; dueId: string }> {
    const chargeRows: any = await prisma.$queryRaw`
      INSERT INTO student_charges (student_charge_id, student_id, source_type, description, amount, status)
      VALUES (gen_random_uuid(), ${studentId}::uuid, 'other'::financial_charge_source, 'Phase 3.1 Hardening Test Charge', ${amount}::numeric, 'active'::student_charge_status)
      RETURNING student_charge_id;
    `;
    const chargeId = chargeRows[0].student_charge_id;

    const dueRows: any = await prisma.$queryRaw`
      INSERT INTO student_charge_dues (student_charge_due_id, student_charge_id, due_date, amount_due, status)
      VALUES (gen_random_uuid(), ${chargeId}::uuid, CURRENT_DATE + INTERVAL '30 days', ${amount}::numeric, 'pending'::student_charge_due_status)
      RETURNING student_charge_due_id;
    `;
    return { chargeId, dueId: dueRows[0].student_charge_due_id };
  }

  // -------------------------------------------------------------------------
  // 1. PI-01: Gateway Captured Amount Validation
  // -------------------------------------------------------------------------
  await test('fetchAndVerifyPayment rejects valid signature with wrong captured amount (PI-01)', async () => {
    const origKeySecret = process.env.RAZORPAY_KEY_SECRET;
    const origKeyId = process.env.RAZORPAY_KEY_ID;
    process.env.RAZORPAY_KEY_SECRET = 'test_secret_key_31';
    process.env.RAZORPAY_KEY_ID = 'rzp_test_key_31';

    const origGet = axios.get;
    try {
      (axios as any).get = async () => ({
        data: {
          id: 'pay_amount_mismatch_1',
          order_id: 'order_gw_test_1',
          status: 'captured',
          amount: 50000, // ₹500
          currency: 'INR',
        },
      });

      // Expecting ₹1000 (100000 paise), but gateway captured ₹500
      const check = await RazorpayGatewayService.fetchAndVerifyPayment(
        'pay_amount_mismatch_1',
        'order_gw_test_1',
        1000, // expected ₹1000
        'INR',
      );

      assert.strictEqual(check.verified, false);
      assert.ok(check.error?.includes('Gateway amount mismatch'));
    } finally {
      axios.get = origGet;
      process.env.RAZORPAY_KEY_SECRET = origKeySecret;
      process.env.RAZORPAY_KEY_ID = origKeyId;
    }
  });

  // -------------------------------------------------------------------------
  // 2. PI-02: Gateway Currency Validation
  // -------------------------------------------------------------------------
  await test('fetchAndVerifyPayment rejects captured payment with wrong currency (PI-02)', async () => {
    const origKeySecret = process.env.RAZORPAY_KEY_SECRET;
    const origKeyId = process.env.RAZORPAY_KEY_ID;
    process.env.RAZORPAY_KEY_SECRET = 'test_secret_key_31';
    process.env.RAZORPAY_KEY_ID = 'rzp_test_key_31';

    const origGet = axios.get;
    try {
      (axios as any).get = async () => ({
        data: {
          id: 'pay_curr_mismatch_1',
          order_id: 'order_gw_test_2',
          status: 'captured',
          amount: 50000,
          currency: 'USD', // Gateway returned USD
        },
      });

      // Expected currency INR
      const check = await RazorpayGatewayService.fetchAndVerifyPayment(
        'pay_curr_mismatch_1',
        'order_gw_test_2',
        500,
        'INR',
      );

      assert.strictEqual(check.verified, false);
      assert.ok(check.error?.includes('Gateway currency mismatch'));
    } finally {
      axios.get = origGet;
      process.env.RAZORPAY_KEY_SECRET = origKeySecret;
      process.env.RAZORPAY_KEY_ID = origKeyId;
    }
  });

  // -------------------------------------------------------------------------
  // 3. PI-03: Payment ID Replay Protection Across Transactions
  // -------------------------------------------------------------------------
  await test('verifyOnlinePayment rejects replayed payment ID already settled on another transaction (PI-03)', async () => {
    const { dueId: targetDueId } = await createTestChargeAndDue(500);

    // Find an existing settled transaction with a gateway_transaction_id
    const settledTx = await prisma.payment_transactions.findFirst({
      where: {
        status: 'success',
        gateway_transaction_id: { not: null },
      },
      select: {
        payment_transaction_id: true,
        gateway_transaction_id: true,
      },
    });

    if (!settledTx || !settledTx.gateway_transaction_id) return;

    // Create a new distinct order
    const orderRes = await PaymentCollectionService.createOnlinePaymentOrder(
      tenantOrgId,
      parentUserId,
      {
        studentId,
        studentChargeDueId: targetDueId,
        amount: 100,
        paymentMethod: 'card',
      },
    );

    assert.ok(orderRes.order.payment_order_id);

    // Try to verify the new order using the ALREADY settled gateway_transaction_id
    await assert.rejects(
      async () => {
        await PaymentCollectionService.verifyOnlinePayment(tenantOrgId, parentUserId, {
          paymentOrderId: orderRes.order.payment_order_id,
          razorpayOrderId: orderRes.order.gateway_order_id,
          razorpayPaymentId: settledTx.gateway_transaction_id,
          razorpaySignature: 'sim_valid_sig_replay_test',
        });
      },
      (err: any) => {
        return (
          err.statusCode === 400 &&
          (err.code === 'PAYMENT_ID_ALREADY_USED' ||
            err.message.includes('already settled against another order'))
        );
      },
    );
  });

  // -------------------------------------------------------------------------
  // 4. PI-01 & PI-02 in Webhook Pipeline
  // -------------------------------------------------------------------------
  await test('processWebhook rejects payment amount mismatch against order (PI-01)', async () => {
    const { dueId: targetDueId } = await createTestChargeAndDue(500);

    const orderRes = await PaymentCollectionService.createOnlinePaymentOrder(
      tenantOrgId,
      parentUserId,
      {
        studentId,
        studentChargeDueId: targetDueId,
        amount: 250,
        paymentMethod: 'card',
      },
    );

    const origWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const testSecret = 'whsec_test_hardening_01';
    process.env.RAZORPAY_WEBHOOK_SECRET = testSecret;

    try {
      const eventId = `evt_amount_mismatch_${Date.now()}`;
      const payload = {
        id: eventId,
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: `pay_mismatch_${Date.now()}`,
              order_id: orderRes.order.gateway_order_id,
              status: 'captured',
              amount: 10000, // 10000 paise (₹100) != order amount 25000 paise (₹250)
              currency: 'INR',
            },
          },
        },
      };

      const rawBody = Buffer.from(JSON.stringify(payload), 'utf8');
      const signature = crypto.createHmac('sha256', testSecret).update(rawBody).digest('hex');

      const result = await RazorpayGatewayService.processWebhook(rawBody, signature, payload);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.status, 'failed');
      assert.ok(result.message.includes('Amount mismatch'));
    } finally {
      process.env.RAZORPAY_WEBHOOK_SECRET = origWebhookSecret;
    }
  });

  await test('processWebhook rejects payment currency mismatch against order (PI-02)', async () => {
    const { dueId: targetDueId } = await createTestChargeAndDue(500);

    const orderRes = await PaymentCollectionService.createOnlinePaymentOrder(
      tenantOrgId,
      parentUserId,
      {
        studentId,
        studentChargeDueId: targetDueId,
        amount: 300,
        paymentMethod: 'card',
      },
    );

    const origWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const testSecret = 'whsec_test_hardening_02';
    process.env.RAZORPAY_WEBHOOK_SECRET = testSecret;

    try {
      const eventId = `evt_curr_mismatch_${Date.now()}`;
      const payload = {
        id: eventId,
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: `pay_curr_gw_${Date.now()}`,
              order_id: orderRes.order.gateway_order_id,
              status: 'captured',
              amount: 30000, // ₹300 matches
              currency: 'EUR', // EUR != INR
            },
          },
        },
      };

      const rawBody = Buffer.from(JSON.stringify(payload), 'utf8');
      const signature = crypto.createHmac('sha256', testSecret).update(rawBody).digest('hex');

      const result = await RazorpayGatewayService.processWebhook(rawBody, signature, payload);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.status, 'failed');
      assert.ok(result.message.includes('Currency mismatch'));
    } finally {
      process.env.RAZORPAY_WEBHOOK_SECRET = origWebhookSecret;
    }
  });

  // -------------------------------------------------------------------------
  // 5. PI-04: Concurrent Callback & Webhook Race Idempotency
  // -------------------------------------------------------------------------
  await test('concurrent verifyOnlinePayment and webhook delivery idempotently settle once without duplicate allocation (PI-04)', async () => {
    const { dueId: targetDueId } = await createTestChargeAndDue(500);

    const orderRes = await PaymentCollectionService.createOnlinePaymentOrder(
      tenantOrgId,
      parentUserId,
      {
        studentId,
        studentChargeDueId: targetDueId,
        amount: 150,
        paymentMethod: 'card',
      },
    );

    const orderId = orderRes.order.gateway_order_id;
    const sharedPaymentId = `pay_race_${Date.now()}`;
    const origWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const testSecret = 'whsec_test_race';
    process.env.RAZORPAY_WEBHOOK_SECRET = testSecret;

    try {
      const payload = {
        id: `evt_race_${Date.now()}`,
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: sharedPaymentId,
              order_id: orderId,
              status: 'captured',
              amount: 15000,
              currency: 'INR',
            },
          },
        },
      };

      const rawBody = Buffer.from(JSON.stringify(payload), 'utf8');
      const signature = crypto.createHmac('sha256', testSecret).update(rawBody).digest('hex');

      // Execute both verifyOnlinePayment and processWebhook concurrently
      const [cbResult, whResult] = await Promise.all([
        PaymentCollectionService.verifyOnlinePayment(tenantOrgId, parentUserId, {
          paymentOrderId: orderRes.order.payment_order_id,
          razorpayOrderId: orderId,
          razorpayPaymentId: sharedPaymentId,
          razorpaySignature: 'sim_valid_sig_race',
        }).catch((err) => ({ error: err.message })),
        RazorpayGatewayService.processWebhook(rawBody, signature, payload).catch((err) => ({
          error: err.message,
        })),
      ]);

      // Assert: Exactly one created the allocation, the other safely recognized duplicate/alreadyCommitted
      const allocations = await prisma.payment_allocations.findMany({
        where: {
          payment_transactions: {
            payment_order_id: orderRes.order.payment_order_id,
          },
        },
      });

      assert.strictEqual(allocations.length, 1, 'Only one allocation record must be created');
      assert.strictEqual(Number(allocations[0].allocated_amount), 150);
    } finally {
      process.env.RAZORPAY_WEBHOOK_SECRET = origWebhookSecret;
    }
  });

  // -------------------------------------------------------------------------
  // 6. PI-05: Out-of-Order Failure Downgrade Protection
  // -------------------------------------------------------------------------
  await test('late payment.failed event received after successful capture does NOT regress transaction status (PI-05)', async () => {
    const { dueId: targetDueId } = await createTestChargeAndDue(500);

    const orderRes = await PaymentCollectionService.createOnlinePaymentOrder(
      tenantOrgId,
      parentUserId,
      {
        studentId,
        studentChargeDueId: targetDueId,
        amount: 200,
        paymentMethod: 'card',
      },
    );

    const creds = RazorpayGatewayService.getCredentials();
    const mockPaymentId = `pay_late_fail_${Date.now()}`;
    const validSignature = creds.isConfigured
      ? crypto
          .createHmac('sha256', creds.keySecret)
          .update(`${orderRes.order.gateway_order_id}|${mockPaymentId}`)
          .digest('hex')
      : 'sim_valid_sig_late_fail';

    const origGet = axios.get;
    try {
      (axios as any).get = async () => ({
        data: {
          id: mockPaymentId,
          order_id: orderRes.order.gateway_order_id,
          status: 'captured',
          amount: 200 * 100,
          currency: 'INR',
        },
      });

      // Settle the payment
      const verifyRes = await PaymentCollectionService.verifyOnlinePayment(
        tenantOrgId,
        parentUserId,
        {
          paymentOrderId: orderRes.order.payment_order_id,
          razorpayOrderId: orderRes.order.gateway_order_id,
          razorpayPaymentId: mockPaymentId,
          razorpaySignature: validSignature,
        },
      );

      assert.strictEqual(verifyRes.status, 'success');
    } finally {
      axios.get = origGet;
    }

    // Simulate late arriving payment.failed webhook
    const origWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const testSecret = 'whsec_late_fail';
    process.env.RAZORPAY_WEBHOOK_SECRET = testSecret;

    try {
      const payload = {
        id: `evt_late_fail_${Date.now()}`,
        event: 'payment.failed',
        payload: {
          payment: {
            entity: {
              id: mockPaymentId,
              order_id: orderRes.order.gateway_order_id,
              error_code: 'BAD_REQUEST_ERROR',
              error_description: 'Payment timed out',
            },
          },
        },
      };

      const rawBody = Buffer.from(JSON.stringify(payload), 'utf8');
      const signature = crypto.createHmac('sha256', testSecret).update(rawBody).digest('hex');

      const whRes = await RazorpayGatewayService.processWebhook(rawBody, signature, payload);
      assert.strictEqual(whRes.status, 'ignored');

      // Verify transaction remains in success status
      const tx = await PaymentRepository.findTransactionByOrderId(orderRes.order.payment_order_id);
      assert.ok(tx);
      assert.strictEqual(
        tx.status,
        'success',
        'Transaction status must not regress from success to failed',
      );
    } finally {
      process.env.RAZORPAY_WEBHOOK_SECRET = origWebhookSecret;
    }
  });

  // -------------------------------------------------------------------------
  // 7. PI-07: Refund Webhook Safe Ingestion (Documented Limitation)
  // -------------------------------------------------------------------------
  await test('gateway refund event (refund.created) is ignored safely without ledger corruption (PI-07)', async () => {
    const origWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const testSecret = 'whsec_refund_test';
    process.env.RAZORPAY_WEBHOOK_SECRET = testSecret;

    try {
      const payload = {
        id: `evt_refund_${Date.now()}`,
        event: 'refund.created',
        payload: {
          refund: {
            entity: {
              id: `rfnd_${Date.now()}`,
              amount: 50000,
              currency: 'INR',
              payment_id: `pay_test_${Date.now()}`,
            },
          },
        },
      };

      const rawBody = Buffer.from(JSON.stringify(payload), 'utf8');
      const signature = crypto.createHmac('sha256', testSecret).update(rawBody).digest('hex');

      const whRes = await RazorpayGatewayService.processWebhook(rawBody, signature, payload);
      assert.strictEqual(whRes.success, true);
      assert.strictEqual(whRes.status, 'ignored');
      assert.ok(whRes.message.includes('ignored safely'));
    } finally {
      process.env.RAZORPAY_WEBHOOK_SECRET = origWebhookSecret;
    }
  });

  // -------------------------------------------------------------------------
  // 8. PI-09: Receipt Authorization & Status Verification
  // -------------------------------------------------------------------------
  await test('unauthorized receipt access for pending or failed transactions is rejected with 400 (PI-09)', async () => {
    const { dueId: targetDueId } = await createTestChargeAndDue(500);

    // Create an unverified order (in initiated/pending status)
    const orderRes = await PaymentCollectionService.createOnlinePaymentOrder(
      tenantOrgId,
      parentUserId,
      {
        studentId,
        studentChargeDueId: targetDueId,
        amount: 100,
        paymentMethod: 'card',
      },
    );

    const tx = await PaymentRepository.findTransactionByOrderId(orderRes.order.payment_order_id);
    assert.ok(tx);
    assert.strictEqual(tx.status, 'initiated');

    await assert.rejects(
      async () => {
        await ParentFinanceService.getParentReceiptDetails(
          tenantOrgId,
          parentUserId,
          tx.payment_transaction_id,
        );
      },
      (err: any) => {
        return (
          err.statusCode === 400 &&
          err.message.includes('Receipt is not available for unconfirmed or pending transactions')
        );
      },
    );
  });

  // -------------------------------------------------------------------------
  // 9. PI-10: Mobile Hosted Checkout Page Generation & Razorpay Standard Script Embedding
  // -------------------------------------------------------------------------
  await test('hosted checkout page serves valid mobile HTML embedding checkout.js and handles 404 (PI-10)', async () => {
    const { dueId: targetDueId } = await createTestChargeAndDue(750);

    const orderRes = await PaymentCollectionService.createOnlinePaymentOrder(
      tenantOrgId,
      parentUserId,
      {
        studentId,
        studentChargeDueId: targetDueId,
        amount: 750,
        paymentMethod: 'card',
      },
    );

    assert.ok(orderRes.order.payment_order_id);
    const checkoutUrl = (orderRes.order as any).checkout_url || (orderRes as any).checkout_url;
    assert.ok(checkoutUrl, 'createOnlinePaymentOrder must return checkout_url');
    assert.ok(checkoutUrl.includes(orderRes.order.payment_order_id));

    // Mount razorpayRouter on ephemeral express server
    const app = express();
    app.use(express.json());
    app.use('/', razorpayRouter);

    const server: any = await new Promise((resolve) => {
      const s = app.listen(0, '127.0.0.1', () => resolve(s));
    });
    const port = server.address().port;

    try {
      // 1. Valid order returns 200 and mobile-optimized HTML
      const checkoutRes = await axios.get(
        `http://127.0.0.1:${port}/razorpay/checkout/${orderRes.order.payment_order_id}`,
      );
      assert.strictEqual(checkoutRes.status, 200);
      assert.ok(
        checkoutRes.data.includes('https://checkout.razorpay.com/v1/checkout.js'),
        'Must include Razorpay Checkout script',
      );
      assert.ok(checkoutRes.data.includes('openRazorpay()'), 'Must include openRazorpay function');
      assert.ok(
        checkoutRes.data.includes('edutrack://parent/fees'),
        'Must support deep link redirect to app scheme',
      );
      assert.ok(
        checkoutRes.data.includes(orderRes.order.payment_order_id),
        'Must contain the paymentOrderId',
      );

      // 2. Non-existent order returns 404
      try {
        await axios.get(
          `http://127.0.0.1:${port}/razorpay/checkout/00000000-0000-0000-0000-000000000000`,
        );
        assert.fail('Non-existent order must return 404');
      } catch (err: any) {
        assert.strictEqual(err.response?.status, 404);
        assert.ok(err.response?.data?.includes('Payment Order Not Found'));
      }
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // -------------------------------------------------------------------------
  // 10. PI-11: Advisory Lock Concurrency Protection across Transactions for Same Payment ID
  // -------------------------------------------------------------------------
  await test('concurrent verification with identical payment ID across different orders is serialized by advisory lock and rejected with PAYMENT_ID_ALREADY_USED (PI-11)', async () => {
    // Create two separate test dues and orders
    const { dueId: dueId1 } = await createTestChargeAndDue(300);
    const { dueId: dueId2 } = await createTestChargeAndDue(300);

    const orderRes1 = await PaymentCollectionService.createOnlinePaymentOrder(
      tenantOrgId,
      parentUserId,
      {
        studentId,
        studentChargeDueId: dueId1,
        amount: 300,
        paymentMethod: 'card',
      },
    );

    const orderRes2 = await PaymentCollectionService.createOnlinePaymentOrder(
      tenantOrgId,
      parentUserId,
      {
        studentId,
        studentChargeDueId: dueId2,
        amount: 300,
        paymentMethod: 'card',
      },
    );

    const sharedPaymentId = `pay_concur_advisory_${Date.now()}`;
    const creds = RazorpayGatewayService.getCredentials();

    const sig1 =
      creds.isConfigured && creds.keySecret
        ? crypto
            .createHmac('sha256', creds.keySecret)
            .update(`${orderRes1.order.gateway_order_id}|${sharedPaymentId}`)
            .digest('hex')
        : 'sim_valid_sig_concur_1';

    const sig2 =
      creds.isConfigured && creds.keySecret
        ? crypto
            .createHmac('sha256', creds.keySecret)
            .update(`${orderRes2.order.gateway_order_id}|${sharedPaymentId}`)
            .digest('hex')
        : 'sim_valid_sig_concur_2';

    // Mock axios.get to return a valid captured payment for this shared payment ID
    const origGet = axios.get;
    try {
      (axios as any).get = async () => ({
        data: {
          id: sharedPaymentId,
          status: 'captured',
          amount: 30000, // ₹300
          currency: 'INR',
        },
      });

      // Launch both verification requests concurrently
      const verify1 = PaymentCollectionService.verifyOnlinePayment(tenantOrgId, parentUserId, {
        paymentOrderId: orderRes1.order.payment_order_id,
        razorpayOrderId: orderRes1.order.gateway_order_id,
        razorpayPaymentId: sharedPaymentId,
        razorpaySignature: sig1,
      });

      const verify2 = PaymentCollectionService.verifyOnlinePayment(tenantOrgId, parentUserId, {
        paymentOrderId: orderRes2.order.payment_order_id,
        razorpayOrderId: orderRes2.order.gateway_order_id,
        razorpayPaymentId: sharedPaymentId,
        razorpaySignature: sig2,
      });

      const [res1, res2] = await Promise.allSettled([verify1, verify2]);

      // Exactly one should be fulfilled and one rejected with PAYMENT_ID_ALREADY_USED
      const fulfilled = [res1, res2].filter((r) => r.status === 'fulfilled');
      const rejected = [res1, res2].filter(
        (r) => r.status === 'rejected',
      ) as PromiseRejectedResult[];

      assert.strictEqual(fulfilled.length, 1, 'Exactly one concurrent verification must succeed');
      assert.strictEqual(
        rejected.length,
        1,
        'Exactly one concurrent verification must be rejected',
      );

      const rejectedError = rejected[0].reason;
      assert.strictEqual(
        rejectedError.statusCode,
        400,
        'Rejected concurrent request must return statusCode 400',
      );
      assert.ok(
        rejectedError.code === 'PAYMENT_ID_ALREADY_USED' ||
          rejectedError.message.includes('already settled against another order'),
        `Expected PAYMENT_ID_ALREADY_USED error, got: ${rejectedError.message}`,
      );

      // Verify in DB that only 1 transaction has status 'success' for this payment ID
      const settledCount = await prisma.payment_transactions.count({
        where: {
          gateway_transaction_id: sharedPaymentId,
          status: 'success',
        },
      });
      assert.strictEqual(
        settledCount,
        1,
        'Database must record exactly one successful transaction for the payment ID',
      );
    } finally {
      axios.get = origGet;
    }
  });

  console.log(`\nPhase 3.1 Hardening tests complete: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    throw new Error(`Phase 3.1 Hardening tests failed: ${failed} failure(s)`);
  }
}

if (require.main === module) {
  runFinancePhase3HardeningTests().catch((err) => {
    console.error('Phase 3.1 Hardening Test Execution Failed:', err);
    process.exit(1);
  });
}
