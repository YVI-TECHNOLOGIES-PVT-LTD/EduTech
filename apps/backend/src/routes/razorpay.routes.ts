import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import Razorpay from 'razorpay';
import prisma from '../lib/prismaClient';
import { logger } from '../utils/logger';
import { PaymentRepository } from '../modules/fees/repositories/PaymentRepository';
import { RazorpayGatewayService } from '../modules/fees/services/RazorpayGatewayService';
import { PaymentCollectionService } from '../modules/fees/services/PaymentCollectionService';
import { ParentFinanceService } from '../modules/fees/services/ParentFinanceService';
import { FinanceNotificationService } from '../modules/fees/services/FinanceNotificationService';
import { FinanceEventType } from '../modules/fees/events/finance.events';

export const razorpayRouter = Router();

/**
 * Fetch server-side Razorpay configuration safely.
 * Secret keys are strictly server-side and never exposed to clients.
 */
function getRazorpayConfig() {
  const keyId = (process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  const webhookSecret = (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim();

  return {
    keyId,
    keySecret,
    webhookSecret,
    isConfigured: Boolean(keyId && keySecret),
    isWebhookConfigured: Boolean(webhookSecret),
    isProduction: process.env.NODE_ENV === 'production',
  };
}

/**
 * Public configuration endpoint for browser client.
 * Returns only public key_id and flags — NEVER leaks secrets.
 */
razorpayRouter.get('/razorpay/config', (_req: Request, res: Response) => {
  const config = getRazorpayConfig();
  res.json({
    success: true,
    key_id: config.keyId,
    is_configured: config.isConfigured,
    is_webhook_configured: config.isWebhookConfigured,
  });
});

/**
 * STEP 1: BACKEND - Create Order
 * Endpoint: POST /api/create-order (and /create-order)
 *
 * Supports two distinct modes:
 * A) Production ERP Fee Payment: Server resolves student, obligation due, and authorized payable amount.
 * B) Standalone Sandbox Demo: Validated test amount; explicitly marked as demo with zero ledger effects.
 */
razorpayRouter.post('/create-order', async (req: Request, res: Response) => {
  try {
    const { keyId, keySecret, isConfigured } = getRazorpayConfig();

    if (!isConfigured) {
      logger.error('[Razorpay Standard Checkout] Missing credentials in environment');
      return res.status(401).json({
        success: false,
        error: 'GATEWAY_AUTH_ERROR',
        message:
          'Razorpay credentials not configured. Please check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server .env',
      });
    }

    const { studentId, studentChargeDueId, dueId, due_id } = req.body;
    const targetDueId = studentChargeDueId || dueId || due_id;

    // -------------------------------------------------------------------------
    // Mode A: Production ERP Fee Collection (Server-Authoritative Payable Amount)
    // -------------------------------------------------------------------------
    if (studentId && targetDueId) {
      logger.info('[Razorpay Standard Checkout] Production fee payment intent initiated', {
        studentId,
        targetDueId,
      });

      // Resolve tenant organization from authenticated context, header, or student record
      const tenantOrgId =
        (req as any).tenantOrgId ||
        (req as any).context?.user?.org_id ||
        (req as any).context?.user?.school_id ||
        (req.headers['x-tenant-id'] as string);

      // Verify student in database and resolve org_id if not present in request context
      const studentRec = await prisma.students.findUnique({
        where: { student_id: studentId },
        select: { org_id: true, first_name: true, last_name: true, admission_no: true },
      });

      if (!studentRec) {
        return res.status(404).json({
          success: false,
          error: 'STUDENT_NOT_FOUND',
          message: 'Student record could not be found.',
        });
      }

      const effectiveOrgId = tenantOrgId || studentRec.org_id;
      const effectiveUserId =
        (req as any).context?.user?.id || ((req as any).context?.user as any)?.user_id || null;
      const userRoles = (req as any).context?.user?.roles || [];

      // Security check (P0): If user is authenticated as PARENT, ensure they have access to this student!
      if (userRoles.includes('PARENT') && effectiveUserId) {
        const hasAccess = await ParentFinanceService.verifyParentChildAccess(
          effectiveOrgId,
          effectiveUserId,
          studentId,
          (req as any).context?.user?.email,
        );
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            error: 'FORBIDDEN',
            message: 'You are not authorized to create payment orders for this student.',
          });
        }
      }

      // Delegate to PaymentCollectionService which checks remaining balance and prevents overpayment
      const requestedRupees =
        req.body.amount_in_rupees || (req.body.amount ? req.body.amount / 100 : undefined);

      const erpOrderResult = await PaymentCollectionService.createOnlinePaymentOrder(
        effectiveOrgId,
        effectiveUserId,
        {
          studentId,
          studentChargeDueId: targetDueId,
          amount: Number(requestedRupees),
          paymentMethod: req.body.paymentMethod || 'card',
          notes: req.body.notes ? JSON.stringify(req.body.notes) : undefined,
        },
      );

      return res.status(200).json({
        success: true,
        order_id: erpOrderResult.order.gateway_order_id,
        amount: Math.round(erpOrderResult.order.amount * 100), // integer paise
        amount_in_rupees: erpOrderResult.order.amount,
        currency: erpOrderResult.order.currency,
        key_id: erpOrderResult.order.key_id,
        payment_order_id: erpOrderResult.order.payment_order_id,
        order_reference: erpOrderResult.order.order_reference,
        is_demo: false,
      });
    }

    // -------------------------------------------------------------------------
    // Mode B: Standalone Sandbox Demonstration Order (Ledger Unchanged)
    // -------------------------------------------------------------------------
    // Validate amount: must be positive integer paise >= 100
    let amountInPaise: number;
    if (req.body.amount !== undefined) {
      const parsed = Number(req.body.amount);
      if (!Number.isInteger(parsed) || !Number.isFinite(parsed)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_AMOUNT',
          message: 'Amount in paise must be a valid positive integer.',
        });
      }
      amountInPaise = parsed;
    } else if (req.body.amount_in_rupees !== undefined) {
      const parsedRupees = Number(req.body.amount_in_rupees);
      if (isNaN(parsedRupees) || !Number.isFinite(parsedRupees) || parsedRupees <= 0) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_AMOUNT',
          message: 'Amount in rupees must be a positive finite number.',
        });
      }
      amountInPaise = Math.round(parsedRupees * 100);
    } else {
      amountInPaise = 0;
    }

    // Minimum gateway amount: 100 paise (₹1.00)
    if (amountInPaise < 100) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_AMOUNT',
        message: 'Amount must be at least 100 paise (₹1.00).',
      });
    }

    // Maximum safety ceiling for standard checkout (₹10,00,000 / 100,000,000 paise)
    if (amountInPaise > 100000000) {
      return res.status(400).json({
        success: false,
        error: 'AMOUNT_EXCEEDS_LIMIT',
        message: 'Order amount exceeds single transaction safety limit.',
      });
    }

    const currency = (req.body.currency || 'INR').toUpperCase();
    if (currency !== 'INR') {
      return res.status(400).json({
        success: false,
        error: 'UNSUPPORTED_CURRENCY',
        message: `Currency '${currency}' is not supported. Only 'INR' is supported.`,
      });
    }

    const receipt =
      req.body.receipt || `demo_rcpt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const notes = {
      ...(req.body.notes || {}),
      mode: 'sandbox_demo',
      demo_notice: 'Gateway payment verified — demo only; EduTrack ledger not updated.',
    };

    let orderId: string;
    let orderAmount: number;
    let orderCurrency: string;

    try {
      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      const rzpOrder: any = await razorpay.orders.create({
        amount: amountInPaise,
        currency,
        receipt,
        notes,
      });

      orderId = rzpOrder.id;
      orderAmount = rzpOrder.amount;
      orderCurrency = rzpOrder.currency;
    } catch (sdkError: any) {
      const sdkStatus = sdkError.statusCode || sdkError.status || sdkError.response?.status;
      if (sdkStatus === 401) {
        logger.error('[Razorpay Standard Checkout] Razorpay authentication failed:', sdkError);
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Razorpay authentication failed. Verify KEY_ID and KEY_SECRET.',
        });
      }

      logger.warn(
        '[Razorpay Standard Checkout] SDK call error, trying direct API call:',
        sdkError.message || sdkError,
      );
      const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const response = await axios.post(
        'https://api.razorpay.com/v1/orders',
        {
          amount: amountInPaise,
          currency,
          receipt,
          notes,
        },
        {
          headers: {
            Authorization: `Basic ${basicAuth}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      orderId = response.data.id;
      orderAmount = response.data.amount;
      orderCurrency = response.data.currency;
    }

    logger.info(
      `[Razorpay Standard Checkout] Demo order created: ${orderId} (${orderAmount} ${orderCurrency})`,
    );

    return res.status(200).json({
      success: true,
      order_id: orderId,
      amount: orderAmount,
      currency: orderCurrency,
      key_id: keyId,
      is_demo: true,
      notice: 'Gateway payment verified — demo only; EduTrack ledger not updated.',
    });
  } catch (error: any) {
    const status = error.response?.status || error.statusCode || error.status;
    const errorDesc =
      error.response?.data?.error?.description ||
      error.error?.description ||
      error.message ||
      'Razorpay order creation failed';

    logger.error('[Razorpay Standard Checkout] Order creation error:', {
      status,
      description: errorDesc,
    });

    if (status === 401) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Razorpay authentication failed. Verify KEY_ID and KEY_SECRET.',
      });
    }

    return res.status(status === 400 ? 400 : 500).json({
      success: false,
      error: status === 400 ? 'VALIDATION_ERROR' : 'ORDER_CREATION_FAILED',
      message: errorDesc,
    });
  }
});

