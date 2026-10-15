import assert from 'assert';
import crypto from 'crypto';
import axios from 'axios';
import http from 'http';
import { app } from '../app';
import { RazorpayGatewayService } from '../modules/fees/services/RazorpayGatewayService';
import { PaymentRepository } from '../modules/fees/repositories/PaymentRepository';
import prisma from '../lib/prismaClient';
import { EventBus } from '../workflows/event-bus.service';
import { FinanceEventType } from '../modules/fees/events/finance.events';

export async function runRazorpayStandardCheckoutTests() {
  console.log('=====================================================');
  console.log('  RAZORPAY STANDARD WEB CHECKOUT HARDENED TEST SUITE ');
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

  // Start test server on random ephemeral port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_edutrack_webhook_secret_2026';

  try {
    // -------------------------------------------------------------------------
    // 1. Configuration & Security Isolation
    // -------------------------------------------------------------------------
    await test('GET /api/razorpay/config returns public key_id without secret', async () => {
      const res = await axios.get(`${baseUrl}/api/razorpay/config`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.key_id, keyId);
      assert.strictEqual(res.data.key_secret, undefined, 'Must NEVER expose key_secret');
      assert.strictEqual(res.data.webhook_secret, undefined, 'Must NEVER expose webhook_secret');
    });

    // -------------------------------------------------------------------------
    // 2. Order Creation & Parameter Validation
    // -------------------------------------------------------------------------
    await test('POST /api/create-order rejects amount less than 100 paise', async () => {
      try {
        await axios.post(`${baseUrl}/api/create-order`, { amount: 50 });
        assert.fail('Expected 400 for amount < 100 paise');
      } catch (err: any) {
        assert.strictEqual(err.response?.status, 400);
        assert.strictEqual(err.response?.data?.error, 'INVALID_AMOUNT');
      }
    });

    await test('POST /api/create-order rejects negative and non-integer amounts', async () => {
      try {
        await axios.post(`${baseUrl}/api/create-order`, { amount: -500 });
        assert.fail('Expected 400 for negative amount');
      } catch (err: any) {
        assert.strictEqual(err.response?.status, 400);
      }

      try {
        await axios.post(`${baseUrl}/api/create-order`, { amount: 150.75 });
        assert.fail('Expected 400 for non-integer paise');
      } catch (err: any) {
        assert.strictEqual(err.response?.status, 400);
      }
    });

    await test('POST /api/create-order rejects unsupported currencies', async () => {
      try {
        await axios.post(`${baseUrl}/api/create-order`, {
          amount: 50000,
          currency: 'USD',
        });
        assert.fail('Expected 400 for unsupported currency');
      } catch (err: any) {
        assert.strictEqual(err.response?.status, 400);
        assert.strictEqual(err.response?.data?.error, 'UNSUPPORTED_CURRENCY');
      }
    });

    let liveOrderId = '';
    await test('POST /api/create-order creates verified demo order with truthful status', async () => {
      const res = await axios.post(`${baseUrl}/api/create-order`, {
        amount: 25000, // ₹250
        currency: 'INR',
        receipt: `test_rcpt_${Date.now()}`,
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(res.data.order_id);
      assert.ok(res.data.order_id.startsWith('order_'));
      assert.strictEqual(res.data.amount, 25000);
      assert.strictEqual(res.data.currency, 'INR');
      assert.strictEqual(res.data.is_demo, true);
      assert.strictEqual(
        res.data.notice,
        'Gateway payment verified — demo only; EduTrack ledger not updated.'
      );

      liveOrderId = res.data.order_id;
    });

    // -------------------------------------------------------------------------
    // 3. Signature Verification & Cryptographic Guarantees
    // -------------------------------------------------------------------------
    await test('POST /api/verify-payment rejects missing required fields', async () => {
      try {
        await axios.post(`${baseUrl}/api/verify-payment`, {
          razorpay_order_id: liveOrderId || 'order_test_123',
        });
        assert.fail('Expected 400 for missing fields');
      } catch (err: any) {
        assert.strictEqual(err.response?.status, 400);
        assert.strictEqual(err.response?.data?.error, 'MISSING_FIELDS');
      }
    });

    await test('POST /api/verify-payment rejects tampered signature', async () => {
      try {
        await axios.post(`${baseUrl}/api/verify-payment`, {
          razorpay_order_id: liveOrderId || 'order_test_123',
          razorpay_payment_id: 'pay_test_tampered_123',
          razorpay_signature: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        });
        assert.fail('Expected 400 for signature mismatch');
      } catch (err: any) {
        assert.strictEqual(err.response?.status, 400);
        assert.strictEqual(err.response?.data?.error, 'SIGNATURE_MISMATCH');
      }
    });

    await test('POST /api/verify-payment rejects uncaptured payment even with valid signature', async () => {
      // Create a valid cryptographic signature for an uncaptured/fictitious payment ID
      const fakePaymentId = 'pay_fictitious_not_captured_999999';
      const validSig = crypto
        .createHmac('sha256', keySecret)
        .update(`${liveOrderId}|${fakePaymentId}`)
        .digest('hex');

      try {
        await axios.post(`${baseUrl}/api/verify-payment`, {
          razorpay_order_id: liveOrderId,
          razorpay_payment_id: fakePaymentId,
          razorpay_signature: validSig,
        });
        assert.fail('Expected failure because payment does not exist / not captured on gateway');
      } catch (err: any) {
        // Must reject because signature verification alone is NOT proof of payment!
        assert.ok([400, 503].includes(err.response?.status));
      }
    });

    // -------------------------------------------------------------------------
    // 4. Webhook Ingestion & Signature Verification
    // -------------------------------------------------------------------------
    await test('POST /api/razorpay/webhook rejects requests missing signature header', async () => {
      try {
        await axios.post(`${baseUrl}/api/razorpay/webhook`, { event: 'payment.captured' });
        assert.fail('Expected 400 for missing signature header');
      } catch (err: any) {
        assert.strictEqual(err.response?.status, 400);
        assert.strictEqual(err.response?.data?.error, 'MISSING_SIGNATURE');
      }
    });

    await test('POST /api/razorpay/webhook rejects invalid webhook signatures', async () => {
      try {
        await axios.post(
          `${baseUrl}/api/razorpay/webhook`,
          { event: 'payment.captured', id: 'evt_test_123' },
          { headers: { 'x-razorpay-signature': 'invalid_webhook_sig_hex' } }
        );
        assert.fail('Expected 400 for invalid signature');
      } catch (err: any) {
        assert.strictEqual(err.response?.status, 400);
      }
    });

    await test('POST /api/razorpay/webhook safely handles valid webhook signatures and duplicate events', async () => {
      const webhookPayload = JSON.stringify({
        id: `evt_test_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_webhook_test_123',
              order_id: liveOrderId,
              amount: 25000,
              currency: 'INR',
              status: 'captured',
            },
          },
        },
      });

      const validWebhookSig = crypto
        .createHmac('sha256', webhookSecret)
        .update(Buffer.from(webhookPayload, 'utf8'))
        .digest('hex');

      const res = await axios.post(`${baseUrl}/api/razorpay/webhook`, JSON.parse(webhookPayload), {
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': validWebhookSig,
        },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);

      // Duplicate delivery test: Send exact same webhook payload again
      const dupRes = await axios.post(`${baseUrl}/api/razorpay/webhook`, JSON.parse(webhookPayload), {
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': validWebhookSig,
        },
      });

      assert.strictEqual(dupRes.status, 200);
      assert.strictEqual(dupRes.data.success, true);
      assert.strictEqual(dupRes.data.data?.status, 'duplicate');
    });

    // -------------------------------------------------------------------------
    // 5. Root Aliases & Replay Protection
    // -------------------------------------------------------------------------
    await test('POST /create-order root route alias resolves identically', async () => {
      const res = await axios.post(`${baseUrl}/create-order`, {
        amount: 15000,
        currency: 'INR',
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(res.data.order_id);
    });

    // -------------------------------------------------------------------------
    // 6. Persistence, Concurrency, Allocation & Webhook Race Verification
    // -------------------------------------------------------------------------
    const origAxiosGet = axios.get;
    const mockGatewayPayments = new Map<string, any>();

    (axios as any).get = async (url: string, config?: any) => {
      const match = url.match(/\/payments\/([a-zA-Z0-9_]+)/);
      if (match && mockGatewayPayments.has(match[1])) {
        return {
          status: 200,
          data: mockGatewayPayments.get(match[1]),
        };
      }
      return origAxiosGet(url, config);
    };

    try {
      let targetOrgId = '00000000-0000-0000-0000-000000000001';
      let targetStudentId = '';
      let targetDueId = '';

      const existingStudent = await prisma.students.findFirst({ select: { student_id: true, org_id: true } });
      if (existingStudent) {
        targetOrgId = existingStudent.org_id;
        targetStudentId = existingStudent.student_id;

        const chargeRows: any = await prisma.$queryRaw`
          INSERT INTO student_charges (student_charge_id, student_id, source_type, description, amount, status)
          VALUES (gen_random_uuid(), ${targetStudentId}::uuid, 'other'::financial_charge_source, 'Concurrency Hardening Test Fee', 1000.0, 'active'::student_charge_status)
          RETURNING student_charge_id;
        `;
        const chargeId = chargeRows[0].student_charge_id;

        const dueRows: any = await prisma.$queryRaw`
          INSERT INTO student_charge_dues (student_charge_due_id, student_charge_id, amount_due, due_date, status)
          VALUES (gen_random_uuid(), ${chargeId}::uuid, 1000.0, CURRENT_DATE, 'pending'::student_charge_due_status)
          RETURNING student_charge_due_id;
        `;
        targetDueId = dueRows[0].student_charge_due_id;
      }

      const createTestDue = async (amount: number = 500) => {
        const chargeRows: any = await prisma.$queryRaw`
          INSERT INTO student_charges (student_charge_id, student_id, source_type, description, amount, status)
          VALUES (gen_random_uuid(), ${targetStudentId}::uuid, 'other'::financial_charge_source, 'Test Obligation', ${amount}::float8, 'active'::student_charge_status)
          RETURNING student_charge_id;
        `;
        const dueRows: any = await prisma.$queryRaw`
          INSERT INTO student_charge_dues (student_charge_due_id, student_charge_id, amount_due, due_date, status)
          VALUES (gen_random_uuid(), ${chargeRows[0].student_charge_id}::uuid, ${amount}::float8, CURRENT_DATE, 'pending'::student_charge_due_status)
          RETURNING student_charge_due_id;
        `;
        return dueRows[0].student_charge_due_id;
      };

      let committedTxId1 = '';
      let committedOrderId1 = '';
      let rzpOrderId1 = '';
      let rzpPaymentId1 = '';
      let validSig1 = '';

      await test('Atomic persistence: verify-payment commits transaction, order, and partial allocation', async () => {
        if (!targetDueId) return;

        rzpOrderId1 = `order_test_harden_1_${Date.now()}`;
        rzpPaymentId1 = `pay_test_harden_1_${Date.now()}`;

        // Create local payment order and transaction
        const orderRecord = await PaymentRepository.createPaymentOrder({
          orgId: targetOrgId,
          studentId: targetStudentId,
          studentChargeDueId: targetDueId,
          amount: 400.0,
          currencyCode: 'INR',
          orderReference: `ORD-HD1-${Date.now()}`,
          paymentMethod: 'razorpay',
        });
        committedOrderId1 = orderRecord.payment_order_id;

        const txRecord = await PaymentRepository.createPaymentTransaction({
          paymentOrderId: committedOrderId1,
          paymentMethod: 'upi',
          amount: 400.0,
          gatewayName: 'razorpay',
          gatewayOrderId: rzpOrderId1,
          status: 'initiated',
        });
        committedTxId1 = txRecord.payment_transaction_id;

        // Mock gateway response
        mockGatewayPayments.set(rzpPaymentId1, {
          id: rzpPaymentId1,
          order_id: rzpOrderId1,
          status: 'captured',
          amount: 40000,
          currency: 'INR',
        });

        validSig1 = crypto
          .createHmac('sha256', keySecret)
          .update(`${rzpOrderId1}|${rzpPaymentId1}`)
          .digest('hex');

        const res = await axios.post(`${baseUrl}/api/verify-payment`, {
          razorpay_order_id: rzpOrderId1,
          razorpay_payment_id: rzpPaymentId1,
          razorpay_signature: validSig1,
        });

        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.status, 'committed');
        assert.strictEqual(res.data.ledger_updated, true);
        assert.strictEqual(res.data.transaction_id, committedTxId1);
        assert.ok(res.data.receipt_number);

        // Verify database persistence
        const txInDb: any[] = await prisma.$queryRaw`
          SELECT status, gateway_transaction_id FROM payment_transactions WHERE payment_transaction_id = ${committedTxId1}::uuid;
        `;
        assert.strictEqual(txInDb[0].status, 'success');
        assert.strictEqual(txInDb[0].gateway_transaction_id, rzpPaymentId1);

        const orderInDb: any[] = await prisma.$queryRaw`
          SELECT status FROM payment_orders WHERE payment_order_id = ${committedOrderId1}::uuid;
        `;
        assert.strictEqual(orderInDb[0].status, 'paid');

        // Check allocation and partial due status
        const allocations: any[] = await prisma.$queryRaw`
          SELECT allocated_amount FROM payment_allocations WHERE payment_transaction_id = ${committedTxId1}::uuid;
        `;
        assert.strictEqual(allocations.length, 1);
        assert.strictEqual(Number(allocations[0].allocated_amount), 400.0);

        const dueInDb: any[] = await prisma.$queryRaw`
          SELECT status FROM student_charge_dues WHERE student_charge_due_id = ${targetDueId}::uuid;
        `;
        assert.strictEqual(dueInDb[0].status, 'partially_paid');
      });

      await test('Duplicate verification returns existing committed result without duplicate allocation', async () => {
        if (!targetDueId || !rzpOrderId1) return;

        const res = await axios.post(`${baseUrl}/api/verify-payment`, {
          razorpay_order_id: rzpOrderId1,
          razorpay_payment_id: rzpPaymentId1,
          razorpay_signature: validSig1,
        });

        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.status, 'committed');
        assert.strictEqual(res.data.ledger_updated, true);
        assert.strictEqual(res.data.transaction_id, committedTxId1);

        // Assert no duplicate allocation was created
        const allocations: any[] = await prisma.$queryRaw`
          SELECT payment_allocation_id FROM payment_allocations WHERE payment_transaction_id = ${committedTxId1}::uuid;
        `;
        assert.strictEqual(allocations.length, 1);
      });

      let committedTxId2 = '';
      await test('Concurrent verification requests handle race conditions safely via row-level locks', async () => {
        if (!targetDueId) return;

        const rzpOrderId2 = `order_test_conc_2_${Date.now()}`;
        const rzpPaymentId2 = `pay_test_conc_2_${Date.now()}`;

        const orderRecord = await PaymentRepository.createPaymentOrder({
          orgId: targetOrgId,
          studentId: targetStudentId,
          studentChargeDueId: targetDueId,
          amount: 300.0,
          currencyCode: 'INR',
          orderReference: `ORD-CONC2-${Date.now()}`,
          paymentMethod: 'razorpay',
        });

        const txRecord = await PaymentRepository.createPaymentTransaction({
          paymentOrderId: orderRecord.payment_order_id,
          paymentMethod: 'card',
          amount: 300.0,
          gatewayName: 'razorpay',
          gatewayOrderId: rzpOrderId2,
          status: 'initiated',
        });
        committedTxId2 = txRecord.payment_transaction_id;

        mockGatewayPayments.set(rzpPaymentId2, {
          id: rzpPaymentId2,
          order_id: rzpOrderId2,
          status: 'captured',
          amount: 30000,
          currency: 'INR',
        });

        const sig2 = crypto
          .createHmac('sha256', keySecret)
          .update(`${rzpOrderId2}|${rzpPaymentId2}`)
          .digest('hex');

        // Fire 2 concurrent verification calls simultaneously
        const [res1, res2] = await Promise.all([
          axios.post(`${baseUrl}/api/verify-payment`, {
            razorpay_order_id: rzpOrderId2,
            razorpay_payment_id: rzpPaymentId2,
            razorpay_signature: sig2,
          }),
          axios.post(`${baseUrl}/api/verify-payment`, {
            razorpay_order_id: rzpOrderId2,
            razorpay_payment_id: rzpPaymentId2,
            razorpay_signature: sig2,
          }),
        ]);

        assert.strictEqual(res1.status, 200);
        assert.strictEqual(res2.status, 200);
        assert.strictEqual(res1.data.status, 'committed');
        assert.strictEqual(res2.data.status, 'committed');

        // Exactly one allocation must exist for this transaction
        const allocations: any[] = await prisma.$queryRaw`
          SELECT payment_allocation_id FROM payment_allocations WHERE payment_transaction_id = ${committedTxId2}::uuid;
        `;
        assert.strictEqual(allocations.length, 1);
      });

      await test('Cumulative allocation: final installment transitions due to "paid" via getTotalAllocatedForDue', async () => {
        if (!targetDueId) return;

        // Current cumulative: 400 + 300 = 700. Adding remaining 300 reaches 1000.0 (full settlement)
        const rzpOrderId3 = `order_test_settle_3_${Date.now()}`;
        const rzpPaymentId3 = `pay_test_settle_3_${Date.now()}`;

        const orderRecord = await PaymentRepository.createPaymentOrder({
          orgId: targetOrgId,
          studentId: targetStudentId,
          studentChargeDueId: targetDueId,
          amount: 300.0,
          currencyCode: 'INR',
          orderReference: `ORD-SETTLE3-${Date.now()}`,
          paymentMethod: 'razorpay',
        });

        await PaymentRepository.createPaymentTransaction({
          paymentOrderId: orderRecord.payment_order_id,
          paymentMethod: 'card',
          amount: 300.0,
          gatewayName: 'razorpay',
          gatewayOrderId: rzpOrderId3,
          status: 'initiated',
        });

        mockGatewayPayments.set(rzpPaymentId3, {
          id: rzpPaymentId3,
          order_id: rzpOrderId3,
          status: 'captured',
          amount: 30000,
          currency: 'INR',
        });

        const sig3 = crypto
          .createHmac('sha256', keySecret)
          .update(`${rzpOrderId3}|${rzpPaymentId3}`)
          .digest('hex');

        const res = await axios.post(`${baseUrl}/api/verify-payment`, {
          razorpay_order_id: rzpOrderId3,
          razorpay_payment_id: rzpPaymentId3,
          razorpay_signature: sig3,
        });

        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.status, 'committed');

        // Due must now be fully 'paid'
        const dueInDb: any[] = await prisma.$queryRaw`
          SELECT status FROM student_charge_dues WHERE student_charge_due_id = ${targetDueId}::uuid;
        `;
        assert.strictEqual(dueInDb[0].status, 'paid');
      });

      await test('Checkout / Webhook race converges on 1 authoritative transaction and allocation', async () => {
        if (!targetDueId) return;

        const raceDueId = await createTestDue(100.0);
        const rzpOrderId4 = `order_test_race_4_${Date.now()}`;
        const rzpPaymentId4 = `pay_test_race_4_${Date.now()}`;

        const orderRecord = await PaymentRepository.createPaymentOrder({
          orgId: targetOrgId,
          studentId: targetStudentId,
          studentChargeDueId: raceDueId,
          amount: 50.0,
          currencyCode: 'INR',
          orderReference: `ORD-RACE4-${Date.now()}`,
          paymentMethod: 'razorpay',
        });

        const txRecord = await PaymentRepository.createPaymentTransaction({
          paymentOrderId: orderRecord.payment_order_id,
          paymentMethod: 'upi',
          amount: 50.0,
          gatewayName: 'razorpay',
          gatewayOrderId: rzpOrderId4,
          status: 'initiated',
        });

        mockGatewayPayments.set(rzpPaymentId4, {
          id: rzpPaymentId4,
          order_id: rzpOrderId4,
          status: 'captured',
          amount: 5000,
          currency: 'INR',
        });

        const checkoutSig = crypto
          .createHmac('sha256', keySecret)
          .update(`${rzpOrderId4}|${rzpPaymentId4}`)
          .digest('hex');

        const webhookPayload = JSON.stringify({
          id: `evt_race_hw_${Date.now()}`,
          event: 'payment.captured',
          payload: {
            payment: {
              entity: {
                id: rzpPaymentId4,
                order_id: rzpOrderId4,
                amount: 5000,
                currency: 'INR',
                status: 'captured',
              },
            },
          },
        });

        const webhookSig = crypto
          .createHmac('sha256', webhookSecret)
          .update(Buffer.from(webhookPayload, 'utf8'))
          .digest('hex');

        // Fire both checkout verification and webhook ingestion concurrently
        const [checkoutRes, webhookRes] = await Promise.all([
          axios.post(`${baseUrl}/api/verify-payment`, {
            razorpay_order_id: rzpOrderId4,
            razorpay_payment_id: rzpPaymentId4,
            razorpay_signature: checkoutSig,
          }),
          axios.post(`${baseUrl}/api/razorpay/webhook`, JSON.parse(webhookPayload), {
            headers: {
              'Content-Type': 'application/json',
              'x-razorpay-signature': webhookSig,
            },
          }),
        ]);

        assert.strictEqual(checkoutRes.status, 200);
        assert.strictEqual(webhookRes.status, 200);

        // Assert exactly 1 allocation was inserted
        const allocations: any[] = await prisma.$queryRaw`
          SELECT payment_allocation_id FROM payment_allocations WHERE payment_transaction_id = ${txRecord.payment_transaction_id}::uuid;
        `;
        assert.strictEqual(allocations.length, 1);
      });

      await test('Late payment.failed webhook cannot downgrade an already captured/committed success', async () => {
        if (!targetDueId || !rzpOrderId1) return;

        const lateFailPayload = JSON.stringify({
          id: `evt_late_fail_${Date.now()}`,
          event: 'payment.failed',
          payload: {
            payment: {
              entity: {
                id: `pay_failed_late_${Date.now()}`,
                order_id: rzpOrderId1,
                status: 'failed',
              },
            },
          },
        });

        const lateFailSig = crypto
          .createHmac('sha256', webhookSecret)
          .update(Buffer.from(lateFailPayload, 'utf8'))
          .digest('hex');

        const res = await axios.post(`${baseUrl}/api/razorpay/webhook`, JSON.parse(lateFailPayload), {
          headers: {
            'Content-Type': 'application/json',
            'x-razorpay-signature': lateFailSig,
          },
        });

        assert.strictEqual(res.status, 200);

        // Transaction must remain 'success' without downgrade
        const txInDb: any[] = await prisma.$queryRaw`
          SELECT status FROM payment_transactions WHERE payment_transaction_id = ${committedTxId1}::uuid;
        `;
        assert.strictEqual(txInDb[0].status, 'success');
      });

      await test('Amount mismatch between order amount and gateway paise is rejected with 400', async () => {
        if (!targetDueId) return;

        const rzpOrderId5 = `order_test_mismatch_5_${Date.now()}`;
        const rzpPaymentId5 = `pay_test_mismatch_5_${Date.now()}`;

        const orderRecord = await PaymentRepository.createPaymentOrder({
          orgId: targetOrgId,
          studentId: targetStudentId,
          studentChargeDueId: targetDueId,
          amount: 100.0, // Expected: 10,000 paise
          currencyCode: 'INR',
          orderReference: `ORD-MISMATCH5-${Date.now()}`,
          paymentMethod: 'razorpay',
        });

        const txRecord = await PaymentRepository.createPaymentTransaction({
          paymentOrderId: orderRecord.payment_order_id,
          paymentMethod: 'upi',
          amount: 100.0,
          gatewayName: 'razorpay',
          gatewayOrderId: rzpOrderId5,
          status: 'initiated',
        });

        // Gateway returns 20,000 paise (₹200) instead of expected 10,000 paise (₹100)
        mockGatewayPayments.set(rzpPaymentId5, {
          id: rzpPaymentId5,
          order_id: rzpOrderId5,
          status: 'captured',
          amount: 20000,
          currency: 'INR',
        });

        const sig5 = crypto
          .createHmac('sha256', keySecret)
          .update(`${rzpOrderId5}|${rzpPaymentId5}`)
          .digest('hex');

        try {
          await axios.post(`${baseUrl}/api/verify-payment`, {
            razorpay_order_id: rzpOrderId5,
            razorpay_payment_id: rzpPaymentId5,
            razorpay_signature: sig5,
          });
          assert.fail('Expected 400 for AMOUNT_MISMATCH');
        } catch (err: any) {
          assert.strictEqual(err.response?.status, 400);
          assert.strictEqual(err.response?.data?.error, 'AMOUNT_MISMATCH');
        }

        // Transaction remains initiated
        const txInDb: any[] = await prisma.$queryRaw`
          SELECT status FROM payment_transactions WHERE payment_transaction_id = ${txRecord.payment_transaction_id}::uuid;
        `;
        assert.strictEqual(txInDb[0].status, 'initiated');
      });

      await test('Currency mismatch (non-INR) is rejected without mutating financial records', async () => {
        if (!targetDueId) return;

        const rzpOrderId6 = `order_test_currmis_6_${Date.now()}`;
        const rzpPaymentId6 = `pay_test_currmis_6_${Date.now()}`;

        const orderRecord = await PaymentRepository.createPaymentOrder({
          orgId: targetOrgId,
          studentId: targetStudentId,
          studentChargeDueId: targetDueId,
          amount: 50.0,
          currencyCode: 'INR',
          orderReference: `ORD-CURR6-${Date.now()}`,
          paymentMethod: 'razorpay',
        });

        await PaymentRepository.createPaymentTransaction({
          paymentOrderId: orderRecord.payment_order_id,
          paymentMethod: 'card',
          amount: 50.0,
          gatewayName: 'razorpay',
          gatewayOrderId: rzpOrderId6,
          status: 'initiated',
        });

        mockGatewayPayments.set(rzpPaymentId6, {
          id: rzpPaymentId6,
          order_id: rzpOrderId6,
          status: 'captured',
          amount: 5000,
          currency: 'USD', // Mismatched currency
        });

        const sig6 = crypto
          .createHmac('sha256', keySecret)
          .update(`${rzpOrderId6}|${rzpPaymentId6}`)
          .digest('hex');

        try {
          await axios.post(`${baseUrl}/api/verify-payment`, {
            razorpay_order_id: rzpOrderId6,
            razorpay_payment_id: rzpPaymentId6,
            razorpay_signature: sig6,
          });
          assert.fail('Expected 400 for CURRENCY_MISMATCH');
        } catch (err: any) {
          assert.strictEqual(err.response?.status, 400);
          assert.strictEqual(err.response?.data?.error, 'CURRENCY_MISMATCH');
        }
      });

      await test('Tenant isolation: Receipt lookup prevents foreign tenant access', async () => {
        if (!committedTxId1) return;

        const foreignReceipt = await PaymentRepository.getReceiptDetails(
          '00000000-0000-0000-0000-999999999999',
          committedTxId1
        );
        assert.strictEqual(foreignReceipt, null);

        const authorizedReceipt = await PaymentRepository.getReceiptDetails(
          targetOrgId,
          committedTxId1
        );
        assert.ok(authorizedReceipt);
        assert.strictEqual(authorizedReceipt.payment_transaction_id, committedTxId1);
      });

      await test('Notification idempotency: PAYMENT_SUCCESS is emitted only once and not on duplicate verification', async () => {
        if (!targetDueId) return;

        const notifDueId = await createTestDue(100.0);
        const rzpOrderId7 = `order_test_notif_7_${Date.now()}`;
        const rzpPaymentId7 = `pay_test_notif_7_${Date.now()}`;

        const orderRecord = await PaymentRepository.createPaymentOrder({
          orgId: targetOrgId,
          studentId: targetStudentId,
          studentChargeDueId: notifDueId,
          amount: 25.0,
          currencyCode: 'INR',
          orderReference: `ORD-NOTIF7-${Date.now()}`,
          paymentMethod: 'razorpay',
        });

        const txRecord = await PaymentRepository.createPaymentTransaction({
          paymentOrderId: orderRecord.payment_order_id,
          paymentMethod: 'upi',
          amount: 25.0,
          gatewayName: 'razorpay',
          gatewayOrderId: rzpOrderId7,
          status: 'initiated',
        });

        mockGatewayPayments.set(rzpPaymentId7, {
          id: rzpPaymentId7,
          order_id: rzpOrderId7,
          status: 'captured',
          amount: 2500,
          currency: 'INR',
        });

        const sig7 = crypto
          .createHmac('sha256', keySecret)
          .update(`${rzpOrderId7}|${rzpPaymentId7}`)
          .digest('hex');

        let successEventCount = 0;
        const testHandler = async (payload: any) => {
          if (payload.sourceEntityId === txRecord.payment_transaction_id) {
            successEventCount++;
          }
        };

        EventBus.subscribe(FinanceEventType.PAYMENT_SUCCESS, testHandler);

        try {
          // First verification (newly committed)
          await axios.post(`${baseUrl}/api/verify-payment`, {
            razorpay_order_id: rzpOrderId7,
            razorpay_payment_id: rzpPaymentId7,
            razorpay_signature: sig7,
          });

          // Allow asynchronous microtask event dispatch
          await new Promise((r) => setTimeout(r, 50));
          assert.strictEqual(successEventCount, 1);

          // Duplicate verification
          await axios.post(`${baseUrl}/api/verify-payment`, {
            razorpay_order_id: rzpOrderId7,
            razorpay_payment_id: rzpPaymentId7,
            razorpay_signature: sig7,
          });

          await new Promise((r) => setTimeout(r, 50));
          // Count must still be 1 (no duplicate notification!)
          assert.strictEqual(successEventCount, 1);
        } finally {
          EventBus.unsubscribe(FinanceEventType.PAYMENT_SUCCESS, testHandler);
        }
      });

      await test('Notification subscriber failure does not rollback or alter committed payment', async () => {
        if (!targetDueId) return;

        const errNotifDueId = await createTestDue(100.0);
        const rzpOrderId8 = `order_test_errnotif_8_${Date.now()}`;
        const rzpPaymentId8 = `pay_test_errnotif_8_${Date.now()}`;

        const orderRecord = await PaymentRepository.createPaymentOrder({
          orgId: targetOrgId,
          studentId: targetStudentId,
          studentChargeDueId: errNotifDueId,
          amount: 25.0,
          currencyCode: 'INR',
          orderReference: `ORD-ERRNOTIF8-${Date.now()}`,
          paymentMethod: 'razorpay',
        });

        const txRecord = await PaymentRepository.createPaymentTransaction({
          paymentOrderId: orderRecord.payment_order_id,
          paymentMethod: 'upi',
          amount: 25.0,
          gatewayName: 'razorpay',
          gatewayOrderId: rzpOrderId8,
          status: 'initiated',
        });

        mockGatewayPayments.set(rzpPaymentId8, {
          id: rzpPaymentId8,
          order_id: rzpOrderId8,
          status: 'captured',
          amount: 2500,
          currency: 'INR',
        });

        const sig8 = crypto
          .createHmac('sha256', keySecret)
          .update(`${rzpOrderId8}|${rzpPaymentId8}`)
          .digest('hex');

        // Register intentionally failing subscriber
        const failingHandler = async () => {
          throw new Error('Notification downstream email transport timeout');
        };
        EventBus.subscribe(FinanceEventType.PAYMENT_SUCCESS, failingHandler);

        try {
          const res = await axios.post(`${baseUrl}/api/verify-payment`, {
            razorpay_order_id: rzpOrderId8,
            razorpay_payment_id: rzpPaymentId8,
            razorpay_signature: sig8,
          });

          assert.strictEqual(res.status, 200);
          assert.strictEqual(res.data.status, 'committed');

          // Ensure transaction persisted successfully in database
          const txInDb: any[] = await prisma.$queryRaw`
            SELECT status FROM payment_transactions WHERE payment_transaction_id = ${txRecord.payment_transaction_id}::uuid;
          `;
          assert.strictEqual(txInDb[0].status, 'success');
        } finally {
          EventBus.unsubscribe(FinanceEventType.PAYMENT_SUCCESS, failingHandler);
        }
      });

      await test('Safe retry of a failed webhook event succeeds on redelivery', async () => {
        const retryEventId = `evt_retry_${Date.now()}`;

        // Create webhook record with status 'failed'
        await PaymentRepository.createWebhookEvent({
          providerName: 'razorpay',
          providerEventId: retryEventId,
          eventType: 'payment.captured',
          payload: { id: retryEventId },
          status: 'failed',
        });

        // Now resend the webhook event
        const retryPayload = JSON.stringify({
          id: retryEventId,
          event: 'payment.captured',
          payload: {
            payment: {
              entity: {
                id: `pay_retry_${Date.now()}`,
                order_id: `order_fake_${Date.now()}`,
                amount: 1000,
                currency: 'INR',
                status: 'captured',
              },
            },
          },
        });

        const retrySig = crypto
          .createHmac('sha256', webhookSecret)
          .update(Buffer.from(retryPayload, 'utf8'))
          .digest('hex');

        const res = await axios.post(`${baseUrl}/api/razorpay/webhook`, JSON.parse(retryPayload), {
          headers: {
            'Content-Type': 'application/json',
            'x-razorpay-signature': retrySig,
          },
        });

        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
      });

      // =======================================================================
      // PHASE 6.2 FINAL ACCEPTANCE AUDIT TESTS
      // =======================================================================

      // -----------------------------------------------------------------------
      // AUDIT REQUIREMENT 1: Webhook Raw-Body Integrity
      // -----------------------------------------------------------------------
      await test('[Audit 1.1] Webhook rejection if raw body is unavailable or empty', async () => {
        // Direct Service call test
        try {
          await RazorpayGatewayService.processWebhook(Buffer.alloc(0), 'dummy_sig', {});
          assert.fail('Expected error for empty rawBody buffer');
        } catch (err: any) {
          assert.strictEqual(err.code || err.message, 'RAW_BODY_UNAVAILABLE');
          assert.strictEqual(err.statusCode, 400);
        }

        try {
          await RazorpayGatewayService.processWebhook('', 'dummy_sig', {});
          assert.fail('Expected error for empty rawBody string');
        } catch (err: any) {
          assert.strictEqual(err.code || err.message, 'RAW_BODY_UNAVAILABLE');
          assert.strictEqual(err.statusCode, 400);
        }

        // HTTP endpoint test: Send empty body with signature header
        try {
          await axios.post(`${baseUrl}/api/razorpay/webhook`, '', {
            headers: {
              'Content-Type': 'application/json',
              'x-razorpay-signature': 'some_sig',
            },
          });
          assert.fail('Expected 400 for empty body request');
        } catch (err: any) {
          assert.strictEqual(err.response?.status, 400);
          assert.ok(
            err.response?.data?.error === 'RAW_BODY_UNAVAILABLE' ||
            err.response?.data?.error === 'VALIDATION_ERROR',
            `Expected RAW_BODY_UNAVAILABLE or VALIDATION_ERROR, got ${err.response?.data?.error}`
          );
        }
      });

      await test('[Audit 1.2] Webhook signature verification over original raw bytes with whitespace succeeds', async () => {
        const formattedPayload = '{\n  "id": "evt_ws_' + Date.now() + '",\n  "event": "payment.captured",\n  "entity": "event"\n}';
        const genuineSig = crypto
          .createHmac('sha256', webhookSecret)
          .update(Buffer.from(formattedPayload, 'utf8'))
          .digest('hex');

        // Verify service directly against original raw string bytes
        const isValid = RazorpayGatewayService.verifyWebhookSignature(formattedPayload, genuineSig);
        assert.strictEqual(isValid, true, 'Original bytes with whitespace must verify successfully');

        // HTTP endpoint: Send raw formatted string
        const res = await axios.post(`${baseUrl}/api/razorpay/webhook`, formattedPayload, {
          headers: {
            'Content-Type': 'application/json',
            'x-razorpay-signature': genuineSig,
          },
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
      });

      await test('[Audit 1.3] Whitespace or key-order tampering invalidates signature without stringify fallback', async () => {
        // Original signed payload
        const originalPayload = '{"id":"evt_order_' + Date.now() + '","event":"payment.captured"}';
        const signatureOverOriginal = crypto
          .createHmac('sha256', webhookSecret)
          .update(Buffer.from(originalPayload, 'utf8'))
          .digest('hex');

        // Tamper 1: Re-ordered keys
        const reorderedPayload = '{"event":"payment.captured","id":"evt_order_' + Date.now() + '"}';
        const isReorderedValid = RazorpayGatewayService.verifyWebhookSignature(reorderedPayload, signatureOverOriginal);
        assert.strictEqual(isReorderedValid, false, 'Re-ordered keys must fail signature verification');

        // Tamper 2: Added whitespace
        const whitespaceTampered = '{\n  "id": "evt_order_' + Date.now() + '",\n  "event": "payment.captured"\n}';
        const isWhitespaceValid = RazorpayGatewayService.verifyWebhookSignature(whitespaceTampered, signatureOverOriginal);
        assert.strictEqual(isWhitespaceValid, false, 'Altered whitespace must fail signature verification');

        // HTTP endpoint: Sending re-ordered payload with original signature fails
        try {
          await axios.post(`${baseUrl}/api/razorpay/webhook`, reorderedPayload, {
            headers: {
              'Content-Type': 'application/json',
              'x-razorpay-signature': signatureOverOriginal,
            },
          });
          assert.fail('Expected 400 for tampered key order');
        } catch (err: any) {
          assert.strictEqual(err.response?.status, 400);
          assert.strictEqual(err.response?.data?.error, 'WEBHOOK_VERIFICATION_FAILED');
        }
      });

      // -----------------------------------------------------------------------
      // AUDIT REQUIREMENT 2: Concurrent Payments Against the Same Fee Due
      // -----------------------------------------------------------------------
      await test('[Audit 2.1] Concurrent payments on same due: serialized via row-lock, over-allocation rejected with 409 & reconciliation flag', async () => {
        if (!targetDueId) return;

        // Create an isolated fee due of ₹1,000
        const concurrentDueId = await createTestDue(1000.0);

        // Transaction 1: ₹600
        const orderId1 = `order_conc_1_${Date.now()}`;
        const payId1 = `pay_conc_1_${Date.now()}`;
        const order1 = await PaymentRepository.createPaymentOrder({
          orgId: targetOrgId,
          studentId: targetStudentId,
          studentChargeDueId: concurrentDueId,
          amount: 600.0,
          currencyCode: 'INR',
          orderReference: `ORD-CONC1-${Date.now()}`,
          paymentMethod: 'razorpay',
        });
        const tx1 = await PaymentRepository.createPaymentTransaction({
          paymentOrderId: order1.payment_order_id,
          paymentMethod: 'card',
          amount: 600.0,
          gatewayName: 'razorpay',
          gatewayOrderId: orderId1,
          status: 'initiated',
        });

        // Transaction 2: ₹600 (Total = ₹1,200 > ₹1,000 due!)
        const orderId2 = `order_conc_2_${Date.now()}`;
        const payId2 = `pay_conc_2_${Date.now()}`;
        const order2 = await PaymentRepository.createPaymentOrder({
          orgId: targetOrgId,
          studentId: targetStudentId,
          studentChargeDueId: concurrentDueId,
          amount: 600.0,
          currencyCode: 'INR',
          orderReference: `ORD-CONC2-${Date.now()}`,
          paymentMethod: 'razorpay',
        });
        const tx2 = await PaymentRepository.createPaymentTransaction({
          paymentOrderId: order2.payment_order_id,
          paymentMethod: 'upi',
          amount: 600.0,
          gatewayName: 'razorpay',
          gatewayOrderId: orderId2,
          status: 'initiated',
        });

        // Mock gateway responses for both transactions
        mockGatewayPayments.set(payId1, {
          id: payId1,
          order_id: orderId1,
          status: 'captured',
          amount: 60000,
          currency: 'INR',
        });
        mockGatewayPayments.set(payId2, {
          id: payId2,
          order_id: orderId2,
          status: 'captured',
          amount: 60000,
          currency: 'INR',
        });

        const sig1 = crypto.createHmac('sha256', keySecret).update(`${orderId1}|${payId1}`).digest('hex');
        const sig2 = crypto.createHmac('sha256', keySecret).update(`${orderId2}|${payId2}`).digest('hex');

        // Launch both transactions concurrently against the real PostgreSQL database!
        const [res1, res2] = await Promise.allSettled([
          axios.post(`${baseUrl}/api/verify-payment`, {
            razorpay_order_id: orderId1,
            razorpay_payment_id: payId1,
            razorpay_signature: sig1,
          }),
          axios.post(`${baseUrl}/api/verify-payment`, {
            razorpay_order_id: orderId2,
            razorpay_payment_id: payId2,
            razorpay_signature: sig2,
          }),
        ]);

        const successful = [res1, res2].filter((r) => r.status === 'fulfilled');
        const rejected = [res1, res2].filter((r) => r.status === 'rejected');

        // Exactly one should succeed with 200, and one should fail with 409
        assert.strictEqual(successful.length, 1, 'Exactly one concurrent payment must commit');
        assert.strictEqual(rejected.length, 1, 'The competing over-allocating transaction must be safely rejected');

        const successRes = (successful[0] as PromiseFulfilledResult<any>).value;
        assert.strictEqual(successRes.status, 200);
        assert.strictEqual(successRes.data.status, 'committed');

        const rejectErr = (rejected[0] as PromiseRejectedResult).reason;
        assert.strictEqual(rejectErr.response?.status, 409);
        assert.strictEqual(rejectErr.response?.data?.error, 'EXCEEDS_REMAINING_DUE');

        // Verify total allocations in database strictly equals ₹600 (cannot exceed eligible balance)
        const allocationsInDb: any[] = await prisma.$queryRaw`
          SELECT SUM(allocated_amount)::float8 as total_allocated
          FROM payment_allocations
          WHERE student_charge_due_id = ${concurrentDueId}::uuid;
        `;
        assert.strictEqual(allocationsInDb[0].total_allocated, 600.0);

        // Verify due status is 'partially_paid' (₹400 remaining)
        const dueRow: any[] = await prisma.$queryRaw`
          SELECT status FROM student_charge_dues WHERE student_charge_due_id = ${concurrentDueId}::uuid;
        `;
        assert.strictEqual(dueRow[0].status, 'partially_paid');

        // Verify rejected transaction is recorded as pending reconciliation (funds captured, unallocated) in DB
        const rejectedTxId = rejectErr.response?.data?.transaction_id;
        assert.ok(rejectedTxId, 'Rejected transaction ID must be returned for reconciliation');
        assert.strictEqual(rejectErr.response?.data?.status, 'captured_unallocated');
        assert.strictEqual(rejectErr.response?.data?.gateway_captured, true);
        assert.strictEqual(rejectErr.response?.data?.ledger_updated, false);

        const rejectedTxRow: any[] = await prisma.$queryRaw`
          SELECT status, failure_code, gateway_response FROM payment_transactions WHERE payment_transaction_id = ${rejectedTxId}::uuid;
        `;
        assert.strictEqual(rejectedTxRow[0].status, 'pending', 'Captured funds must NOT be marked failed');
        assert.strictEqual(rejectedTxRow[0].failure_code, 'EXCEEDS_REMAINING_DUE');
      });

      await test('[Audit 2.2] Concurrent payments that cleanly sum to due: both commit and transition due to paid', async () => {
        if (!targetDueId) return;

        // Isolated due of ₹1,000
        const concurrentDueId2 = await createTestDue(1000.0);

        // Transaction A: ₹600
        const orderIdA = `order_conca_${Date.now()}`;
        const payIdA = `pay_conca_${Date.now()}`;
        const orderA = await PaymentRepository.createPaymentOrder({
          orgId: targetOrgId,
          studentId: targetStudentId,
          studentChargeDueId: concurrentDueId2,
          amount: 600.0,
          currencyCode: 'INR',
          orderReference: `ORD-CONCA-${Date.now()}`,
          paymentMethod: 'razorpay',
        });
        await PaymentRepository.createPaymentTransaction({
          paymentOrderId: orderA.payment_order_id,
          paymentMethod: 'card',
          amount: 600.0,
          gatewayName: 'razorpay',
          gatewayOrderId: orderIdA,
          status: 'initiated',
        });

        // Transaction B: ₹400 (Total = ₹1,000 exactly matches due!)
        const orderIdB = `order_concb_${Date.now()}`;
        const payIdB = `pay_concb_${Date.now()}`;
        const orderB = await PaymentRepository.createPaymentOrder({
          orgId: targetOrgId,
          studentId: targetStudentId,
          studentChargeDueId: concurrentDueId2,
          amount: 400.0,
          currencyCode: 'INR',
          orderReference: `ORD-CONCB-${Date.now()}`,
          paymentMethod: 'razorpay',
        });
        await PaymentRepository.createPaymentTransaction({
          paymentOrderId: orderB.payment_order_id,
          paymentMethod: 'upi',
          amount: 400.0,
          gatewayName: 'razorpay',
          gatewayOrderId: orderIdB,
          status: 'initiated',
        });

        mockGatewayPayments.set(payIdA, {
          id: payIdA,
          order_id: orderIdA,
          status: 'captured',
          amount: 60000,
          currency: 'INR',
        });
        mockGatewayPayments.set(payIdB, {
          id: payIdB,
          order_id: orderIdB,
          status: 'captured',
          amount: 40000,
          currency: 'INR',
        });

        const sigA = crypto.createHmac('sha256', keySecret).update(`${orderIdA}|${payIdA}`).digest('hex');
        const sigB = crypto.createHmac('sha256', keySecret).update(`${orderIdB}|${payIdB}`).digest('hex');

        // Run both concurrently
        const [resA, resB] = await Promise.all([
          axios.post(`${baseUrl}/api/verify-payment`, {
            razorpay_order_id: orderIdA,
            razorpay_payment_id: payIdA,
            razorpay_signature: sigA,
          }),
          axios.post(`${baseUrl}/api/verify-payment`, {
            razorpay_order_id: orderIdB,
            razorpay_payment_id: payIdB,
            razorpay_signature: sigB,
          }),
        ]);

        assert.strictEqual(resA.status, 200);
        assert.strictEqual(resB.status, 200);

        // Due must be fully paid and total allocations equal ₹1,000
        const totalAlloc: any[] = await prisma.$queryRaw`
          SELECT SUM(allocated_amount)::float8 as total_allocated
          FROM payment_allocations WHERE student_charge_due_id = ${concurrentDueId2}::uuid;
        `;
        assert.strictEqual(totalAlloc[0].total_allocated, 1000.0);

        const dueRow: any[] = await prisma.$queryRaw`
          SELECT status FROM student_charge_dues WHERE student_charge_due_id = ${concurrentDueId2}::uuid;
        `;
        assert.strictEqual(dueRow[0].status, 'paid');
      });

      // -----------------------------------------------------------------------
      // AUDIT REQUIREMENT 3: Authorized versus Captured Status
      // -----------------------------------------------------------------------
      await test('[Audit 3.1] Authorized-only payment cannot be committed or allocated', async () => {
        if (!targetDueId) return;

        const authDueId = await createTestDue(300.0);
        const rzpOrderIdAuth = `order_test_auth_${Date.now()}`;
        const rzpPaymentIdAuth = `pay_test_auth_${Date.now()}`;

        const orderRecord = await PaymentRepository.createPaymentOrder({
          orgId: targetOrgId,
          studentId: targetStudentId,
          studentChargeDueId: authDueId,
          amount: 300.0,
          currencyCode: 'INR',
          orderReference: `ORD-AUTH-${Date.now()}`,
          paymentMethod: 'razorpay',
        });

        const txRecord = await PaymentRepository.createPaymentTransaction({
          paymentOrderId: orderRecord.payment_order_id,
          paymentMethod: 'card',
          amount: 300.0,
          gatewayName: 'razorpay',
          gatewayOrderId: rzpOrderIdAuth,
          status: 'initiated',
        });

        // Gateway returns status: 'authorized' (NOT captured!)
        mockGatewayPayments.set(rzpPaymentIdAuth, {
          id: rzpPaymentIdAuth,
          order_id: rzpOrderIdAuth,
          status: 'authorized',
          amount: 30000,
          currency: 'INR',
        });

        const sigAuth = crypto
          .createHmac('sha256', keySecret)
          .update(`${rzpOrderIdAuth}|${rzpPaymentIdAuth}`)
          .digest('hex');

        try {
          await axios.post(`${baseUrl}/api/verify-payment`, {
            razorpay_order_id: rzpOrderIdAuth,
            razorpay_payment_id: rzpPaymentIdAuth,
            razorpay_signature: sigAuth,
          });
          assert.fail('Expected 400 PAYMENT_AUTHORIZED_NOT_CAPTURED');
        } catch (err: any) {
          assert.strictEqual(err.response?.status, 400);
          assert.strictEqual(err.response?.data?.error, 'PAYMENT_AUTHORIZED_NOT_CAPTURED');
        }

        // Local state MUST remain 'initiated' - zero allocations committed
        const txInDb: any[] = await prisma.$queryRaw`
          SELECT status FROM payment_transactions WHERE payment_transaction_id = ${txRecord.payment_transaction_id}::uuid;
        `;
        assert.strictEqual(txInDb[0].status, 'initiated');

        const allocs: any[] = await prisma.$queryRaw`
          SELECT COUNT(*)::int as count FROM payment_allocations WHERE payment_transaction_id = ${txRecord.payment_transaction_id}::uuid;
        `;
        assert.strictEqual(allocs[0].count, 0);
      });

      await test('[Audit 3.2] Webhook ignores payment.authorized and skips financial allocation', async () => {
        const authEventId = `evt_auth_${Date.now()}`;
        const authWebhookPayload = JSON.stringify({
          id: authEventId,
          event: 'payment.authorized',
          payload: {
            payment: {
              entity: {
                id: `pay_auth_webhook_${Date.now()}`,
                order_id: `order_auth_webhook_${Date.now()}`,
                amount: 30000,
                currency: 'INR',
                status: 'authorized',
              },
            },
          },
        });

        const authSig = crypto
          .createHmac('sha256', webhookSecret)
          .update(Buffer.from(authWebhookPayload, 'utf8'))
          .digest('hex');

        const res = await axios.post(`${baseUrl}/api/razorpay/webhook`, JSON.parse(authWebhookPayload), {
          headers: {
            'Content-Type': 'application/json',
            'x-razorpay-signature': authSig,
          },
        });

        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.data?.status, 'ignored');
      });

      await test('[Audit 3.3] Ambiguous or failed provider states are rejected', async () => {
        // Failed state
        const rzpOrderIdFail = `order_fail_${Date.now()}`;
        const rzpPaymentIdFail = `pay_fail_${Date.now()}`;
        mockGatewayPayments.set(rzpPaymentIdFail, {
          id: rzpPaymentIdFail,
          order_id: rzpOrderIdFail,
          status: 'failed',
          amount: 10000,
          currency: 'INR',
        });
        const sigFail = crypto.createHmac('sha256', keySecret).update(`${rzpOrderIdFail}|${rzpPaymentIdFail}`).digest('hex');

        try {
          await axios.post(`${baseUrl}/api/verify-payment`, {
            razorpay_order_id: rzpOrderIdFail,
            razorpay_payment_id: rzpPaymentIdFail,
            razorpay_signature: sigFail,
          });
          assert.fail('Expected 400 for status=failed');
        } catch (err: any) {
          assert.strictEqual(err.response?.status, 400);
          assert.strictEqual(err.response?.data?.error, 'PAYMENT_NOT_CAPTURED');
        }

        // Ambiguous state ('pending' or 'created')
        const rzpOrderIdPending = `order_pend_${Date.now()}`;
        const rzpPaymentIdPending = `pay_pend_${Date.now()}`;
        mockGatewayPayments.set(rzpPaymentIdPending, {
          id: rzpPaymentIdPending,
          order_id: rzpOrderIdPending,
          status: 'pending',
          amount: 10000,
          currency: 'INR',
        });
        const sigPending = crypto.createHmac('sha256', keySecret).update(`${rzpOrderIdPending}|${rzpPaymentIdPending}`).digest('hex');

        try {
          await axios.post(`${baseUrl}/api/verify-payment`, {
            razorpay_order_id: rzpOrderIdPending,
            razorpay_payment_id: rzpPaymentIdPending,
            razorpay_signature: sigPending,
          });
          assert.fail('Expected 400 for ambiguous status=pending');
        } catch (err: any) {
          assert.strictEqual(err.response?.status, 400);
          assert.strictEqual(err.response?.data?.error, 'PAYMENT_NOT_CAPTURED');
        }
      });

      // =======================================================================
      // PHASE 6.2.1 CAPTURED-PAYMENT RECONCILIATION & WEBHOOK RECOVERY AUDIT
      // =======================================================================

      // 1. Captured payment rejected for insufficient remaining due
      let unallocatedTxId = '';
      let unallocatedOrderId = '';
      let unallocatedPayId = '';
      let unallocatedSig = '';
      let unallocatedDueId = '';

      await test('[Audit 6.2.1 - 1] Captured payment rejected for insufficient remaining due', async () => {
        if (!targetStudentId) return;

        // Create fee due of ₹1,000
        unallocatedDueId = await createTestDue(1000.0);

        // Pre-allocate ₹800 to this due so remaining balance is ₹200
        const preOrderId = `order_pre_${Date.now()}`;
        const prePayId = `pay_pre_${Date.now()}`;
        const preOrder = await PaymentRepository.createPaymentOrder({
          orgId: targetOrgId,
          studentId: targetStudentId,
          studentChargeDueId: unallocatedDueId,
          amount: 800.0,
          currencyCode: 'INR',
          orderReference: `ORD-PRE-${Date.now()}`,
          paymentMethod: 'razorpay',
        });
        const preTx = await PaymentRepository.createPaymentTransaction({
          paymentOrderId: preOrder.payment_order_id,
          paymentMethod: 'card',
          amount: 800.0,
          gatewayName: 'razorpay',
          gatewayOrderId: preOrderId,
          gatewayTransactionId: prePayId,
          status: 'success',
          transactionDate: new Date(),
        });
        await PaymentRepository.createPaymentAllocation({
          paymentTransactionId: preTx.payment_transaction_id,
          studentChargeDueId: unallocatedDueId,
          allocatedAmount: 800.0,
          notes: 'Pre-allocation',
        });
        await PaymentRepository.updateDueStatus(unallocatedDueId, 'partially_paid');

        // Now initiate an authoritative payment order for ₹500 (exceeds ₹200 remaining due)
        unallocatedOrderId = `order_unalloc_${Date.now()}`;
        unallocatedPayId = `pay_unalloc_${Date.now()}`;
        const newOrder = await PaymentRepository.createPaymentOrder({
          orgId: targetOrgId,
          studentId: targetStudentId,
          studentChargeDueId: unallocatedDueId,
          amount: 500.0,
          currencyCode: 'INR',
          orderReference: `ORD-UNALLOC-${Date.now()}`,
          paymentMethod: 'razorpay',
        });
        const newTx = await PaymentRepository.createPaymentTransaction({
          paymentOrderId: newOrder.payment_order_id,
          paymentMethod: 'card',
          amount: 500.0,
          gatewayName: 'razorpay',
          gatewayOrderId: unallocatedOrderId,
          status: 'initiated',
        });
        unallocatedTxId = newTx.payment_transaction_id;

        // Mock authoritative gateway status as captured for ₹500
        mockGatewayPayments.set(unallocatedPayId, {
          id: unallocatedPayId,
          order_id: unallocatedOrderId,
          status: 'captured',
          amount: 50000,
          currency: 'INR',
        });

        unallocatedSig = crypto
          .createHmac('sha256', keySecret)
          .update(`${unallocatedOrderId}|${unallocatedPayId}`)
          .digest('hex');

        try {
          await axios.post(`${baseUrl}/api/verify-payment`, {
            razorpay_order_id: unallocatedOrderId,
            razorpay_payment_id: unallocatedPayId,
            razorpay_signature: unallocatedSig,
          });
          assert.fail('Expected 409 for payment exceeding remaining due');
        } catch (err: any) {
          assert.strictEqual(err.response?.status, 409);
          assert.strictEqual(err.response?.data?.error, 'EXCEEDS_REMAINING_DUE');
          assert.strictEqual(err.response?.data?.status, 'captured_unallocated');
          assert.strictEqual(err.response?.data?.gateway_captured, true);
          assert.strictEqual(err.response?.data?.ledger_updated, false);
          assert.strictEqual(err.response?.data?.remaining_due, 200.0);

          // Verify physical database representation:
          // Status must be 'pending' (preserves funds captured, NOT 'failed')
          const txInDb: any[] = await prisma.$queryRaw`
            SELECT status, gateway_transaction_id, failure_code, gateway_response
            FROM payment_transactions WHERE payment_transaction_id = ${unallocatedTxId}::uuid;
          `;
          assert.strictEqual(txInDb[0].status, 'pending');
          assert.strictEqual(txInDb[0].gateway_transaction_id, unallocatedPayId);
          assert.strictEqual(txInDb[0].failure_code, 'EXCEEDS_REMAINING_DUE');

          const orderInDb: any[] = await prisma.$queryRaw`
            SELECT status FROM payment_orders WHERE payment_order_id = ${newOrder.payment_order_id}::uuid;
          `;
          assert.strictEqual(orderInDb[0].status, 'pending');
        }
      });

      // 2. No partial allocation after an allocation failure
      await test('[Audit 6.2.1 - 2] No partial allocation after an allocation failure', async () => {
        if (!unallocatedTxId) return;

        // Verify zero allocations exist for this unallocated transaction
        const allocationsInDb: any[] = await prisma.$queryRaw`
          SELECT * FROM payment_allocations WHERE payment_transaction_id = ${unallocatedTxId}::uuid;
        `;
        assert.strictEqual(allocationsInDb.length, 0, 'Zero allocations must be committed on failure');

        // Verify due total allocation is strictly unchanged (still 800)
        const totalAllocated = await PaymentRepository.getTotalAllocatedForDue(unallocatedDueId);
        assert.strictEqual(totalAllocated, 800.0);

        // Verify due status remains partially_paid
        const dueRow: any[] = await prisma.$queryRaw`
          SELECT status FROM student_charge_dues WHERE student_charge_due_id = ${unallocatedDueId}::uuid;
        `;
        assert.strictEqual(dueRow[0].status, 'partially_paid');
      });

      // 3. Accurate distinction between gateway capture and ledger allocation
      await test('[Audit 6.2.1 - 3] Accurate distinction between gateway capture and ledger allocation', async () => {
        if (!unallocatedTxId) return;

        // Query tx record directly to verify reconciliation metadata
        const txInDb: any[] = await prisma.$queryRaw`
          SELECT status, gateway_transaction_id, failure_code, gateway_response
          FROM payment_transactions WHERE payment_transaction_id = ${unallocatedTxId}::uuid;
        `;
        const gwResp = txInDb[0].gateway_response;
        assert.strictEqual(txInDb[0].status, 'pending', 'Database status must be pending reconciliation');
        assert.strictEqual(gwResp.gateway_captured, true, 'Metadata must record gateway captured');
        assert.strictEqual(gwResp.ledger_allocated, false, 'Metadata must record ledger NOT allocated');
        assert.strictEqual(gwResp.reconciliation_required, true, 'Metadata must flag reconciliation required');
        assert.strictEqual(gwResp.reconciliation_reason, 'EXCEEDS_REMAINING_DUE');
      });

      // 4. Repeated verification of a captured-but-unallocated payment
      await test('[Audit 6.2.1 - 4] Repeated verification of a captured-but-unallocated payment', async () => {
        if (!unallocatedOrderId) return;

        // Resubmit the exact same verification request
        try {
          await axios.post(`${baseUrl}/api/verify-payment`, {
            razorpay_order_id: unallocatedOrderId,
            razorpay_payment_id: unallocatedPayId,
            razorpay_signature: unallocatedSig,
          });
          assert.fail('Expected 409 for repeated verification of captured-unallocated payment');
        } catch (err: any) {
          assert.strictEqual(err.response?.status, 409);
          assert.strictEqual(err.response?.data?.status, 'captured_unallocated');
          assert.strictEqual(err.response?.data?.gateway_captured, true);
          assert.strictEqual(err.response?.data?.ledger_updated, false);
          assert.strictEqual(err.response?.data?.error, 'EXCEEDS_REMAINING_DUE');

          // Ensure still ZERO allocations in database
          const allocationsInDb: any[] = await prisma.$queryRaw`
            SELECT * FROM payment_allocations WHERE payment_transaction_id = ${unallocatedTxId}::uuid;
          `;
          assert.strictEqual(allocationsInDb.length, 0);
        }
      });

      // 5. Duplicate webhook delivery after a failed database transaction
      await test('[Audit 6.2.1 - 5] Duplicate webhook delivery after a failed database transaction', async () => {
        if (!targetStudentId) return;

        const dueId5 = await createTestDue(600.0);
        const orderId5 = `order_wh_retry_${Date.now()}`;
        const payId5 = `pay_wh_retry_${Date.now()}`;
        const order5 = await PaymentRepository.createPaymentOrder({
          orgId: targetOrgId,
          studentId: targetStudentId,
          studentChargeDueId: dueId5,
          amount: 600.0,
          currencyCode: 'INR',
          orderReference: `ORD-WHR-${Date.now()}`,
          paymentMethod: 'razorpay',
        });
        const tx5 = await PaymentRepository.createPaymentTransaction({
          paymentOrderId: order5.payment_order_id,
          paymentMethod: 'card',
          amount: 600.0,
          gatewayName: 'razorpay',
          gatewayOrderId: orderId5,
          status: 'initiated',
        });

        const eventId5 = `evt_failed_first_${Date.now()}`;
        const webhookPayload5 = JSON.stringify({
          id: eventId5,
          event: 'payment.captured',
          payload: {
            payment: {
              entity: {
                id: payId5,
                order_id: orderId5,
                amount: 60000,
                currency: 'INR',
                status: 'captured',
              },
            },
          },
        });

        // Insert webhook event as 'failed' (simulating previous transient DB failure)
        await PaymentRepository.createWebhookEvent({
          providerName: 'razorpay',
          providerEventId: eventId5,
          eventType: 'payment.captured',
          payload: JSON.parse(webhookPayload5),
          status: 'failed',
          paymentOrderId: order5.payment_order_id,
          paymentTransactionId: tx5.payment_transaction_id,
        });

        const sig5 = crypto
          .createHmac('sha256', webhookSecret)
          .update(Buffer.from(webhookPayload5, 'utf8'))
          .digest('hex');

        // Deliver duplicate webhook now
        const res5 = await axios.post(`${baseUrl}/api/razorpay/webhook`, JSON.parse(webhookPayload5), {
          headers: {
            'Content-Type': 'application/json',
            'x-razorpay-signature': sig5,
          },
        });

        assert.strictEqual(res5.status, 200);
        assert.strictEqual(res5.data.data?.status, 'processed');

        // Verify transaction is now success and event status is processed
        const eventInDb: any = await PaymentRepository.findWebhookEvent('razorpay', eventId5);
        assert.strictEqual(eventInDb.status, 'processed');

        const txInDb: any[] = await prisma.$queryRaw`
          SELECT status FROM payment_transactions WHERE payment_transaction_id = ${tx5.payment_transaction_id}::uuid;
        `;
        assert.strictEqual(txInDb[0].status, 'success');
      });

      // 6. Recovery of an event left in 'received'
      await test('[Audit 6.2.1 - 6] Recovery of an event left in received state', async () => {
        if (!targetStudentId) return;

        const dueId6 = await createTestDue(450.0);
        const orderId6 = `order_stuck_${Date.now()}`;
        const payId6 = `pay_stuck_${Date.now()}`;
        const order6 = await PaymentRepository.createPaymentOrder({
          orgId: targetOrgId,
          studentId: targetStudentId,
          studentChargeDueId: dueId6,
          amount: 450.0,
          currencyCode: 'INR',
          orderReference: `ORD-STUCK-${Date.now()}`,
          paymentMethod: 'razorpay',
        });
        const tx6 = await PaymentRepository.createPaymentTransaction({
          paymentOrderId: order6.payment_order_id,
          paymentMethod: 'upi',
          amount: 450.0,
          gatewayName: 'razorpay',
          gatewayOrderId: orderId6,
          status: 'initiated',
        });

        const eventId6 = `evt_stuck_${Date.now()}`;
        const stuckPayload = {
          id: eventId6,
          event: 'payment.captured',
          payload: {
            payment: {
              entity: {
                id: payId6,
                order_id: orderId6,
                amount: 45000,
                currency: 'INR',
                status: 'captured',
              },
            },
          },
        };

        // Create event stranded in 'received'
        const stuckRecord = await PaymentRepository.createWebhookEvent({
          providerName: 'razorpay',
          providerEventId: eventId6,
          eventType: 'payment.captured',
          payload: stuckPayload,
          status: 'received',
          paymentOrderId: order6.payment_order_id,
          paymentTransactionId: tx6.payment_transaction_id,
        });

        // Trigger programmatic recovery
        const recoveryResult = await RazorpayGatewayService.recoverStuckWebhookEvents({
          olderThanMs: 0,
          limit: 50,
        });

        assert.ok(recoveryResult.recoveredCount >= 1, 'At least 1 stuck event must be recovered');

        // Verify event was transitioned to processed and transaction is success
        const eventInDb: any = await PaymentRepository.findWebhookEventById(stuckRecord.payment_webhook_event_id);
        assert.strictEqual(eventInDb.status, 'processed');

        const txInDb: any[] = await prisma.$queryRaw`
          SELECT status FROM payment_transactions WHERE payment_transaction_id = ${tx6.payment_transaction_id}::uuid;
        `;
        assert.strictEqual(txInDb[0].status, 'success');

        const allocs: any[] = await prisma.$queryRaw`
          SELECT * FROM payment_allocations WHERE payment_transaction_id = ${tx6.payment_transaction_id}::uuid;
        `;
        assert.strictEqual(allocs.length, 1);
        assert.strictEqual(Number(allocs[0].allocated_amount), 450.0);
      });

      // 7. Out-of-order capture events
      await test('[Audit 6.2.1 - 7] Out-of-order capture events reconcile correctly', async () => {
        if (!targetStudentId) return;

        const dueId7 = await createTestDue(300.0);
        const orderId7 = `order_ooo_${Date.now()}`;
        const payId7 = `pay_ooo_${Date.now()}`;
        const order7 = await PaymentRepository.createPaymentOrder({
          orgId: targetOrgId,
          studentId: targetStudentId,
          studentChargeDueId: dueId7,
          amount: 300.0,
          currencyCode: 'INR',
          orderReference: `ORD-OOO-${Date.now()}`,
          paymentMethod: 'razorpay',
        });
        // Initial transaction marked failed (e.g. earlier failed callback)
        const tx7 = await PaymentRepository.createPaymentTransaction({
          paymentOrderId: order7.payment_order_id,
          paymentMethod: 'card',
          amount: 300.0,
          gatewayName: 'razorpay',
          gatewayOrderId: orderId7,
          status: 'failed',
          failureCode: 'INITIAL_FAILURE',
        });

        const eventId7 = `evt_ooo_${Date.now()}`;
        const oooPayload = JSON.stringify({
          id: eventId7,
          event: 'payment.captured',
          payload: {
            payment: {
              entity: {
                id: payId7,
                order_id: orderId7,
                amount: 30000,
                currency: 'INR',
                status: 'captured',
              },
            },
          },
        });

        const sig7 = crypto
          .createHmac('sha256', webhookSecret)
          .update(Buffer.from(oooPayload, 'utf8'))
          .digest('hex');

        // Deliver capture event
        const res7 = await axios.post(`${baseUrl}/api/razorpay/webhook`, JSON.parse(oooPayload), {
          headers: {
            'Content-Type': 'application/json',
            'x-razorpay-signature': sig7,
          },
        });

        assert.strictEqual(res7.status, 200);
        assert.strictEqual(res7.data.data?.status, 'processed');

        // Verify transaction successfully transitioned to success
        const txInDb: any[] = await prisma.$queryRaw`
          SELECT status FROM payment_transactions WHERE payment_transaction_id = ${tx7.payment_transaction_id}::uuid;
        `;
        assert.strictEqual(txInDb[0].status, 'success');
      });

      // 8. Late failure after capture
      await test('[Audit 6.2.1 - 8] Late failure after capture cannot downgrade committed payment', async () => {
        if (!targetStudentId) return;

        const dueId8 = await createTestDue(350.0);
        const orderId8 = `order_latefail_${Date.now()}`;
        const payId8 = `pay_latefail_${Date.now()}`;
        const order8 = await PaymentRepository.createPaymentOrder({
          orgId: targetOrgId,
          studentId: targetStudentId,
          studentChargeDueId: dueId8,
          amount: 350.0,
          currencyCode: 'INR',
          orderReference: `ORD-LF-${Date.now()}`,
          paymentMethod: 'razorpay',
        });
        const tx8 = await PaymentRepository.createPaymentTransaction({
          paymentOrderId: order8.payment_order_id,
          paymentMethod: 'card',
          amount: 350.0,
          gatewayName: 'razorpay',
          gatewayOrderId: orderId8,
          gatewayTransactionId: payId8,
          status: 'success',
          transactionDate: new Date(),
        });
        await PaymentRepository.createPaymentAllocation({
          paymentTransactionId: tx8.payment_transaction_id,
          studentChargeDueId: dueId8,
          allocatedAmount: 350.0,
        });
        await PaymentRepository.updatePaymentOrderStatus(order8.payment_order_id, 'paid');

        // Now send late payment.failed webhook
        const eventId8 = `evt_latefail_${Date.now()}`;
        const lateFailPayload = JSON.stringify({
          id: eventId8,
          event: 'payment.failed',
          payload: {
            payment: {
              entity: {
                id: payId8,
                order_id: orderId8,
                amount: 35000,
                currency: 'INR',
                status: 'failed',
                error_code: 'BAD_REQUEST_ERROR',
                error_description: 'Late failure callback',
              },
            },
          },
        });

        const sig8 = crypto
          .createHmac('sha256', webhookSecret)
          .update(Buffer.from(lateFailPayload, 'utf8'))
          .digest('hex');

        const res8 = await axios.post(`${baseUrl}/api/razorpay/webhook`, JSON.parse(lateFailPayload), {
          headers: {
            'Content-Type': 'application/json',
            'x-razorpay-signature': sig8,
          },
        });

        assert.strictEqual(res8.status, 200);
        assert.strictEqual(res8.data.data?.status, 'ignored');

        // Verify transaction is STILL success (no regression)
        const txInDb: any[] = await prisma.$queryRaw`
          SELECT status FROM payment_transactions WHERE payment_transaction_id = ${tx8.payment_transaction_id}::uuid;
        `;
        assert.strictEqual(txInDb[0].status, 'success');
      });

      // 9. Tenant isolation and receipt authorization
      await test('[Audit 6.2.1 - 9] Tenant isolation rejects foreign tenant verification requests', async () => {
        if (!targetStudentId) return;

        const dueId9 = await createTestDue(200.0);
        const orderId9 = `order_tenant_${Date.now()}`;
        const payId9 = `pay_tenant_${Date.now()}`;
        const order9 = await PaymentRepository.createPaymentOrder({
          orgId: targetOrgId,
          studentId: targetStudentId,
          studentChargeDueId: dueId9,
          amount: 200.0,
          currencyCode: 'INR',
          orderReference: `ORD-TENANT-${Date.now()}`,
          paymentMethod: 'razorpay',
        });
        await PaymentRepository.createPaymentTransaction({
          paymentOrderId: order9.payment_order_id,
          paymentMethod: 'card',
          amount: 200.0,
          gatewayName: 'razorpay',
          gatewayOrderId: orderId9,
          status: 'initiated',
        });

        mockGatewayPayments.set(payId9, {
          id: payId9,
          order_id: orderId9,
          status: 'captured',
          amount: 20000,
          currency: 'INR',
        });

        const sig9 = crypto
          .createHmac('sha256', keySecret)
          .update(`${orderId9}|${payId9}`)
          .digest('hex');

        // Submit with a different tenant header
        try {
          await axios.post(`${baseUrl}/api/verify-payment`, {
            razorpay_order_id: orderId9,
            razorpay_payment_id: payId9,
            razorpay_signature: sig9,
          }, {
            headers: {
              'x-tenant-id': '00000000-0000-0000-0000-000000000999',
            },
          });
          assert.fail('Expected 403 for tenant mismatch');
        } catch (err: any) {
          assert.strictEqual(err.response?.status, 403);
          assert.strictEqual(err.response?.data?.error, 'TENANT_MISMATCH');
        }
      });

      // 10. Duplicate allocation and notification prevention
      await test('[Audit 6.2.1 - 10] Duplicate allocation and notification prevention under concurrency', async () => {
        if (!targetStudentId) return;

        const dueId10 = await createTestDue(300.0);
        const orderId10 = `order_notif_prev_${Date.now()}`;
        const payId10 = `pay_notif_prev_${Date.now()}`;
        const order10 = await PaymentRepository.createPaymentOrder({
          orgId: targetOrgId,
          studentId: targetStudentId,
          studentChargeDueId: dueId10,
          amount: 300.0,
          currencyCode: 'INR',
          orderReference: `ORD-NP-${Date.now()}`,
          paymentMethod: 'razorpay',
        });
        const tx10 = await PaymentRepository.createPaymentTransaction({
          paymentOrderId: order10.payment_order_id,
          paymentMethod: 'card',
          amount: 300.0,
          gatewayName: 'razorpay',
          gatewayOrderId: orderId10,
          status: 'initiated',
        });

        mockGatewayPayments.set(payId10, {
          id: payId10,
          order_id: orderId10,
          status: 'captured',
          amount: 30000,
          currency: 'INR',
        });

        const sig10 = crypto
          .createHmac('sha256', keySecret)
          .update(`${orderId10}|${payId10}`)
          .digest('hex');

        let notifCount = 0;
        const countHandler = () => { notifCount++; };
        EventBus.subscribe(FinanceEventType.PAYMENT_SUCCESS, countHandler);

        try {
          // Send 2 concurrent verifications simultaneously
          const [resA, resB] = await Promise.allSettled([
            axios.post(`${baseUrl}/api/verify-payment`, {
              razorpay_order_id: orderId10,
              razorpay_payment_id: payId10,
              razorpay_signature: sig10,
            }),
            axios.post(`${baseUrl}/api/verify-payment`, {
              razorpay_order_id: orderId10,
              razorpay_payment_id: payId10,
              razorpay_signature: sig10,
            }),
          ]);

          assert.strictEqual(resA.status, 'fulfilled');
          assert.strictEqual(resB.status, 'fulfilled');

          // Verify strictly ONE allocation row in database
          const allocs: any[] = await prisma.$queryRaw`
            SELECT * FROM payment_allocations WHERE payment_transaction_id = ${tx10.payment_transaction_id}::uuid;
          `;
          assert.strictEqual(allocs.length, 1);
          assert.strictEqual(Number(allocs[0].allocated_amount), 300.0);

          // Give a small grace period for event queue
          await new Promise((r) => setTimeout(r, 200));
          assert.strictEqual(notifCount, 1, 'PAYMENT_SUCCESS notification must be emitted exactly once');
        } finally {
          EventBus.unsubscribe(FinanceEventType.PAYMENT_SUCCESS, countHandler);
        }
      });
    } finally {
      axios.get = origAxiosGet;
    }

    console.log(`\nRazorpay Standard Checkout tests complete: ${passed} passed, ${failed} failed.`);
    if (failed > 0) {
      throw new Error(`${failed} Razorpay tests failed!`);
    }
  } finally {
    server.close();
  }
}

if (require.main === module) {
  runRazorpayStandardCheckoutTests().catch((err) => {
    console.error('Test execution error:', err);
    process.exit(1);
  });
}
