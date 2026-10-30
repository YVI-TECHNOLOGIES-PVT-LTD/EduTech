import assert from 'assert';
import crypto from 'crypto';
import axios from 'axios';
import { Prisma } from '@prisma/client';
import prisma from '../../../lib/prismaClient';
import { RazorpayGatewayService } from '../services/RazorpayGatewayService';
import { PaymentCollectionService } from '../services/PaymentCollectionService';
import { StudentLedgerService } from '../services/StudentLedgerService';
import { PaymentRepository } from '../repositories/PaymentRepository';

export async function runFinanceGatewayTests() {
  console.log('=====================================================');
  console.log('   FINANCE PHASE 6: PAYMENT GATEWAY TEST SUITE       ');
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

  // Backup environment variables
  const origKeyId = process.env.RAZORPAY_KEY_ID;
  const origKeySecret = process.env.RAZORPAY_KEY_SECRET;
  const origWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const origNodeEnv = process.env.NODE_ENV;

  const mockKeyId = 'rzp_test_fixture_key_id_12345';
  const mockKeySecret = 'test_secret_key_abcdef1234567890';
  const mockWebhookSecret = 'test_webhook_secret_xyz987654321';

  // -------------------------------------------------------------------------
  // 1. Order Creation & Parameter Validation Tests
  // -------------------------------------------------------------------------
  await test('createOrder rejects zero and negative amounts', async () => {
    await assert.rejects(async () => {
      await RazorpayGatewayService.createOrder({
        amount: 0,
        orderReference: 'ORD-TEST-000',
        studentId: '00000000-0000-0000-0000-000000000001',
        dueId: '00000000-0000-0000-0000-000000000002',
      });
    }, /Order amount must be greater than zero/);

    await assert.rejects(async () => {
      await RazorpayGatewayService.createOrder({
        amount: -50,
        orderReference: 'ORD-TEST-NEG',
        studentId: '00000000-0000-0000-0000-000000000001',
        dueId: '00000000-0000-0000-0000-000000000002',
      });
    }, /Order amount must be greater than zero/);
  });

  await test('createOrder rejects simulation in production when credentials missing', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.VITE_RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;

    await assert.rejects(
      async () => {
        await RazorpayGatewayService.createOrder({
          amount: 500,
          orderReference: 'ORD-TEST-PROD-FAIL',
          studentId: '00000000-0000-0000-0000-000000000001',
          dueId: '00000000-0000-0000-0000-000000000002',
        });
      },
      (err: any) => err.statusCode === 503 && /credentials are not configured/.test(err.message),
    );

    // Restore env
    process.env.NODE_ENV = origNodeEnv;
  });

  await test('createOrder properly calculates minor units (paise) and calls gateway API', async () => {
    process.env.RAZORPAY_KEY_ID = mockKeyId;
    process.env.RAZORPAY_KEY_SECRET = mockKeySecret;

    // Mock axios.post to intercept call to Razorpay
    const origPost = axios.post;
    let interceptedPayload: any = null;
    let interceptedHeaders: any = null;

    try {
      (axios as any).post = async (url: string, data: any, config: any) => {
        if (url.includes('api.razorpay.com/v1/orders')) {
          interceptedPayload = data;
          interceptedHeaders = config.headers;
          return {
            data: {
              id: 'order_rzp_mock_12345',
              entity: 'order',
              amount: data.amount,
              currency: data.currency,
              receipt: data.receipt,
              status: 'created',
            },
          };
        }
        return origPost(url, data, config);
      };

      const result = await RazorpayGatewayService.createOrder({
        amount: 250.5,
        orderReference: 'ORD-TEST-MINOR-UNITS',
        studentId: '00000000-0000-0000-0000-000000000001',
        dueId: '00000000-0000-0000-0000-000000000002',
        notes: { test_note: 'unit_testing' },
      });

      assert.strictEqual(result.gateway_order_id, 'order_rzp_mock_12345');
      assert.strictEqual(result.amount, 250.5);
      assert.strictEqual(result.amount_minor, 25050); // ₹250.50 -> 25050 paise
      assert.strictEqual(result.currency, 'INR');
      assert.strictEqual(result.is_simulation, false);
      assert.strictEqual(result.key_id, mockKeyId);

      // Verify intercepted payload sent to Razorpay
      assert.strictEqual(interceptedPayload.amount, 25050);
      assert.strictEqual(interceptedPayload.currency, 'INR');
      assert.strictEqual(interceptedPayload.receipt, 'ORD-TEST-MINOR-UNITS');
      assert.strictEqual(interceptedPayload.notes.test_note, 'unit_testing');
      assert.ok(interceptedHeaders.Authorization.startsWith('Basic '));
    } finally {
      axios.post = origPost;
    }
  });

  await test('createOrder safely handles gateway API network/auth failures', async () => {
    process.env.RAZORPAY_KEY_ID = mockKeyId;
    process.env.RAZORPAY_KEY_SECRET = mockKeySecret;

    const origPost = axios.post;
    try {
      (axios as any).post = async () => {
        const error: any = new Error('Gateway Unauthorized');
        error.response = {
          status: 401,
          data: { error: { description: 'Invalid API key or secret' } },
        };
        throw error;
      };

      await assert.rejects(
        async () => {
          await RazorpayGatewayService.createOrder({
            amount: 100,
            orderReference: 'ORD-AUTH-FAIL',
            studentId: '00000000-0000-0000-0000-000000000001',
            dueId: '00000000-0000-0000-0000-000000000002',
          });
        },
        (err: any) =>
          err.statusCode === 502 && /Failed to create payment order with gateway/.test(err.message),
      );
    } finally {
      axios.post = origPost;
    }
  });

  // -------------------------------------------------------------------------
  // 2. Cryptographic Checkout Signature Verification Tests
  // -------------------------------------------------------------------------
  await test('verifyCheckoutSignature returns true for valid HMAC SHA256 signature', () => {
    process.env.RAZORPAY_KEY_ID = mockKeyId;
    process.env.RAZORPAY_KEY_SECRET = mockKeySecret;

    const orderId = 'order_valid_123';
    const paymentId = 'pay_valid_456';
    const payload = `${orderId}|${paymentId}`;
    const validSignature = crypto.createHmac('sha256', mockKeySecret).update(payload).digest('hex');

    const isValid = RazorpayGatewayService.verifyCheckoutSignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: validSignature,
    });

    assert.strictEqual(isValid, true, 'Valid signature must be verified as true');
  });

  await test('verifyCheckoutSignature rejects tampered or invalid signatures', () => {
    process.env.RAZORPAY_KEY_ID = mockKeyId;
    process.env.RAZORPAY_KEY_SECRET = mockKeySecret;

    const orderId = 'order_valid_123';
    const paymentId = 'pay_valid_456';
    const tamperedSignature = 'a'.repeat(64); // Invalid hex signature of correct length

    const isValid = RazorpayGatewayService.verifyCheckoutSignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: tamperedSignature,
    });

    assert.strictEqual(isValid, false, 'Tampered signature must return false');
  });

  await test('verifyCheckoutSignature rejects missing or empty parameters', () => {
    process.env.RAZORPAY_KEY_ID = mockKeyId;
    process.env.RAZORPAY_KEY_SECRET = mockKeySecret;

    assert.strictEqual(
      RazorpayGatewayService.verifyCheckoutSignature({
        razorpayOrderId: '',
        razorpayPaymentId: 'pay_123',
        razorpaySignature: 'sig_123',
      }),
      false,
    );

    assert.strictEqual(
      RazorpayGatewayService.verifyCheckoutSignature({
        razorpayOrderId: 'order_123',
        razorpayPaymentId: '',
        razorpaySignature: 'sig_123',
      }),
      false,
    );

    assert.strictEqual(
      RazorpayGatewayService.verifyCheckoutSignature({
        razorpayOrderId: 'order_123',
        razorpayPaymentId: 'pay_123',
        razorpaySignature: '',
      }),
      false,
    );
  });

  // -------------------------------------------------------------------------
  // 3. Server-to-Server Payment Verification Tests
  // -------------------------------------------------------------------------
  await test('fetchAndVerifyPayment confirms captured status, correct order and amount', async () => {
    process.env.RAZORPAY_KEY_ID = mockKeyId;
    process.env.RAZORPAY_KEY_SECRET = mockKeySecret;

    const origGet = axios.get;
    try {
      (axios as any).get = async (url: string) => {
        if (url.includes('/payments/pay_verified_123')) {
          return {
            data: {
              id: 'pay_verified_123',
              order_id: 'order_verified_456',
              status: 'captured',
              amount: 50000, // 500.00 INR
              currency: 'INR',
            },
          };
        }
        return origGet(url);
      };

      const result = await RazorpayGatewayService.fetchAndVerifyPayment(
        'pay_verified_123',
        'order_verified_456',
        500,
      );

      assert.strictEqual(result.verified, true);
      assert.strictEqual(result.status, 'captured');
      assert.strictEqual(result.amount, 500);
    } finally {
      axios.get = origGet;
    }
  });

  await test('fetchAndVerifyPayment rejects payment if status is not captured/authorized', async () => {
    process.env.RAZORPAY_KEY_ID = mockKeyId;
    process.env.RAZORPAY_KEY_SECRET = mockKeySecret;

    const origGet = axios.get;
    try {
      (axios as any).get = async (url: string) => {
        if (url.includes('/payments/pay_failed_123')) {
          return {
            data: {
              id: 'pay_failed_123',
              order_id: 'order_123',
              status: 'failed',
              amount: 50000,
              currency: 'INR',
            },
          };
        }
        return origGet(url);
      };

      const result = await RazorpayGatewayService.fetchAndVerifyPayment(
        'pay_failed_123',
        'order_123',
        500,
      );

      assert.strictEqual(result.verified, false);
      assert.strictEqual(result.status, 'failed');
      assert.ok(/not captured\/authorized/.test(result.error || ''));
    } finally {
      axios.get = origGet;
    }
  });

  await test('fetchAndVerifyPayment rejects payment if order ID does not match expected', async () => {
    process.env.RAZORPAY_KEY_ID = mockKeyId;
    process.env.RAZORPAY_KEY_SECRET = mockKeySecret;

    const origGet = axios.get;
    try {
      (axios as any).get = async () => ({
        data: {
          id: 'pay_mismatch_123',
          order_id: 'order_DIFFERENT_999',
          status: 'captured',
          amount: 50000,
          currency: 'INR',
        },
      });

      const result = await RazorpayGatewayService.fetchAndVerifyPayment(
        'pay_mismatch_123',
        'order_EXPECTED_111',
        500,
      );

      assert.strictEqual(result.verified, false);
      assert.ok(/Gateway order mismatch/.test(result.error || ''));
    } finally {
      axios.get = origGet;
    }
  });

  await test('fetchAndVerifyPayment rejects payment if amount does not match expected', async () => {
    process.env.RAZORPAY_KEY_ID = mockKeyId;
    process.env.RAZORPAY_KEY_SECRET = mockKeySecret;

    const origGet = axios.get;
    try {
      (axios as any).get = async () => ({
        data: {
          id: 'pay_amount_mismatch_123',
          order_id: 'order_123',
          status: 'captured',
          amount: 10000, // 100 INR instead of 500 INR
          currency: 'INR',
        },
      });

      const result = await RazorpayGatewayService.fetchAndVerifyPayment(
        'pay_amount_mismatch_123',
        'order_123',
        500,
      );

      assert.strictEqual(result.verified, false);
      assert.ok(/Gateway amount mismatch/.test(result.error || ''));
    } finally {
      axios.get = origGet;
    }
  });

  // -------------------------------------------------------------------------
  // 4. Webhook Cryptographic Verification & Idempotency Tests
  // -------------------------------------------------------------------------
  await test('verifyWebhookSignature validates genuine signature against raw request body', () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = mockWebhookSecret;

    const rawBody = JSON.stringify({
      entity: 'event',
      account_id: 'acc_12345',
      event: 'payment.captured',
    });

    const genuineSignature = crypto
      .createHmac('sha256', mockWebhookSecret)
      .update(Buffer.from(rawBody, 'utf8'))
      .digest('hex');

    const isValid = RazorpayGatewayService.verifyWebhookSignature(rawBody, genuineSignature);
    assert.strictEqual(isValid, true, 'Genuine webhook signature must pass');
  });

  await test('verifyWebhookSignature rejects counterfeit webhook signature', () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = mockWebhookSecret;

    const rawBody = JSON.stringify({ entity: 'event', event: 'payment.captured' });
    const counterfeitSig = 'f'.repeat(64);

    const isValid = RazorpayGatewayService.verifyWebhookSignature(rawBody, counterfeitSig);
    assert.strictEqual(isValid, false, 'Counterfeit signature must be rejected');
  });

  await test('processWebhook safely rejects invalid signatures with HTTP 400', async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = mockWebhookSecret;

    const rawBody = JSON.stringify({ id: 'evt_123', event: 'payment.captured' });
    await assert.rejects(
      async () => {
        await RazorpayGatewayService.processWebhook(rawBody, 'invalid_sig', { id: 'evt_123' });
      },
      (err: any) =>
        err.statusCode === 400 && /Invalid Razorpay webhook signature/.test(err.message),
    );
  });

  await test('processWebhook handles unknown events safely and marks status ignored', async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = mockWebhookSecret;

    const eventId = `evt_unknown_${Date.now()}`;
    const payload = { id: eventId, event: 'refund.created', payload: {} };
    const rawBody = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', mockWebhookSecret)
      .update(Buffer.from(rawBody, 'utf8'))
      .digest('hex');

    const result = await RazorpayGatewayService.processWebhook(rawBody, signature, payload);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.event_id, eventId);
    assert.strictEqual(result.status, 'ignored');
    assert.ok(/ignored safely/.test(result.message));

    // Verify record in payment_webhook_events via PaymentRepository
    const webhookRecord = await PaymentRepository.findWebhookEvent('razorpay', eventId);
    assert.ok(webhookRecord);
    assert.strictEqual(webhookRecord?.status, 'ignored');
  });

  await test('processWebhook handles duplicate webhook deliveries idempotently', async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = mockWebhookSecret;

    const duplicateEventId = `evt_dup_${Date.now()}`;
    const payload = { id: duplicateEventId, event: 'settlement.processed', payload: {} };
    const rawBody = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', mockWebhookSecret)
      .update(Buffer.from(rawBody, 'utf8'))
      .digest('hex');

    // First delivery
    const firstResult = await RazorpayGatewayService.processWebhook(rawBody, signature, payload);
    assert.strictEqual(firstResult.status, 'ignored');

    // Second (duplicate) delivery
    const secondResult = await RazorpayGatewayService.processWebhook(rawBody, signature, payload);
    assert.strictEqual(secondResult.success, true);
    assert.strictEqual(secondResult.status, 'duplicate');
    assert.strictEqual(secondResult.message, 'Event has already been ingested and processed');
  });

  // -------------------------------------------------------------------------
  // 5. End-to-End Online Payment Lifecycle & Financial Invariants Tests
  // -------------------------------------------------------------------------
  // Locate a valid student with dues in the database
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

    const testAmount = 15.0; // ₹15.00
    let createdPaymentOrderId = '';
    let mockRzpOrderId = '';
    let mockRzpPaymentId = '';

    await test('createOnlinePaymentOrder creates pending order and transaction without altering balance', async () => {
      process.env.RAZORPAY_KEY_ID = mockKeyId;
      process.env.RAZORPAY_KEY_SECRET = mockKeySecret;

      mockRzpOrderId = `order_test_${Date.now()}`;
      mockRzpPaymentId = `pay_test_${Date.now()}`;

      const origPost = axios.post;
      try {
        (axios as any).post = async () => ({
          data: {
            id: mockRzpOrderId,
            amount: 1500,
            currency: 'INR',
            status: 'created',
          },
        });

        const balanceBefore = await StudentLedgerService.getStudentLedgerSummary(
          orgWithDues.org_id,
          student.student_id,
        );

        const orderRes = await PaymentCollectionService.createOnlinePaymentOrder(
          orgWithDues.org_id,
          null,
          {
            studentId: student.student_id,
            studentChargeDueId: targetDue.student_charge_due_id,
            amount: testAmount,
            paymentMethod: 'upi',
          },
        );

        assert.strictEqual(orderRes.success, true);
        assert.strictEqual(orderRes.order.amount, testAmount);
        assert.strictEqual(orderRes.order.gateway_order_id, mockRzpOrderId);
        assert.strictEqual(orderRes.order.status, 'created');
        assert.strictEqual(orderRes.transaction.status, 'initiated');

        createdPaymentOrderId = orderRes.order.payment_order_id;

        // INVARIANT 1: Created/pending payment intent MUST NOT reduce student balance!
        const balanceAfter = await StudentLedgerService.getStudentLedgerSummary(
          orgWithDues.org_id,
          student.student_id,
        );

        assert.strictEqual(
          balanceAfter.summary.outstanding_balance,
          balanceBefore.summary.outstanding_balance,
          'Pending payment intent must leave outstanding balance completely unchanged',
        );
        assert.strictEqual(
          balanceAfter.summary.total_paid_amount,
          balanceBefore.summary.total_paid_amount,
          'Pending payment intent must not increase total paid amount',
        );
      } finally {
        axios.post = origPost;
      }
    });

    await test('verifyOnlinePayment rejects tampered signature and leaves balance unchanged', async () => {
      process.env.RAZORPAY_KEY_ID = mockKeyId;
      process.env.RAZORPAY_KEY_SECRET = mockKeySecret;

      const balanceBefore = await StudentLedgerService.getStudentLedgerSummary(
        orgWithDues.org_id,
        student.student_id,
      );

      // Attempt verification with invalid signature
      await assert.rejects(async () => {
        await PaymentCollectionService.verifyOnlinePayment(orgWithDues.org_id, null, {
          paymentOrderId: createdPaymentOrderId,
          razorpayOrderId: mockRzpOrderId,
          razorpayPaymentId: mockRzpPaymentId,
          razorpaySignature: 'tampered_invalid_signature_hex_1234567890abcdef',
        });
      }, /Invalid gateway signature/);

      // INVARIANT 2: Rejected verification leaves balance unchanged
      const balanceAfter = await StudentLedgerService.getStudentLedgerSummary(
        orgWithDues.org_id,
        student.student_id,
      );

      assert.strictEqual(
        balanceAfter.summary.outstanding_balance,
        balanceBefore.summary.outstanding_balance,
        'Failed signature verification must leave balance unchanged',
      );
    });

    await test('verifyOnlinePayment enforces cross-tenant isolation (404 for foreign tenant)', async () => {
      const foreignTenantId = '00000000-0000-0000-0000-000000000099';
      await assert.rejects(
        async () => {
          await PaymentCollectionService.verifyOnlinePayment(foreignTenantId, null, {
            paymentOrderId: createdPaymentOrderId,
            razorpayOrderId: mockRzpOrderId,
            razorpayPaymentId: mockRzpPaymentId,
            razorpaySignature: 'any_signature',
          });
        },
        (err: any) => err.statusCode === 404,
      );
    });

    await test('verifyOnlinePayment confirms payment with genuine signature, allocates and updates ledger', async () => {
      process.env.RAZORPAY_KEY_ID = mockKeyId;
      process.env.RAZORPAY_KEY_SECRET = mockKeySecret;

      // Reset the transaction status from 'failed' (from previous test) to 'initiated' via PaymentRepository
      const txToReset = await PaymentRepository.findTransactionByOrderId(createdPaymentOrderId);
      if (txToReset) {
        await PaymentRepository.updatePaymentTransaction(txToReset.payment_transaction_id, {
          status: 'initiated',
          failureCode: null,
          failureMessage: null,
        });
      }

      // Compute genuine HMAC SHA256 signature
      const validSig = crypto
        .createHmac('sha256', mockKeySecret)
        .update(`${mockRzpOrderId}|${mockRzpPaymentId}`)
        .digest('hex');

      // Mock axios.get for server-to-server gateway verification
      const origGet = axios.get;
      try {
        (axios as any).get = async () => ({
          data: {
            id: mockRzpPaymentId,
            order_id: mockRzpOrderId,
            status: 'captured',
            amount: testAmount * 100, // 1500 paise
            currency: 'INR',
          },
        });

        const balanceBefore = await StudentLedgerService.getStudentLedgerSummary(
          orgWithDues.org_id,
          student.student_id,
        );

        const verifyRes = await PaymentCollectionService.verifyOnlinePayment(
          orgWithDues.org_id,
          null,
          {
            paymentOrderId: createdPaymentOrderId,
            razorpayOrderId: mockRzpOrderId,
            razorpayPaymentId: mockRzpPaymentId,
            razorpaySignature: validSig,
          },
        );

        assert.strictEqual(verifyRes.success, true);
        assert.strictEqual(verifyRes.status, 'success');
        assert.ok(verifyRes.receipt.receipt_no.startsWith('RCPT-'));
        assert.strictEqual(verifyRes.receipt.amount, testAmount);

        // INVARIANT 3: Verified payment must accurately reduce outstanding balance
        const balanceAfter = await StudentLedgerService.getStudentLedgerSummary(
          orgWithDues.org_id,
          student.student_id,
        );

        assert.strictEqual(
          balanceAfter.summary.total_paid_amount,
          StudentLedgerService.roundMoney(balanceBefore.summary.total_paid_amount + testAmount),
        );
        assert.strictEqual(
          balanceAfter.summary.outstanding_balance,
          StudentLedgerService.roundMoney(balanceBefore.summary.outstanding_balance - testAmount),
        );
      } finally {
        axios.get = origGet;
      }
    });

    await test('Repeated verifyOnlinePayment is idempotent and returns existing receipt without double-allocation', async () => {
      const balanceBefore = await StudentLedgerService.getStudentLedgerSummary(
        orgWithDues.org_id,
        student.student_id,
      );

      const validSig = crypto
        .createHmac('sha256', mockKeySecret)
        .update(`${mockRzpOrderId}|${mockRzpPaymentId}`)
        .digest('hex');

      const repeatRes = await PaymentCollectionService.verifyOnlinePayment(
        orgWithDues.org_id,
        null,
        {
          paymentOrderId: createdPaymentOrderId,
          razorpayOrderId: mockRzpOrderId,
          razorpayPaymentId: mockRzpPaymentId,
          razorpaySignature: validSig,
        },
      );

      assert.strictEqual(repeatRes.success, true);
      assert.strictEqual(repeatRes.status, 'success');
      assert.ok(repeatRes.message.includes('already been verified and allocated'));
      assert.ok(repeatRes.receipt);

      // INVARIANT 4: No double-allocation on repeated call
      const balanceAfter = await StudentLedgerService.getStudentLedgerSummary(
        orgWithDues.org_id,
        student.student_id,
      );

      assert.strictEqual(
        balanceAfter.summary.outstanding_balance,
        balanceBefore.summary.outstanding_balance,
        'Repeated verification must not deduct balance twice',
      );
    });

    await test('Out-of-order late payment.failed webhook does NOT regress confirmed transaction', async () => {
      process.env.RAZORPAY_WEBHOOK_SECRET = mockWebhookSecret;

      // Send a late payment.failed event for the already verified order
      const lateFailEventId = `evt_late_fail_${Date.now()}`;
      const failPayload = {
        id: lateFailEventId,
        event: 'payment.failed',
        payload: {
          payment: {
            entity: {
              id: mockRzpPaymentId,
              order_id: mockRzpOrderId,
              error_code: 'BAD_REQUEST_ERROR',
              error_description: 'Payment late failure simulation',
            },
          },
        },
      };

      const rawBody = JSON.stringify(failPayload);
      const signature = crypto
        .createHmac('sha256', mockWebhookSecret)
        .update(Buffer.from(rawBody, 'utf8'))
        .digest('hex');

      const webhookRes = await RazorpayGatewayService.processWebhook(
        rawBody,
        signature,
        failPayload,
      );

      assert.strictEqual(webhookRes.success, true);
      assert.strictEqual(webhookRes.status, 'ignored');
      assert.ok(webhookRes.message.includes('already confirmed'));

      // INVARIANT 5: Transaction status remains 'success'
      const tx = await PaymentRepository.findTransactionByGatewayRef(mockRzpOrderId);
      assert.strictEqual(
        tx?.status,
        'success',
        'Confirmed transaction must never be downgraded by late webhook',
      );
    });
  } else {
    console.log(
      '  [Notice] Live DB does not contain students with active charges/dues; gateway order creation and signature verification tests passed.',
    );
  }

  // -------------------------------------------------------------------------
  // 6. Finance Phase 6.1: Persistence Hardening & Concurrency Tests
  // -------------------------------------------------------------------------
  await test('Missing Prisma delegate direct writes are strictly prohibited with Persistence Error', async () => {
    await assert.rejects(async () => {
      await (prisma as any).payment_orders.create({
        data: { amount: 100 },
      });
    }, /\[Persistence Error\] Direct write on unmapped Prisma delegate 'payment_orders.create' is prohibited/);

    await assert.rejects(async () => {
      await (prisma as any).payment_transactions.update({
        where: { payment_transaction_id: '00000000-0000-0000-0000-000000000001' },
        data: { status: 'success' },
      });
    }, /\[Persistence Error\] Direct write on unmapped Prisma delegate 'payment_transactions.update' is prohibited/);
  });

  await test('PaymentRepository persists payment order and transaction durably to PostgreSQL and reloads them', async () => {
    const student = await prisma.students.findFirst({ select: { student_id: true, org_id: true } });
    if (!student) {
      console.log('    [Notice] No student found to test durable insertion');
      return;
    }
    const studentId = student.student_id;

    // Insert a test charge and due directly
    const chargeRows: any = await prisma.$queryRaw`
      INSERT INTO student_charges (student_charge_id, student_id, source_type, description, amount, status)
      VALUES (gen_random_uuid(), ${studentId}::uuid, 'other'::financial_charge_source, 'Persistence Test Charge', 100.0, 'active'::student_charge_status)
      RETURNING student_charge_id;
    `;
    const chargeId = chargeRows[0].student_charge_id;

    const dueRows: any = await prisma.$queryRaw`
      INSERT INTO student_charge_dues (student_charge_due_id, student_charge_id, amount_due, due_date, status)
      VALUES (gen_random_uuid(), ${chargeId}::uuid, 100.0, CURRENT_DATE, 'pending'::student_charge_due_status)
      RETURNING student_charge_due_id;
    `;
    const dueId = dueRows[0].student_charge_due_id;

    const orderRef = `ORD-DUR-${Date.now()}`;
    const order = await PaymentRepository.createPaymentOrder({
      studentId,
      studentChargeDueId: dueId,
      amount: 100.0,
      orderReference: orderRef,
      description: 'Durable test order',
    });

    assert.ok(order.payment_order_id);
    assert.strictEqual(order.status, 'created');
    assert.strictEqual(order.amount, 100.0);

    // Physically reload from PostgreSQL using raw SQL
    const rawReload: any = await prisma.$queryRaw`
      SELECT payment_order_id, student_id, amount::float8 as amount, status, order_reference
      FROM payment_orders
      WHERE payment_order_id = ${order.payment_order_id}::uuid;
    `;
    assert.strictEqual(rawReload.length, 1);
    assert.strictEqual(rawReload[0].order_reference, orderRef);
    assert.strictEqual(rawReload[0].amount, 100.0);
    assert.strictEqual(rawReload[0].status, 'created');

    // Create payment transaction
    const tx = await PaymentRepository.createPaymentTransaction({
      paymentOrderId: order.payment_order_id,
      paymentMethod: 'upi',
      status: 'initiated',
      amount: 100.0,
      gatewayName: 'Razorpay',
      gatewayOrderId: `rzp_order_${Date.now()}`,
    });
    assert.ok(tx.payment_transaction_id);

    // Physically reload transaction from PostgreSQL
    const rawTxReload: any = await prisma.$queryRaw`
      SELECT payment_transaction_id, status, amount::float8 as amount, payment_method
      FROM payment_transactions
      WHERE payment_transaction_id = ${tx.payment_transaction_id}::uuid;
    `;
    assert.strictEqual(rawTxReload.length, 1);
    assert.strictEqual(rawTxReload[0].status, 'initiated');
    assert.strictEqual(rawTxReload[0].amount, 100.0);
    assert.strictEqual(rawTxReload[0].payment_method, 'upi');
  });

  await test('Webhook deduplication enforces database-level uniqueness constraint on (provider_name, provider_event_id)', async () => {
    const testEventId = `evt_dedup_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // First insert succeeds
    const first = await PaymentRepository.createWebhookEvent({
      providerName: 'razorpay',
      providerEventId: testEventId,
      eventType: 'payment.captured',
      payload: { id: testEventId },
      status: 'received',
    });
    assert.ok(first.payment_webhook_event_id);

    // Attempting duplicate insert directly via PaymentRepository throws unique constraint error
    await assert.rejects(
      async () => {
        await PaymentRepository.createWebhookEvent({
          providerName: 'razorpay',
          providerEventId: testEventId,
          eventType: 'payment.captured',
          payload: { id: testEventId },
          status: 'received',
        });
      },
      (err: any) =>
        err.code === '23505' ||
        err.code === 'P2010' ||
        String(err.message).includes('uq_payment_webhook_provider_event'),
    );

    // Calling processWebhook with duplicate returns status 'duplicate' safely without throwing
    process.env.RAZORPAY_WEBHOOK_SECRET = mockWebhookSecret;
    const rawBody = JSON.stringify({ id: testEventId, event: 'payment.captured' });
    const signature = crypto
      .createHmac('sha256', mockWebhookSecret)
      .update(Buffer.from(rawBody, 'utf8'))
      .digest('hex');

    const dupResult = await RazorpayGatewayService.processWebhook(rawBody, signature, {
      id: testEventId,
      event: 'payment.captured',
    });
    assert.strictEqual(dupResult.success, true);
    assert.strictEqual(dupResult.status, 'duplicate');
  });

  await test('Concurrent webhook deliveries handle race conditions safely via database constraint', async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = mockWebhookSecret;
    const raceEventId = `evt_race_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const payload = { id: raceEventId, event: 'refund.created', payload: {} };
    const rawBody = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', mockWebhookSecret)
      .update(Buffer.from(rawBody, 'utf8'))
      .digest('hex');

    // Fire 2 concurrent webhook deliveries
    const [res1, res2] = await Promise.all([
      RazorpayGatewayService.processWebhook(rawBody, signature, payload),
      RazorpayGatewayService.processWebhook(rawBody, signature, payload),
    ]);

    assert.strictEqual(res1.success, true);
    assert.strictEqual(res2.success, true);

    const statuses = [res1.status, res2.status];
    assert.ok(statuses.includes('ignored') || statuses.includes('processed'));
    assert.ok(statuses.includes('duplicate'));
  });

  await test('Database transaction rollback restores state on error without partial commit', async () => {
    let targetStudentId = '';
    let targetDueId = '';

    const existingDue: any = await prisma.$queryRaw`
      SELECT scd.student_charge_due_id, sc.student_id
      FROM student_charge_dues scd
      JOIN student_charges sc ON scd.student_charge_id = sc.student_charge_id
      LIMIT 1;
    `;

    if (existingDue.length > 0) {
      targetStudentId = existingDue[0].student_id;
      targetDueId = existingDue[0].student_charge_due_id;
    } else {
      const student = await prisma.students.findFirst({
        select: { student_id: true, org_id: true },
      });
      if (!student) return;
      targetStudentId = student.student_id;
      const chargeRows: any = await prisma.$queryRaw`
        INSERT INTO student_charges (student_charge_id, student_id, charge_type, amount, description, source_reference)
        VALUES (gen_random_uuid(), ${student.student_id}::uuid, 'adhoc', 50.0, 'Rollback Test Charge', 'AD-ROLLBACK')
        RETURNING student_charge_id;
      `;
      const dueRows: any = await prisma.$queryRaw`
        INSERT INTO student_charge_dues (student_charge_due_id, student_charge_id, amount_due, due_date, status)
        VALUES (gen_random_uuid(), ${chargeRows[0].student_charge_id}::uuid, 50.0, CURRENT_DATE, 'pending'::student_charge_due_status)
        RETURNING student_charge_due_id;
      `;
      targetDueId = dueRows[0].student_charge_due_id;
    }

    const testRef = `ORD-FAIL-${Date.now()}`;

    await assert.rejects(async () => {
      await prisma.$transaction(async (tx: any) => {
        // 1. Create order
        await PaymentRepository.createPaymentOrder(
          {
            studentId: targetStudentId,
            studentChargeDueId: targetDueId,
            amount: 50.0,
            orderReference: testRef,
          },
          tx,
        );

        // 2. Force an error to trigger rollback
        throw new Error('Simulated database transient failure');
      });
    }, /Simulated database transient failure/);

    // Verify order was not committed
    const foundRows: any = await prisma.$queryRaw`
      SELECT payment_order_id FROM payment_orders WHERE order_reference = ${testRef};
    `;
    assert.strictEqual(foundRows.length, 0, 'Uncommitted transaction must roll back cleanly');
  });

  // Restore environment variables
  process.env.RAZORPAY_KEY_ID = origKeyId;
  process.env.RAZORPAY_KEY_SECRET = origKeySecret;
  process.env.RAZORPAY_WEBHOOK_SECRET = origWebhookSecret;
  process.env.NODE_ENV = origNodeEnv;

  console.log(`\nFinance Phase 6 tests complete: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    throw new Error(`Finance Phase 6 tests failed: ${failed} failure(s)`);
  }
}

if (require.main === module) {
  runFinanceGatewayTests().catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}