/**
 * STEP 3: BACKEND - Cryptographic Signature Verification & Authoritative Financial Persistence
 * Endpoint: POST /api/verify-payment (and /verify-payment)
 *
 * Guarantees:
 * 1. Constant-time HMAC-SHA256 signature verification.
 * 2. Authoritative server-to-server payment state verification against Razorpay API.
 * 3. Amount and currency matching between order and captured payment.
 * 4. Durable financial persistence (payment_transactions, payment_orders, payment_allocations, receipts).
 * 5. Idempotent replay protection: duplicate submissions return existing receipt without double-allocation.
 * 6. Explicit truth-in-status: returns demo status when no ledger records are touched.
 */
razorpayRouter.post('/verify-payment', async (req: Request, res: Response) => {
  try {
    const { keyId, keySecret, isConfigured } = getRazorpayConfig();

    if (!isConfigured || !keySecret) {
      logger.error('[Razorpay Standard Checkout] Missing secret for signature verification');
      return res.status(500).json({
        success: false,
        error: 'GATEWAY_CONFIG_ERROR',
        message: 'Server missing RAZORPAY_KEY_SECRET for signature verification',
      });
    }

    // Input fields extraction supporting standard snake_case and camelCase
    const orderId = String(
      req.body.razorpay_order_id || req.body.order_id || req.body.razorpayOrderId || '',
    ).trim();
    const paymentId = String(
      req.body.razorpay_payment_id || req.body.payment_id || req.body.razorpayPaymentId || '',
    ).trim();
    const signature = String(
      req.body.razorpay_signature || req.body.signature || req.body.razorpaySignature || '',
    ).trim();
    const clientPaymentOrderId = req.body.payment_order_id || req.body.paymentOrderId;

    // Error handling: Missing fields
    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message:
          'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required for verification.',
      });
    }

    // Input sanity: length constraint to prevent memory abuse
    if (orderId.length > 256 || paymentId.length > 256 || signature.length > 256) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_INPUT',
        message: 'Payload parameters exceed valid length constraints.',
      });
    }

    // -------------------------------------------------------------------------
    // 1. Cryptographic HMAC-SHA256 Signature Verification
    // -------------------------------------------------------------------------
    const payload = `${orderId}|${paymentId}`;
    const generatedSignature = crypto.createHmac('sha256', keySecret).update(payload).digest('hex');

    const expectedBuf = Buffer.from(generatedSignature, 'utf8');
    const providedBuf = Buffer.from(signature, 'utf8');

    const isSignatureValid =
      expectedBuf.length === providedBuf.length && crypto.timingSafeEqual(expectedBuf, providedBuf);

    if (!isSignatureValid) {
      logger.warn('[Razorpay Standard Checkout] Signature mismatch detected', {
        orderId,
        paymentId,
      });

      // If a local transaction exists, mark it failed to record the security event
      const localTx = await PaymentRepository.findTransactionWithOrderAndDueByGatewayRef(
        orderId,
      ).catch(() => null);
      if (localTx && localTx.status === 'initiated') {
        await PaymentRepository.updatePaymentTransaction(localTx.payment_transaction_id, {
          status: 'failed',
          failureCode: 'SIGNATURE_MISMATCH',
          failureMessage: 'Cryptographic signature mismatch. Unauthorized callback.',
        }).catch(() => null);
      }

      return res.status(400).json({
        success: false,
        error: 'SIGNATURE_MISMATCH',
        message: 'Cryptographic signature verification failed. Potential tampering detected.',
      });
    }

    // -------------------------------------------------------------------------
    // 2. Authoritative Server-to-Server Payment Status Verification with Razorpay
    // -------------------------------------------------------------------------
    let gatewayPayment: any = null;
    try {
      const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const rzpRes = await axios.get(`https://api.razorpay.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Basic ${basicAuth}` },
        timeout: 8000,
      });
      gatewayPayment = rzpRes.data;
    } catch (gwErr: any) {
      const gwStatus = gwErr.response?.status;
      logger.error('[Razorpay Standard Checkout] Failed to fetch payment status from gateway', {
        paymentId,
        status: gwStatus,
        error: gwErr.message,
      });

      if (gwStatus === 404) {
        return res.status(400).json({
          success: false,
          error: 'PAYMENT_NOT_FOUND',
          message: 'Payment ID not found on payment gateway.',
        });
      }

      // If Razorpay API is down/times out: do NOT fail financial records or fake success! Return pending status.
      return res.status(503).json({
        success: false,
        status: 'pending',
        error: 'GATEWAY_VERIFICATION_UNAVAILABLE',
        message:
          'Gateway verification is temporarily unavailable. Payment status is pending reconciliation.',
        order_id: orderId,
        payment_id: paymentId,
      });
    }

    // Verify order ID association
    if (gatewayPayment.order_id && gatewayPayment.order_id !== orderId) {
      logger.error('[Razorpay Standard Checkout] Gateway order mismatch', {
        expectedOrder: orderId,
        actualOrder: gatewayPayment.order_id,
      });
      return res.status(400).json({
        success: false,
        error: 'GATEWAY_ORDER_MISMATCH',
        message: `Payment is associated with order '${gatewayPayment.order_id}', not '${orderId}'.`,
      });
    }

    // Verify payment status is strictly captured (authorized is NOT committed or allocated)
    if (gatewayPayment.status === 'authorized') {
      logger.warn('[Razorpay Standard Checkout] Payment is authorized but not captured', {
        paymentId,
        status: gatewayPayment.status,
      });
      return res.status(400).json({
        success: false,
        error: 'PAYMENT_AUTHORIZED_NOT_CAPTURED',
        message: 'Payment is authorized but not captured. Only captured payments can be settled.',
      });
    }

    if (gatewayPayment.status !== 'captured') {
      logger.warn('[Razorpay Standard Checkout] Payment not captured', {
        paymentId,
        status: gatewayPayment.status,
      });
      return res.status(400).json({
        success: false,
        error: 'PAYMENT_NOT_CAPTURED',
        message: `Payment status is '${gatewayPayment.status}'. Only captured payments can be settled.`,
      });
    }

    // Verify currency is INR
    if (gatewayPayment.currency !== 'INR') {
      return res.status(400).json({
        success: false,
        error: 'CURRENCY_MISMATCH',
        message: `Expected currency 'INR', but gateway returned '${gatewayPayment.currency}'.`,
      });
    }

    // -------------------------------------------------------------------------
    // 3. Durable Financial Persistence & Idempotency Check
    // -------------------------------------------------------------------------
    // Locate associated local payment transaction by gateway order ID or client order ID
    let localTx: any = await PaymentRepository.findTransactionWithOrderAndDueByGatewayRef(
      orderId,
    ).catch(() => null);

    if (!localTx && clientPaymentOrderId) {
      const orderRecord = await PaymentRepository.findPaymentOrderForVerification(
        clientPaymentOrderId,
      ).catch(() => null);
      if (orderRecord && orderRecord.payment_transactions?.[0]) {
        localTx = {
          payment_transaction_id: orderRecord.payment_transactions[0].payment_transaction_id,
          payment_order_id: orderRecord.payment_order_id,
          payment_method: orderRecord.payment_transactions[0].payment_method,
          status: orderRecord.payment_transactions[0].status,
          amount: Number(orderRecord.amount),
          payment_orders: orderRecord,
        };
      }
    }

    // If this payment belongs to an authorized ERP fee order:
    if (localTx && localTx.payment_orders) {
      const order = localTx.payment_orders;
      const expectedPaise = Math.round(Number(order.amount) * 100);

      // Verify tenant isolation
      const requestTenant =
        (req as any).tenantOrgId ||
        (req as any).context?.user?.org_id ||
        (req as any).context?.user?.school_id ||
        (req.headers['x-tenant-id'] as string);
      if (requestTenant && order.org_id && requestTenant !== order.org_id) {
        logger.error('[Razorpay Standard Checkout] Tenant isolation mismatch', {
          requestTenant,
          orderOrgId: order.org_id,
        });
        return res.status(403).json({
          success: false,
          error: 'TENANT_MISMATCH',
          message: 'Payment order does not belong to the authenticated tenant organization.',
        });
      }

      // Verify local payment state
      if (order.status === 'cancelled') {
        return res.status(400).json({
          success: false,
          error: 'ORDER_CANCELLED',
          message: 'Cannot verify payment for a cancelled order.',
        });
      }

      // Verify amount matching (P0 - PI-01)
      if (gatewayPayment.amount !== expectedPaise) {
        logger.error('[Razorpay Standard Checkout] Amount mismatch between order and gateway', {
          expectedPaise,
          gatewayPaise: gatewayPayment.amount,
        });
        return res.status(400).json({
          success: false,
          error: 'AMOUNT_MISMATCH',
          message: `Captured amount (₹${gatewayPayment.amount / 100}) does not match order amount (₹${Number(order.amount)}).`,
        });
      }

      // Verify currency matching (P0 - PI-02)
      const expectedCurrency = (order.currency_code || 'INR').toUpperCase();
      if ((gatewayPayment.currency || '').toUpperCase() !== expectedCurrency) {
        logger.error('[Razorpay Standard Checkout] Currency mismatch between order and gateway', {
          expectedCurrency,
          gatewayCurrency: gatewayPayment.currency,
        });
        return res.status(400).json({
          success: false,
          error: 'CURRENCY_MISMATCH',
          message: `Expected currency '${expectedCurrency}', but gateway returned '${gatewayPayment.currency}'.`,
        });
      }

      // Security check (P0 - PI-03): Payment ID replay protection across transactions
      const duplicatePayment = await prisma.payment_transactions.findFirst({
        where: {
          gateway_transaction_id: paymentId,
          status: 'success',
          payment_transaction_id: { not: localTx.payment_transaction_id },
        },
        select: { payment_transaction_id: true },
      });
      if (duplicatePayment) {
        logger.warn('[Razorpay Standard Checkout] Payment ID replay detected across transactions', {
          paymentId,
          existingTxId: duplicatePayment.payment_transaction_id,
        });
        return res.status(400).json({
          success: false,
          error: 'PAYMENT_ID_ALREADY_USED',
          message: `Payment ID '${paymentId}' is already settled against another transaction. Replay rejected.`,
        });
      }

      // IDEMPOTENCY GUARANTEE: If transaction is ALREADY marked success, return existing receipt safely
      if (localTx.status === 'success') {
        logger.info(
          '[Razorpay Standard Checkout] Idempotent duplicate verification request received',
          {
            orderId,
            paymentId,
          },
        );

        const existingReceipt = await PaymentRepository.getReceiptDetails(
          order.org_id || '00000000-0000-0000-0000-000000000001',
          localTx.payment_transaction_id,
        ).catch(() => null);

        return res.status(200).json({
          success: true,
          status: 'committed',
          is_demo: false,
          ledger_updated: true,
          message: 'Payment verified and committed to EduTrack ledger',
          order_id: orderId,
          payment_id: paymentId,
          transaction_id: localTx.payment_transaction_id,
          receipt_number: existingReceipt?.receipt_no || `RCPT-${order.order_reference || orderId}`,
          receipt: existingReceipt,
        });
      }

      // IDEMPOTENCY GUARANTEE: If transaction was captured but unallocated (pending reconciliation)
      if (
        localTx.status === 'pending' &&
        localTx.gateway_transaction_id === paymentId &&
        (localTx.failure_code === 'EXCEEDS_REMAINING_DUE' ||
          (localTx.gateway_response as any)?.reconciliation_required)
      ) {
        logger.info(
          '[Razorpay Standard Checkout] Idempotent duplicate verification for captured-unallocated payment',
          {
            orderId,
            paymentId,
          },
        );

        return res.status(409).json({
          success: false,
          status: 'captured_unallocated',
          gateway_captured: true,
          ledger_updated: false,
          error: localTx.failure_code || 'EXCEEDS_REMAINING_DUE',
          message:
            localTx.failure_message ||
            `Payment was captured at gateway (${paymentId}), but cannot be allocated because it exceeds eligible remaining due balance. Flagged for manual reconciliation.`,
          order_id: orderId,
          payment_id: paymentId,
          transaction_id: localTx.payment_transaction_id,
          remaining_due: (localTx.gateway_response as any)?.remaining_due ?? 0,
        });
      }

      // ATOMIC TRANSACTION: Commit financial records atomically
      const committedResult = await prisma.$transaction(
        async (tx: any) => {
          // Concurrency control: Transaction-level advisory lock on payment ID hash
          // Serializes concurrent requests even for DIFFERENT internal transactions
          if (paymentId) {
            await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${paymentId}))`;

            const duplicateUnderLock = await tx.payment_transactions.findFirst({
              where: {
                gateway_transaction_id: paymentId,
                status: 'success',
                payment_transaction_id: { not: localTx.payment_transaction_id },
              },
              select: { payment_transaction_id: true },
            });

            if (duplicateUnderLock) {
              logger.warn(
                '[Razorpay Standard Checkout] Payment ID replay blocked by advisory lock',
                {
                  paymentId,
                  existingTxId: duplicateUnderLock.payment_transaction_id,
                  attemptedTxId: localTx.payment_transaction_id,
                },
              );
              const err: any = new Error(
                `Payment ID '${paymentId}' is already settled against another transaction. Replay rejected.`,
              );
              err.statusCode = 400;
              err.code = 'PAYMENT_ID_ALREADY_USED';
              throw err;
            }
          }

          // Concurrency control 1: Row-level lock on transaction record
          const lockedTx: any[] = await tx.$queryRaw`
          SELECT payment_transaction_id, status FROM payment_transactions
          WHERE payment_transaction_id = ${localTx.payment_transaction_id}::uuid
          FOR UPDATE
        `;

          if (lockedTx.length > 0 && lockedTx[0].status === 'success') {
            const existingReceipt = await PaymentRepository.getReceiptDetails(
              order.org_id || '00000000-0000-0000-0000-000000000001',
              localTx.payment_transaction_id,
              tx,
            ).catch(() => null);

            return {
              alreadyCommitted: true,
              transaction: localTx,
              receipt: existingReceipt,
            };
          }

          // Concurrency control 2: Row-level lock on student_charge_dues to serialize different concurrent transactions on the same due
          if (order.student_charge_due_id) {
            const lockedDues: any[] = await tx.$queryRaw`
            SELECT student_charge_due_id, amount_due, status
            FROM student_charge_dues
            WHERE student_charge_due_id = ${order.student_charge_due_id}::uuid
            FOR UPDATE
          `;

            if (lockedDues.length > 0) {
              const dueRow = lockedDues[0];
              const dueAmount = Number(dueRow.amount_due);

              if (dueRow.status === 'cancelled' || dueRow.status === 'waived') {
                await PaymentRepository.updatePaymentTransaction(
                  localTx.payment_transaction_id,
                  {
                    status: 'pending',
                    gatewayTransactionId: paymentId,
                    transactionDate: new Date(),
                    failureCode: 'DUE_INELIGIBLE',
                    failureMessage: `Payment captured at gateway (${paymentId}), but fee due is ${dueRow.status}; cannot receive allocations. Reconciliation required.`,
                    gatewayResponse: {
                      ...gatewayPayment,
                      gateway_status: 'captured',
                      gateway_payment_id: paymentId,
                      gateway_captured: true,
                      ledger_allocated: false,
                      reconciliation_required: true,
                      reconciliation_reason: 'DUE_INELIGIBLE',
                      due_status: dueRow.status,
                    },
                  },
                  tx,
                );
                await PaymentRepository.updatePaymentOrderStatus(
                  order.payment_order_id,
                  'pending',
                  null,
                  tx,
                );
                return {
                  alreadyCommitted: false,
                  rejectedReason: 'DUE_INELIGIBLE',
                  dueStatus: dueRow.status,
                  transactionId: localTx.payment_transaction_id,
                };
              }

              const totalAllocatedBefore = await PaymentRepository.getTotalAllocatedForDue(
                order.student_charge_due_id,
                tx,
              );
              const remainingDue = dueAmount - totalAllocatedBefore;
              const requestedAmount = Number(order.amount);

              if (requestedAmount > remainingDue + 0.001) {
                logger.warn(
                  '[Razorpay Standard Checkout] Payment allocation exceeds eligible remaining due balance',
                  {
                    studentChargeDueId: order.student_charge_due_id,
                    dueAmount,
                    totalAllocatedBefore,
                    remainingDue,
                    requestedAmount,
                    paymentTransactionId: localTx.payment_transaction_id,
                  },
                );

                // Safely mark transaction and order as pending for reconciliation
                // Uses status: 'pending' (PRESERVES GATEWAY CAPTURE, NOT 'failed'!)
                await PaymentRepository.updatePaymentTransaction(
                  localTx.payment_transaction_id,
                  {
                    status: 'pending',
                    gatewayTransactionId: paymentId,
                    transactionDate: new Date(),
                    failureCode: 'EXCEEDS_REMAINING_DUE',
                    failureMessage: `Payment of ₹${requestedAmount} captured at gateway (${paymentId}) but exceeds eligible remaining due balance of ₹${remainingDue}. Reconciliation required.`,
                    gatewayResponse: {
                      ...gatewayPayment,
                      gateway_status: 'captured',
                      gateway_payment_id: paymentId,
                      gateway_captured: true,
                      ledger_allocated: false,
                      reconciliation_required: true,
                      reconciliation_reason: 'EXCEEDS_REMAINING_DUE',
                      attempted_amount: requestedAmount,
                      remaining_due: remainingDue,
                    },
                  },
                  tx,
                );
                await PaymentRepository.updatePaymentOrderStatus(
                  order.payment_order_id,
                  'pending',
                  null,
                  tx,
                );

                return {
                  alreadyCommitted: false,
                  exceedsDue: true,
                  remainingDue,
                  requestedAmount,
                  transactionId: localTx.payment_transaction_id,
                };
              }
            }
          }

          // 1. Update payment transaction to success
          const updatedTx = await PaymentRepository.updatePaymentTransaction(
            localTx.payment_transaction_id,
            {
              status: 'success',
              gatewayTransactionId: paymentId,
              transactionDate: new Date(),
              gatewayResponse: gatewayPayment,
            },
            tx,
          );

          // 2. Update payment order to paid
          await PaymentRepository.updatePaymentOrderStatus(
            order.payment_order_id,
            'paid',
            null,
            tx,
          );

          // 3. Create payment allocation
          if (order.student_charge_due_id) {
            await PaymentRepository.createPaymentAllocation(
              {
                paymentTransactionId: updatedTx.payment_transaction_id,
                studentChargeDueId: order.student_charge_due_id,
                allocatedAmount: Number(order.amount),
                notes: `Verified Standard Checkout payment (${paymentId})`,
              },
              tx,
            );

            // 4. Update student charge due status using cumulative allocation
            const due = order.student_charge_dues;
            if (due) {
              const dueAmount = Number(due.amount_due || due.amount_due_total || order.amount);
              const totalAllocated = await PaymentRepository.getTotalAllocatedForDue(
                order.student_charge_due_id,
                tx,
              );
              const newDueStatus = totalAllocated >= dueAmount ? 'paid' : 'partially_paid';
              await PaymentRepository.updateDueStatus(
                order.student_charge_due_id,
                newDueStatus,
                null,
                tx,
              );
            }
          }

          // 5. Build official receipt document
          const receipt = await PaymentRepository.getReceiptDetails(
            order.org_id || '00000000-0000-0000-0000-000000000001',
            updatedTx.payment_transaction_id,
            tx,
          ).catch(() => null);

          return {
            alreadyCommitted: false,
            transaction: updatedTx,
            receipt,
          };
        },
        {
          maxWait: 20000,
          timeout: 45000,
        },
      );

      // Over-allocation or ineligible state handling
      if (committedResult.exceedsDue) {
        return res.status(409).json({
          success: false,
          status: 'captured_unallocated',
          gateway_captured: true,
          ledger_updated: false,
          error: 'EXCEEDS_REMAINING_DUE',
          message: `Payment amount (₹${committedResult.requestedAmount}) was captured by gateway, but exceeds eligible outstanding fee balance (₹${committedResult.remainingDue}). Payment recorded as pending reconciliation.`,
          order_id: orderId,
          payment_id: paymentId,
          transaction_id: committedResult.transactionId,
          remaining_due: committedResult.remainingDue,
        });
      }

      if (committedResult.rejectedReason) {
        return res.status(409).json({
          success: false,
          status: 'captured_unallocated',
          gateway_captured: true,
          ledger_updated: false,
          error: committedResult.rejectedReason,
          message: `Payment was captured by gateway, but cannot be allocated to a ${committedResult.dueStatus} fee due. Payment recorded as pending reconciliation.`,
          order_id: orderId,
          payment_id: paymentId,
          transaction_id: committedResult.transactionId,
        });
      }

      // Post-commit: Authoritative domain event emission only if newly committed
      if (!committedResult.alreadyCommitted) {
        FinanceNotificationService.publishEvent({
          eventType: FinanceEventType.PAYMENT_SUCCESS,
          orgId: order.org_id || '00000000-0000-0000-0000-000000000001',
          sourceEntityId: committedResult.transaction.payment_transaction_id,
          sourceWorkflow: 'razorpay_standard_checkout',
          timestamp: new Date().toISOString(),
          correlationId: order.order_reference || orderId,
          idempotencyKey: `pay_succ_${committedResult.transaction.payment_transaction_id}`,
          studentId: order.student_id,
          amount: Number(order.amount),
          paymentMethod: 'Razorpay Online',
          orderReference: order.order_reference,
          receiptNumber: committedResult.receipt?.receipt_no || `RCPT-${order.order_reference}`,
        }).catch((e) =>
          logger.error('[Razorpay Standard Checkout] Success notification error:', e),
        );

        if (committedResult.receipt) {
          FinanceNotificationService.publishEvent({
            eventType: FinanceEventType.PAYMENT_RECEIPT_AVAILABLE,
            orgId: order.org_id || '00000000-0000-0000-0000-000000000001',
            sourceEntityId: committedResult.transaction.payment_transaction_id,
            sourceWorkflow: 'razorpay_standard_checkout',
            timestamp: new Date().toISOString(),
            correlationId: `rcpt_${committedResult.receipt.receipt_no}`,
            idempotencyKey: `rcpt_${committedResult.receipt.receipt_no}`,
            studentId: order.student_id,
            studentName: committedResult.receipt.student_name,
            admissionNo: committedResult.receipt.admission_no,
            amount: Number(order.amount),
            receiptNumber: committedResult.receipt.receipt_no,
            receiptUrl: `/app/finance/receipts/view/${committedResult.receipt.receipt_no}`,
          }).catch((e) =>
            logger.error('[Razorpay Standard Checkout] Receipt notification error:', e),
          );
        }
      }

      return res.status(200).json({
        success: true,
        status: 'committed',
        is_demo: false,
        ledger_updated: true,
        message: 'Payment verified and committed to EduTrack ledger',
        order_id: orderId,
        payment_id: paymentId,
        transaction_id: committedResult.transaction.payment_transaction_id,
        receipt_number:
          committedResult.receipt?.receipt_no || `RCPT-${order.order_reference || orderId}`,
        receipt: committedResult.receipt,
      });
    }

    // -------------------------------------------------------------------------
    // Standalone Sandbox Demo: Verified by Gateway, No Ledger Records Touched
    // -------------------------------------------------------------------------
    logger.info(
      `[Razorpay Standard Checkout] Demo payment verified: ${paymentId} for order ${orderId}`,
    );

    return res.status(200).json({
      success: true,
      status: 'demo_verified',
      is_demo: true,
      ledger_updated: false,
      message: 'Gateway payment verified — demo only; EduTrack ledger not updated.',
      order_id: orderId,
      payment_id: paymentId,
      amount: gatewayPayment.amount,
      currency: gatewayPayment.currency,
    });
  } catch (error: any) {
    logger.error('[Razorpay Standard Checkout] Verification exception:', error);
    return res.status(500).json({
      success: false,
      error: 'VERIFICATION_ERROR',
      message: error.message || 'Payment signature verification failed',
    });
  }
});

/**
 * STEP 9: WEBHOOK INGESTION & RECONCILIATION
 * Endpoint: POST /api/razorpay/webhook (and /razorpay/webhook)
 *
 * Verifies webhook signature against raw request body using RAZORPAY_WEBHOOK_SECRET.
 * Idempotently ingests events into payment_webhook_events table.
 * Reconciles payment captures and safely ignores out-of-order late failure events.
 */
razorpayRouter.post(['/razorpay/webhook', '/webhook'], async (req: Request, res: Response) => {
  try {
    const signature = (req.headers['x-razorpay-signature'] || '') as string;
    if (!signature) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_SIGNATURE',
        message: 'Missing x-razorpay-signature header for webhook authentication.',
      });
    }

    const rawBody = (req as any).rawBody;
    if (!rawBody || (Buffer.isBuffer(rawBody) && rawBody.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'RAW_BODY_UNAVAILABLE',
        message:
          'Raw request body is unavailable for cryptographic webhook signature verification.',
      });
    }

    const result = await RazorpayGatewayService.processWebhook(rawBody, signature, req.body);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error: any) {
    logger.error('[Razorpay Webhook Route] Webhook processing error:', error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      error: error.code || 'WEBHOOK_PROCESSING_FAILED',
      message: error.message || 'Failed to process webhook event',
    });
  }
});

/**
 * RECOVERY ENDPOINT: Webhook Event Recovery & Reprocessing
 * Endpoint: POST /api/razorpay/webhook/recover
 *
 * Supports manual or scheduled recovery of stuck webhook events in 'received' or 'failed' state.
 */
razorpayRouter.post(
  ['/razorpay/webhook/recover', '/webhook/recover'],
  async (req: Request, res: Response) => {
    try {
      const olderThanMs = req.body.olderThanMs !== undefined ? Number(req.body.olderThanMs) : 0;
      const limit = req.body.limit !== undefined ? Number(req.body.limit) : 50;
      const includeFailed =
        req.body.includeFailed !== undefined ? Boolean(req.body.includeFailed) : true;
      const eventId = req.body.eventId || req.body.webhookEventId;

      if (eventId) {
        const singleResult = await RazorpayGatewayService.reprocessWebhookEvent(eventId);
        return res.status(200).json({
          success: true,
          data: singleResult,
        });
      }

      const recoveryResult = await RazorpayGatewayService.recoverStuckWebhookEvents({
        olderThanMs,
        limit,
        includeFailed,
      });

      return res.status(200).json({
        success: true,
        message: `Recovered ${recoveryResult.recoveredCount} events, ${recoveryResult.failedCount} failures`,
        data: recoveryResult,
      });
    } catch (err: any) {
      logger.error('[Razorpay Recovery Route] Recovery error:', err);
      return res.status(err.statusCode || 500).json({
        success: false,
        error: 'RECOVERY_ERROR',
        message: err.message,
      });
    }
  },
);

/**
 * -----------------------------------------------------------------------------
 * HOSTED RAZORPAY CHECKOUT ROUTE
 * Endpoint: GET /razorpay/checkout/:paymentOrderId (and /checkout/:paymentOrderId)
 *
 * Provides a mobile-optimized, secure checkout page hosting official Razorpay
 * Standard Checkout JS. Seamlessly supports both live/test gateway mode and
 * developer sandbox simulation mode, with auto-redirect to edutrack:// app scheme.
 * -----------------------------------------------------------------------------
 */
razorpayRouter.get(
  [
    '/razorpay/checkout/:paymentOrderId',
    '/checkout/:paymentOrderId',
    '/api/razorpay/checkout/:paymentOrderId',
    '/fees/razorpay/checkout/:paymentOrderId',
    '/api/v1/fees/razorpay/checkout/:paymentOrderId',
  ],
  async (req: Request, res: Response) => {
    try {
      const { paymentOrderId } = req.params;

      if (!paymentOrderId) {
        return res
          .status(400)
          .send('<html><body><h3>Error: Payment Order ID is required</h3></body></html>');
      }

      const order = await prisma.payment_orders.findUnique({
        where: { payment_order_id: paymentOrderId },
        include: {
          payment_transactions: {
            orderBy: { created_at: 'desc' },
            take: 1,
          },
          students: {
            select: {
              student_id: true,
              first_name: true,
              last_name: true,
              admission_no: true,
            },
          },
        },
      });

      if (!order) {
        return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Not Found - EduTrack ERP</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: #f8fafc; }
            .card { background: #1e293b; padding: 32px; border-radius: 20px; max-width: 400px; text-align: center; border: 1px solid #334155; }
            h2 { color: #f43f5e; margin-top: 0; }
            p { color: #94a3b8; font-size: 14px; }
            a { display: inline-block; margin-top: 20px; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Payment Order Not Found</h2>
            <p>The requested fee payment order could not be located or has expired.</p>
            <a href="edutrack://parent/fees">Return to EduTrack App</a>
          </div>
        </body>
        </html>
      `);
      }

      const latestTx = order.payment_transactions[0];
      const isAlreadySettled = latestTx && latestTx.status === 'success';

      let dueInfo: any = null;
      if (order.student_charge_due_id) {
        dueInfo = await prisma.student_charge_dues.findUnique({
          where: { student_charge_due_id: order.student_charge_due_id },
          include: { installment_plan_terms: true, student_charges: true },
        });
      }

      const studentName = order.students
        ? `${order.students.first_name} ${order.students.last_name || ''}`.trim()
        : 'Student';
      const admissionNo = order.students?.admission_no || '-';
      const termName =
        dueInfo?.installment_plan_terms?.name ||
        dueInfo?.student_charges?.description ||
        'Academic Fee Due';
      const componentName = dueInfo?.student_charges?.description || 'Tuition / Installment';
      const amountInRupees = Number(order.amount);
      const amountInPaise = Math.round(amountInRupees * 100);
      const currency = order.currency_code || 'INR';

      const { keyId, isConfigured } = getRazorpayConfig();
      const isSimulation = !isConfigured;
      const gatewayOrderId = latestTx?.gateway_order_id || `order_sim_${order.payment_order_id}`;
      const txReference =
        latestTx?.gateway_transaction_id ||
        (latestTx?.payment_transaction_id
          ? latestTx.payment_transaction_id.slice(0, 8)
          : 'SETTLED');

      // If already settled, display receipt summary
      if (isAlreadySettled) {
        return res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Settled - EduTrack ERP</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0f172a; color: #f8fafc; padding: 20px; box-sizing: border-box; }
            .card { background: #1e293b; padding: 32px; border-radius: 24px; max-width: 440px; width: 100%; text-align: center; border: 1px solid #334155; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
            .badge { display: inline-block; background: #064e3b; color: #34d399; padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: bold; margin-bottom: 16px; border: 1px solid #059669; }
            h2 { color: #f8fafc; margin: 0 0 8px 0; font-size: 22px; font-weight: 800; }
            .amount { font-size: 36px; font-weight: 900; color: #38bdf8; margin: 16px 0; }
            .details { background: #0f172a; padding: 16px; border-radius: 16px; text-align: left; margin: 20px 0; border: 1px solid #334155; }
            .row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; }
            .label { color: #94a3b8; }
            .val { color: #f1f5f9; font-weight: 600; }
            .btn { display: block; width: 100%; box-sizing: border-box; background: #4f46e5; color: white; padding: 14px 20px; border-radius: 14px; text-decoration: none; font-weight: bold; font-size: 15px; margin-top: 12px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">✓ SETTLED & RECONCILED</div>
            <h2>Fee Payment Completed</h2>
            <div class="amount">₹${amountInRupees.toLocaleString('en-IN')}</div>
            <div class="details">
              <div class="row"><span class="label">Student:</span><span class="val">${studentName}</span></div>
              <div class="row"><span class="label">Admission No:</span><span class="val">${admissionNo}</span></div>
              <div class="row"><span class="label">Obligation:</span><span class="val">${termName}</span></div>
              <div class="row"><span class="label">Transaction Ref:</span><span class="val">${txReference}</span></div>
            </div>
            <a class="btn" href="edutrack://parent/fees?status=success&txId=${latestTx.payment_transaction_id}">Return to EduTrack App</a>
          </div>
        </body>
        </html>
      `);
      }

      // Render Live or Sandbox Checkout Page
      return res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>EduTrack ERP - Secure Fee Checkout</title>
        ${!isSimulation ? '<script src="https://checkout.razorpay.com/v1/checkout.js"></script>' : ''}
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #090d16;
            color: #f1f5f9;
            margin: 0;
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .container {
            background: #131b2e;
            border: 1px solid #1e293b;
            border-radius: 28px;
            padding: 28px;
            max-width: 440px;
            width: 100%;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
            position: relative;
            overflow: hidden;
          }
          .header {
            display: flex;
            align-items: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid #1e293b;
          }
          .logo {
            width: 44px;
            height: 44px;
            background: #4f46e5;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 900;
            font-size: 20px;
            margin-right: 14px;
            box-shadow: 0 8px 16px rgba(79, 70, 229, 0.35);
          }
          .title-box h1 { margin: 0; font-size: 18px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em; }
          .title-box p { margin: 2px 0 0; font-size: 11px; font-weight: 700; color: #818cf8; text-transform: uppercase; letter-spacing: 0.05em; }
          .summary-card {
            background: #0b1120;
            border: 1px solid #1e293b;
            border-radius: 20px;
            padding: 20px;
            margin-bottom: 24px;
          }
          .amount-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 16px;
            padding-bottom: 14px;
            border-bottom: 1px dashed #334155;
          }
          .amount-label { font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
          .amount-val { font-size: 28px; font-weight: 900; color: #38bdf8; letter-spacing: -0.02em; }
          .info-line { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; }
          .info-label { color: #64748b; }
          .info-val { color: #e2e8f0; font-weight: 600; text-align: right; }
          .gateway-badge {
            display: flex;
            align-items: center;
            justify-content: center;
            background: #1e1b4b;
            color: #a5b4fc;
            padding: 8px 12px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 700;
            margin-bottom: 20px;
            border: 1px solid #3730a3;
          }
          .btn-primary {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            background: #4f46e5;
            color: white;
            padding: 16px;
            border-radius: 18px;
            border: none;
            font-size: 16px;
            font-weight: 800;
            cursor: pointer;
            box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.4);
            transition: all 0.2s ease;
          }
          .btn-primary:active { transform: scale(0.98); }
          .btn-secondary {
            display: block;
            width: 100%;
            text-align: center;
            background: transparent;
            color: #94a3b8;
            padding: 12px;
            border: 1px solid #334155;
            border-radius: 16px;
            font-size: 14px;
            font-weight: 600;
            margin-top: 10px;
            text-decoration: none;
            cursor: pointer;
          }
          .status-panel { display: none; text-align: center; padding: 20px 0; }
          .spinner {
            width: 44px;
            height: 44px;
            border: 4px solid #334155;
            border-top: 4px solid #4f46e5;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .sim-box {
            background: #1e293b;
            border: 1px dashed #6366f1;
            padding: 16px;
            border-radius: 16px;
            margin-bottom: 20px;
          }
          .sim-title { font-size: 12px; font-weight: 800; color: #a5b4fc; text-transform: uppercase; margin-bottom: 12px; text-align: center; }
          .sim-btn {
            width: 100%;
            padding: 12px;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 700;
            margin-bottom: 8px;
            border: none;
            cursor: pointer;
          }
          .sim-btn-success { background: #059669; color: white; }
          .sim-btn-cancel { background: #334155; color: #cbd5e1; }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Main Payment View -->
          <div id="checkout-view">
            <div class="header">
              <div class="logo">E</div>
              <div class="title-box">
                <h1>EduTrack ERP</h1>
                <p>Parent Payment Gateway</p>
              </div>
            </div>

            <div class="summary-card">
              <div class="amount-row">
                <span class="amount-label">Payable Amount</span>
                <span class="amount-val">₹${amountInRupees.toLocaleString('en-IN')}</span>
              </div>
              <div class="info-line"><span class="info-label">Student:</span><span class="info-val">${studentName}</span></div>
              <div class="info-line"><span class="info-label">Admission No:</span><span class="info-val">${admissionNo}</span></div>
              <div class="info-line"><span class="info-label">Term Due:</span><span class="info-val">${termName}</span></div>
              <div class="info-line"><span class="info-label">Component:</span><span class="info-val">${componentName}</span></div>
            </div>

            <div class="gateway-badge">
              🔒 256-Bit Encrypted Razorpay Checkout
            </div>

            ${
              !isSimulation
                ? `
              <button id="rzp-btn" class="btn-primary" onclick="openRazorpay()">
                Pay ₹${amountInRupees.toLocaleString('en-IN')} via Razorpay
              </button>
              <a class="btn-secondary" href="edutrack://parent/fees?status=cancelled">
                Cancel & Return
              </a>
            `
                : `
              <div class="sim-box">
                <div class="sim-title">⚡ Developer Sandbox Simulation</div>
                <button class="sim-btn sim-btn-success" onclick="simulatePaymentSuccess('card')">
                  Simulate Card Payment (Success)
                </button>
                <button class="sim-btn sim-btn-success" onclick="simulatePaymentSuccess('upi')">
                  Simulate UPI Payment (Success)
                </button>
                <button class="sim-btn sim-btn-cancel" onclick="simulatePaymentCancel()">
                  Cancel Payment
                </button>
              </div>
              <a class="btn-secondary" href="edutrack://parent/fees?status=cancelled">
                Cancel & Return to App
              </a>
            `
            }
          </div>

          <!-- Processing / Verifying View -->
          <div id="status-view" class="status-panel">
            <div class="spinner"></div>
            <h3 id="status-title" style="margin: 0 0 8px; color: #f1f5f9;">Verifying Payment...</h3>
            <p id="status-desc" style="margin: 0; color: #94a3b8; font-size: 13px;">Please wait while the server reconciles your transaction into the student ledger.</p>
          </div>

          <!-- Success View -->
          <div id="success-view" class="status-panel">
            <div style="font-size: 52px; color: #10b981; margin-bottom: 12px;">✓</div>
            <h2 style="color: #f1f5f9; margin: 0 0 8px;">Payment Reconciled!</h2>
            <p style="color: #94a3b8; font-size: 14px; margin-bottom: 20px;">
              ₹${amountInRupees.toLocaleString('en-IN')} has been committed to the ledger.
            </p>
            <div style="background: #0b1120; border: 1px solid #1e293b; padding: 16px; border-radius: 16px; text-align: left; margin-bottom: 24px; font-size: 13px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span style="color:#64748b;">Receipt:</span><span id="succ-receipt" style="font-weight:bold; color:#38bdf8;">-</span></div>
              <div style="display:flex; justify-content:space-between;"><span style="color:#64748b;">Transaction:</span><span id="succ-tx" style="font-family:monospace; color:#cbd5e1;">-</span></div>
            </div>
            <a id="return-app-btn" class="btn-primary" href="edutrack://parent/fees?status=success">
              Return to EduTrack App
            </a>
          </div>

          <!-- Error / Cancelled View -->
          <div id="error-view" class="status-panel">
            <div style="font-size: 48px; color: #f43f5e; margin-bottom: 12px;">⚠️</div>
            <h3 id="err-title" style="color: #f1f5f9; margin: 0 0 8px;">Payment Incomplete</h3>
            <p id="err-desc" style="color: #94a3b8; font-size: 13px; margin-bottom: 24px;"></p>
            <button class="btn-primary" onclick="resetViews()">Retry Payment</button>
            <a class="btn-secondary" href="edutrack://parent/fees?status=cancelled">Return to App</a>
          </div>
        </div>

        <script>
          function showView(viewId) {
            ['checkout-view', 'status-view', 'success-view', 'error-view'].forEach(id => {
              const el = document.getElementById(id);
              if (el) el.style.display = (id === viewId) ? 'block' : 'none';
            });
          }

          function resetViews() {
            showView('checkout-view');
          }

          ${
            !isSimulation
              ? `
            var rzpOptions = {
              key: "${keyId}",
              amount: ${amountInPaise},
              currency: "${currency}",
              name: "EduTrack ERP",
              description: "Fee Payment - ${studentName}",
              order_id: "${gatewayOrderId}",
              prefill: {
                name: "${studentName}",
              },
              theme: {
                color: "#4f46e5"
              },
              handler: async function (response) {
                showView('status-view');
                document.getElementById('status-title').innerText = 'Verifying Transaction...';
                document.getElementById('status-desc').innerText = 'Cryptographically reconciling payment with EduTrack ledger...';

                try {
                  const verifyRes = await fetch('/api/verify-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      payment_order_id: "${order.payment_order_id}",
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature,
                    })
                  });

                  const data = await verifyRes.json();
                  if (verifyRes.ok && data.success) {
                    document.getElementById('succ-receipt').innerText = data.receiptNumber || 'OFFICIAL RECEIPT';
                    document.getElementById('succ-tx').innerText = data.transactionId ? data.transactionId.slice(0, 12) + '...' : response.razorpay_payment_id;
                    const returnBtn = document.getElementById('return-app-btn');
                    returnBtn.href = "edutrack://parent/fees?status=success&txId=" + (data.transactionId || "${order.payment_order_id}");
                    showView('success-view');

                    // Auto deep-link return
                    setTimeout(function() {
                      window.location.href = returnBtn.href;
                    }, 1800);
                  } else {
                    document.getElementById('err-title').innerText = 'Verification Failed';
                    document.getElementById('err-desc').innerText = data.message || 'Signature mismatch or unverified payment state.';
                    showView('error-view');
                  }
                } catch (e) {
                  document.getElementById('err-title').innerText = 'Network Connection Error';
                  document.getElementById('err-desc').innerText = 'Unable to reach backend verification service. Please check your network and return to app.';
                  showView('error-view');
                }
              },
              modal: {
                ondismiss: function () {
                  document.getElementById('err-title').innerText = 'Payment Cancelled';
                  document.getElementById('err-desc').innerText = 'You dismissed the payment gateway before completion.';
                  showView('error-view');
                }
              }
            };

            var rzpInstance = null;
            function openRazorpay() {
              if (!rzpInstance && window.Razorpay) {
                rzpInstance = new window.Razorpay(rzpOptions);
              }
              if (rzpInstance) {
                rzpInstance.open();
              }
            }

            window.addEventListener('load', function() {
              setTimeout(function() {
                openRazorpay();
              }, 400);
            });
          `
              : `
            async function simulatePaymentSuccess(method) {
              showView('status-view');
              document.getElementById('status-title').innerText = 'Simulating Gateway Settlement...';

              try {
                const now = Date.now();
                const verifyRes = await fetch('/api/verify-payment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    payment_order_id: "${order.payment_order_id}",
                    razorpay_order_id: "${gatewayOrderId}",
                    razorpay_payment_id: "pay_sim_" + now,
                    razorpay_signature: "sim_valid_sig_" + now,
                  })
                });

                const data = await verifyRes.json();
                if (verifyRes.ok && data.success) {
                  document.getElementById('succ-receipt').innerText = data.receiptNumber || 'SIM-RECEIPT';
                  document.getElementById('succ-tx').innerText = data.transactionId ? data.transactionId.slice(0, 12) + '...' : 'sim_' + now;
                  const returnBtn = document.getElementById('return-app-btn');
                  returnBtn.href = "edutrack://parent/fees?status=success&txId=" + (data.transactionId || "${order.payment_order_id}");
                  showView('success-view');

                  setTimeout(function() {
                    window.location.href = returnBtn.href;
                  }, 1500);
                } else {
                  document.getElementById('err-title').innerText = 'Simulation Failed';
                  document.getElementById('err-desc').innerText = data.message || 'Could not verify simulated payment.';
                  showView('error-view');
                }
              } catch (e) {
                document.getElementById('err-title').innerText = 'Connection Error';
                document.getElementById('err-desc').innerText = e.message;
                showView('error-view');
              }
            }

            function simulatePaymentCancel() {
              window.location.href = "edutrack://parent/fees?status=cancelled";
            }
          `
          }
        </script>
      </body>
      </html>
    `);
    } catch (err: any) {
      logger.error('[Hosted Checkout Route] Exception:', err);
      return res.status(500).send(`
      <!DOCTYPE html>
      <html><body><h2>Internal Server Error</h2><p>${err.message}</p></body></html>
    `);
    }
  },
);
