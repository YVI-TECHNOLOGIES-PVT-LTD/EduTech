import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import Razorpay from 'razorpay';
import prisma from '../lib/prismaClient';
import { logger } from '../utils/logger';
import { PaymentRepository } from '../modules/fees/repositories/PaymentRepository';
import { RazorpayGatewayService } from '../modules/fees/services/RazorpayGatewayService';
import { PaymentCollectionService } from '../modules/fees/services/PaymentCollectionService';
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
        message: 'Razorpay credentials not configured. Please check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server .env',
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
        req.context?.user?.org_id ||
        req.context?.user?.school_id ||
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
      const effectiveUserId = req.context?.user?.id || (req.context?.user as any)?.user_id || null;

      // Delegate to PaymentCollectionService which checks remaining balance and prevents overpayment
      const requestedRupees = req.body.amount_in_rupees || (req.body.amount ? req.body.amount / 100 : undefined);
      
      const erpOrderResult = await PaymentCollectionService.createOnlinePaymentOrder(
        effectiveOrgId,
        effectiveUserId,
        {
          studentId,
          studentChargeDueId: targetDueId,
          amount: Number(requestedRupees),
          paymentMethod: req.body.paymentMethod || 'card',
          notes: req.body.notes ? JSON.stringify(req.body.notes) : undefined,
        }
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

    const receipt = req.body.receipt || `demo_rcpt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
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

      logger.warn('[Razorpay Standard Checkout] SDK call error, trying direct API call:', sdkError.message || sdkError);
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
        }
      );

      orderId = response.data.id;
      orderAmount = response.data.amount;
      orderCurrency = response.data.currency;
    }

    logger.info(`[Razorpay Standard Checkout] Demo order created: ${orderId} (${orderAmount} ${orderCurrency})`);

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
    const errorDesc = error.response?.data?.error?.description || error.error?.description || error.message || 'Razorpay order creation failed';

    logger.error('[Razorpay Standard Checkout] Order creation error:', { status, description: errorDesc });

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
    const orderId = String(req.body.razorpay_order_id || req.body.order_id || req.body.razorpayOrderId || '').trim();
    const paymentId = String(req.body.razorpay_payment_id || req.body.payment_id || req.body.razorpayPaymentId || '').trim();
    const signature = String(req.body.razorpay_signature || req.body.signature || req.body.razorpaySignature || '').trim();
    const clientPaymentOrderId = req.body.payment_order_id || req.body.paymentOrderId;

    // Error handling: Missing fields
    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required for verification.',
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
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(payload)
      .digest('hex');

    const expectedBuf = Buffer.from(generatedSignature, 'utf8');
    const providedBuf = Buffer.from(signature, 'utf8');

    const isSignatureValid =
      expectedBuf.length === providedBuf.length &&
      crypto.timingSafeEqual(expectedBuf, providedBuf);

    if (!isSignatureValid) {
      logger.warn('[Razorpay Standard Checkout] Signature mismatch detected', { orderId, paymentId });

      // If a local transaction exists, mark it failed to record the security event
      const localTx = await PaymentRepository.findTransactionWithOrderAndDueByGatewayRef(orderId).catch(() => null);
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
        message: 'Gateway verification is temporarily unavailable. Payment status is pending reconciliation.',
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
    let localTx: any = await PaymentRepository.findTransactionWithOrderAndDueByGatewayRef(orderId).catch(() => null);

    if (!localTx && clientPaymentOrderId) {
      const orderRecord = await PaymentRepository.findPaymentOrderForVerification(clientPaymentOrderId).catch(() => null);
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
      const requestTenant = (req as any).tenantOrgId || (req as any).context?.user?.org_id || (req as any).context?.user?.school_id || (req.headers['x-tenant-id'] as string);
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

      // Verify amount matching
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

      // IDEMPOTENCY GUARANTEE: If transaction is ALREADY marked success, return existing receipt safely
      if (localTx.status === 'success') {
        logger.info('[Razorpay Standard Checkout] Idempotent duplicate verification request received', {
          orderId,
          paymentId,
        });

        const existingReceipt = await PaymentRepository.getReceiptDetails(
          order.org_id || '00000000-0000-0000-0000-000000000001',
          localTx.payment_transaction_id
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
        (localTx.failure_code === 'EXCEEDS_REMAINING_DUE' || (localTx.gateway_response as any)?.reconciliation_required)
      ) {
        logger.info('[Razorpay Standard Checkout] Idempotent duplicate verification for captured-unallocated payment', {
          orderId,
          paymentId,
        });

        return res.status(409).json({
          success: false,
          status: 'captured_unallocated',
          gateway_captured: true,
          ledger_updated: false,
          error: localTx.failure_code || 'EXCEEDS_REMAINING_DUE',
          message: localTx.failure_message || `Payment was captured at gateway (${paymentId}), but cannot be allocated because it exceeds eligible remaining due balance. Flagged for manual reconciliation.`,
          order_id: orderId,
          payment_id: paymentId,
          transaction_id: localTx.payment_transaction_id,
          remaining_due: (localTx.gateway_response as any)?.remaining_due ?? 0,
        });
      }

      // ATOMIC TRANSACTION: Commit financial records atomically
      const committedResult = await prisma.$transaction(async (tx: any) => {
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
            tx
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
                tx
              );
              await PaymentRepository.updatePaymentOrderStatus(order.payment_order_id, 'pending', null, tx);
              return { alreadyCommitted: false, rejectedReason: 'DUE_INELIGIBLE', dueStatus: dueRow.status, transactionId: localTx.payment_transaction_id };
            }

            const totalAllocatedBefore = await PaymentRepository.getTotalAllocatedForDue(order.student_charge_due_id, tx);
            const remainingDue = dueAmount - totalAllocatedBefore;
            const requestedAmount = Number(order.amount);

            if (requestedAmount > remainingDue + 0.001) {
              logger.warn('[Razorpay Standard Checkout] Payment allocation exceeds eligible remaining due balance', {
                studentChargeDueId: order.student_charge_due_id,
                dueAmount,
                totalAllocatedBefore,
                remainingDue,
                requestedAmount,
                paymentTransactionId: localTx.payment_transaction_id,
              });

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
                tx
              );
              await PaymentRepository.updatePaymentOrderStatus(
                order.payment_order_id,
                'pending',
                null,
                tx
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
          tx
        );

        // 2. Update payment order to paid
        await PaymentRepository.updatePaymentOrderStatus(
          order.payment_order_id,
          'paid',
          null,
          tx
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
            tx
          );

          // 4. Update student charge due status using cumulative allocation
          const due = order.student_charge_dues;
          if (due) {
            const dueAmount = Number(due.amount_due || due.amount_due_total || order.amount);
            const totalAllocated = await PaymentRepository.getTotalAllocatedForDue(order.student_charge_due_id, tx);
            const newDueStatus = totalAllocated >= dueAmount ? 'paid' : 'partially_paid';
            await PaymentRepository.updateDueStatus(order.student_charge_due_id, newDueStatus, null, tx);
          }
        }

        // 5. Build official receipt document
        const receipt = await PaymentRepository.getReceiptDetails(
          order.org_id || '00000000-0000-0000-0000-000000000001',
          updatedTx.payment_transaction_id,
          tx
        ).catch(() => null);

        return {
          alreadyCommitted: false,
          transaction: updatedTx,
          receipt,
        };
      }, {
        maxWait: 20000,
        timeout: 45000,
      });

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
        }).catch((e) => logger.error('[Razorpay Standard Checkout] Success notification error:', e));

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
          }).catch((e) => logger.error('[Razorpay Standard Checkout] Receipt notification error:', e));
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
        receipt_number: committedResult.receipt?.receipt_no || `RCPT-${order.order_reference || orderId}`,
        receipt: committedResult.receipt,
      });
    }

    // -------------------------------------------------------------------------
    // Standalone Sandbox Demo: Verified by Gateway, No Ledger Records Touched
    // -------------------------------------------------------------------------
    logger.info(`[Razorpay Standard Checkout] Demo payment verified: ${paymentId} for order ${orderId}`);

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
        message: 'Raw request body is unavailable for cryptographic webhook signature verification.',
      });
    }

    const result = await RazorpayGatewayService.processWebhook(
      rawBody,
      signature,
      req.body
    );

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
razorpayRouter.post(['/razorpay/webhook/recover', '/webhook/recover'], async (req: Request, res: Response) => {
  try {
    const olderThanMs = req.body.olderThanMs !== undefined ? Number(req.body.olderThanMs) : 0;
    const limit = req.body.limit !== undefined ? Number(req.body.limit) : 50;
    const includeFailed = req.body.includeFailed !== undefined ? Boolean(req.body.includeFailed) : true;
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
});
