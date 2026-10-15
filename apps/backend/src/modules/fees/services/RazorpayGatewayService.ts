import crypto from 'crypto';
import axios from 'axios';
import { Prisma } from '@prisma/client';
import prisma from '../../../lib/prismaClient';
import { logger } from '../../../utils/logger';
import { PaymentRepository } from '../repositories/PaymentRepository';
import { FinanceNotificationService } from './FinanceNotificationService';
import { FinanceEventType } from '../events/finance.events';

export interface RazorpayOrderParams {
  amount: number; // in INR rupees
  orderReference: string; // internal order reference, e.g. ORD-2026-XXXXXX
  studentId: string;
  dueId: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  gateway_order_id: string;
  amount: number; // in INR rupees
  amount_minor: number; // in paise
  currency: string;
  is_simulation: boolean;
  key_id: string;
}

export interface CheckoutVerificationParams {
  paymentOrderId: string;
  gatewayOrderId: string;
  gatewayPaymentId: string;
  gatewaySignature: string;
  expectedAmount: number; // in INR rupees
}

export interface WebhookProcessingResult {
  success: boolean;
  event_id: string;
  event_type: string;
  status: 'processed' | 'duplicate' | 'ignored' | 'failed';
  message: string;
  transaction_id?: string;
  allocation_id?: string;
}

export class RazorpayGatewayService {
  /**
   * Get server-side Razorpay credentials securely.
   * Secrets are NEVER logged or returned to client.
   */
  public static getCredentials() {
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
   * Creates an official Razorpay Order via server-to-server API.
   * Converts INR amount to minor unit (paise).
   */
  public static async createOrder(params: RazorpayOrderParams): Promise<RazorpayOrderResult> {
    const creds = this.getCredentials();
    const amountMinor = Math.round(params.amount * 100);

    if (amountMinor <= 0) {
      const err: any = new Error('Order amount must be greater than zero');
      err.statusCode = 400;
      throw err;
    }

    // Strict Production Check: Simulation is strictly forbidden in production
    if (!creds.isConfigured) {
      if (creds.isProduction) {
        const err: any = new Error(
          'Payment Gateway Error: Razorpay credentials are not configured in production environment.'
        );
        err.statusCode = 503;
        throw err;
      }

      // Safe non-production development fallback
      logger.warn('[RazorpayGatewayService] Non-production environment without keys; generating development order reference');
      const simOrderId = `order_sim_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
      return {
        gateway_order_id: simOrderId,
        amount: params.amount,
        amount_minor: amountMinor,
        currency: 'INR',
        is_simulation: true,
        key_id: 'rzp_test_simulated_key',
      };
    }

    try {
      const basicAuth = Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString('base64');
      const response = await axios.post(
        'https://api.razorpay.com/v1/orders',
        {
          amount: amountMinor,
          currency: 'INR',
          receipt: params.orderReference,
          notes: {
            student_id: params.studentId,
            due_id: params.dueId,
            ...(params.notes || {}),
          },
        },
        {
          headers: {
            Authorization: `Basic ${basicAuth}`,
            'Content-Type': 'application/json',
          },
          timeout: 8000,
        }
      );

      return {
        gateway_order_id: response.data.id,
        amount: params.amount,
        amount_minor: amountMinor,
        currency: response.data.currency || 'INR',
        is_simulation: false,
        key_id: creds.keyId,
      };
    } catch (err: any) {
      const status = err.response?.status;
      const errorDescription = err.response?.data?.error?.description || err.message;
      logger.error('[RazorpayGatewayService] Razorpay order creation failed', {
        status,
        error: errorDescription,
        orderReference: params.orderReference,
      });

      const error: any = new Error(
        `Failed to create payment order with gateway: ${errorDescription}`
      );
      error.statusCode = status === 401 ? 502 : 500;
      throw error;
    }
  }

  /**
   * Cryptographically verifies Checkout signature using timing-safe comparison.
   * payload = razorpay_order_id + '|' + razorpay_payment_id
   */
  public static verifyCheckoutSignature(params: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): boolean {
    const creds = this.getCredentials();

    if (!params.razorpayOrderId || !params.razorpayPaymentId || !params.razorpaySignature) {
      return false;
    }

    // In development/test mode only: allow simulation signature if order is simulation
    if (!creds.isConfigured && !creds.isProduction) {
      if (
        params.razorpayOrderId.startsWith('order_sim_') &&
        (params.razorpaySignature === 'simulated_valid_signature' ||
          params.razorpaySignature.startsWith('sim_valid_sig_'))
      ) {
        return true;
      }
      return false;
    }

    if (!creds.keySecret) {
      return false;
    }

    try {
      const payload = `${params.razorpayOrderId}|${params.razorpayPaymentId}`;
      const expectedSignatureHex = crypto
        .createHmac('sha256', creds.keySecret)
        .update(payload)
        .digest('hex');

      const expectedBuf = Buffer.from(expectedSignatureHex, 'utf8');
      const providedBuf = Buffer.from(params.razorpaySignature, 'utf8');

      if (expectedBuf.length !== providedBuf.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuf, providedBuf);
    } catch (err) {
      logger.error('[RazorpayGatewayService] Signature verification exception', { err });
      return false;
    }
  }

  /**
   * Verifies actual payment state directly via server-to-server Razorpay API.
   * Confirms payment is captured/authorized, amount matches, and currency is INR.
   */
  public static async fetchAndVerifyPayment(
    paymentId: string,
    expectedOrderId: string,
    expectedAmountRupees: number
  ): Promise<{
    verified: boolean;
    status: string;
    amount: number;
    raw?: any;
    error?: string;
  }> {
    const creds = this.getCredentials();

    // In non-production simulation mode:
    if (!creds.isConfigured && !creds.isProduction) {
      if (expectedOrderId.startsWith('order_sim_')) {
        return {
          verified: true,
          status: 'captured',
          amount: expectedAmountRupees,
        };
      }
    }

    if (!creds.isConfigured) {
      return {
        verified: false,
        status: 'unverified',
        amount: expectedAmountRupees,
        error: 'Razorpay credentials not configured for server verification',
      };
    }

    try {
      const basicAuth = Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString('base64');
      const response = await axios.get(`https://api.razorpay.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Basic ${basicAuth}`,
        },
        timeout: 8000,
      });

      const data = response.data;
      const expectedMinor = Math.round(expectedAmountRupees * 100);

      // Check 1: Payment status must be strictly captured (authorized is rejected)
      if (data.status === 'authorized') {
        return {
          verified: false,
          status: 'authorized',
          amount: data.amount / 100,
          raw: data,
          error: 'Payment is authorized but not captured. Payment cannot be committed until captured.',
        };
      }

      const isStatusValid = data.status === 'captured';
      if (!isStatusValid) {
        return {
          verified: false,
          status: data.status,
          amount: data.amount / 100,
          raw: data,
          error: `Payment status is '${data.status}', not captured/authorized`,
        };
      }

      // Check 2: Order ID match
      if (data.order_id && data.order_id !== expectedOrderId) {
        return {
          verified: false,
          status: data.status,
          amount: data.amount / 100,
          raw: data,
          error: `Gateway order mismatch: expected ${expectedOrderId}, got ${data.order_id}`,
        };
      }

      // Check 3: Amount match
      if (data.amount !== expectedMinor) {
        return {
          verified: false,
          status: data.status,
          amount: data.amount / 100,
          raw: data,
          error: `Gateway amount mismatch: expected ${expectedMinor} paise, got ${data.amount} paise`,
        };
      }

      // Check 4: Currency match
      if (data.currency !== 'INR') {
        return {
          verified: false,
          status: data.status,
          amount: data.amount / 100,
          raw: data,
          error: `Gateway currency mismatch: expected INR, got ${data.currency}`,
        };
      }

      return {
        verified: true,
        status: data.status,
        amount: data.amount / 100,
        raw: data,
      };
    } catch (err: any) {
      logger.error('[RazorpayGatewayService] Failed to fetch payment from gateway', {
        paymentId,
        error: err.response?.data || err.message,
      });
      return {
        verified: false,
        status: 'error',
        amount: expectedAmountRupees,
        error: err.message,
      };
    }
  }

  /**
   * Cryptographically verifies Razorpay Webhook signature against raw request body.
   */
  public static verifyWebhookSignature(rawBody: Buffer | string, signature: string): boolean {
    const creds = this.getCredentials();
    const webhookSecret = creds.webhookSecret;

    if (!webhookSecret) {
      logger.warn('[RazorpayGatewayService] Webhook secret not configured in environment');
      return false;
    }

    if (!rawBody || !signature || (Buffer.isBuffer(rawBody) && rawBody.length === 0)) {
      return false;
    }

    try {
      const bodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8');
      if (bodyBuffer.length === 0) {
        return false;
      }
      const expectedSignatureHex = crypto
        .createHmac('sha256', webhookSecret)
        .update(bodyBuffer)
        .digest('hex');

      const expectedBuf = Buffer.from(expectedSignatureHex, 'utf8');
      const providedBuf = Buffer.from(signature, 'utf8');

      if (expectedBuf.length !== providedBuf.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuf, providedBuf);
    } catch (err) {
      logger.error('[RazorpayGatewayService] Webhook signature verification error', { err });
      return false;
    }
  }

  /**
   * Idempotently ingests and processes an incoming Razorpay Webhook event.
   * Uses payment_webhook_events table with unique constraint on [provider_name, provider_event_id].
   */
  public static async processWebhook(
    rawBody: Buffer | string,
    signature: string,
    eventPayload: any
  ): Promise<WebhookProcessingResult> {
    // 0. Strict Raw Body Verification
    if (!rawBody || (Buffer.isBuffer(rawBody) && rawBody.length === 0)) {
      const err: any = new Error('Raw body is required for cryptographic webhook signature verification');
      err.statusCode = 400;
      err.code = 'RAW_BODY_UNAVAILABLE';
      throw err;
    }

    // 1. Signature Verification
    const isValidSignature = this.verifyWebhookSignature(rawBody, signature);
    if (!isValidSignature) {
      const err: any = new Error('Invalid Razorpay webhook signature');
      err.statusCode = 400;
      err.code = 'WEBHOOK_VERIFICATION_FAILED';
      throw err;
    }

    const eventId = eventPayload?.id || eventPayload?.event_id;
    const eventType = eventPayload?.event || 'unknown';

    if (!eventId) {
      const err: any = new Error('Missing event ID in webhook payload');
      err.statusCode = 400;
      throw err;
    }

    // 2. Check for Duplicate Delivery via payment_webhook_events
    const existingEvent = await PaymentRepository.findWebhookEvent('razorpay', eventId);

    let webhookRecord: any;
    if (existingEvent) {
      if (existingEvent.status === 'failed') {
        logger.info('[RazorpayGatewayService] Retrying previously failed webhook event', {
          eventId,
          eventType,
        });
        webhookRecord = existingEvent;
      } else {
        logger.info('[RazorpayGatewayService] Duplicate webhook event received, skipping', {
          eventId,
          eventType,
          status: existingEvent.status,
        });
        return {
          success: true,
          event_id: eventId,
          event_type: eventType,
          status: 'duplicate',
          message: 'Event has already been ingested and processed',
          transaction_id: existingEvent.payment_transaction_id || undefined,
        };
      }
    } else {
      // 3. Record webhook event as 'received' durably via PaymentRepository
      try {
        webhookRecord = await PaymentRepository.createWebhookEvent({
          providerName: 'razorpay',
          providerEventId: eventId,
          eventType: eventType,
          payload: eventPayload,
          status: 'received',
        });
      } catch (err: any) {
        if (
          err.code === 'P2002' ||
          err.code === '23505' ||
          err.code === 'P2010' ||
          String(err.message).includes('uq_payment_webhook_provider_event') ||
          String(err.message).includes('unique constraint')
        ) {
          // Concurrency race: Another thread inserted the event simultaneously
          return {
            success: true,
            event_id: eventId,
            event_type: eventType,
            status: 'duplicate',
            message: 'Concurrent duplicate event handled safely',
          };
        }
        throw err;
      }
    }

    // 4. Process supported event types via dedicated atomic execution pipeline
    return await this.executeWebhookEventProcessing(webhookRecord, eventPayload);
  }

  /**
   * Internal execution of a webhook event record.
   * Atomic, idempotent, and handles out-of-order captures and reconciliation.
   */
  public static async executeWebhookEventProcessing(
    webhookRecord: any,
    eventPayload: any
  ): Promise<WebhookProcessingResult> {
    const eventId = webhookRecord.provider_event_id;
    const eventType = webhookRecord.event_type;

    try {
      if (eventType === 'payment.captured' || eventType === 'order.paid') {
        const paymentEntity = eventPayload?.payload?.payment?.entity;
        const orderEntity = eventPayload?.payload?.order?.entity;
        const gatewayOrderId = paymentEntity?.order_id || orderEntity?.id;
        const gatewayPaymentId = paymentEntity?.id;

        // Reject authorized-only payment state in webhook (must wait for payment.captured)
        if (paymentEntity?.status === 'authorized') {
          await PaymentRepository.updateWebhookEventStatus(webhookRecord.payment_webhook_event_id, {
            status: 'ignored',
            processingError: 'Payment is authorized but not captured; skipping allocation until capture event',
          });
          return {
            success: true,
            event_id: eventId,
            event_type: eventType,
            status: 'ignored',
            message: 'Payment authorized but not captured; allocation skipped pending capture',
          };
        }

        if (!gatewayOrderId) {
          await PaymentRepository.updateWebhookEventStatus(webhookRecord.payment_webhook_event_id, {
            status: 'ignored',
            processingError: 'No gateway order ID in payment payload',
          });
          return {
            success: true,
            event_id: eventId,
            event_type: eventType,
            status: 'ignored',
            message: 'No associated gateway order found in event entity',
          };
        }

        // Find associated local payment transaction & order
        const localTx = await PaymentRepository.findTransactionWithOrderAndDueByGatewayRef(gatewayOrderId);

        if (!localTx) {
          logger.warn('[RazorpayGatewayService] Webhook payment order not found locally', {
            gatewayOrderId,
          });
          await PaymentRepository.updateWebhookEventStatus(webhookRecord.payment_webhook_event_id, {
            status: 'ignored',
            processingError: `No local payment transaction found matching order ${gatewayOrderId}`,
          });
          return {
            success: true,
            event_id: eventId,
            event_type: eventType,
            status: 'ignored',
            message: `No local transaction found for order ${gatewayOrderId}`,
          };
        }

        // Connect webhook event record to transaction and order
        await PaymentRepository.updateWebhookEventStatus(webhookRecord.payment_webhook_event_id, {
          status: 'received',
          paymentOrderId: localTx.payment_order_id,
          paymentTransactionId: localTx.payment_transaction_id,
        });

        // Idempotency: If already marked success, do not double-allocate
        if (localTx.status === 'success') {
          await PaymentRepository.updateWebhookEventStatus(webhookRecord.payment_webhook_event_id, {
            status: 'processed',
          });
          return {
            success: true,
            event_id: eventId,
            event_type: eventType,
            status: 'processed',
            message: 'Transaction was already verified and allocated',
            transaction_id: localTx.payment_transaction_id,
          };
        }

        // Idempotency: If already recorded as captured-unallocated pending reconciliation
        if (
          localTx.status === 'pending' &&
          localTx.failure_code === 'EXCEEDS_REMAINING_DUE'
        ) {
          await PaymentRepository.updateWebhookEventStatus(webhookRecord.payment_webhook_event_id, {
            status: 'processed',
            processingError: localTx.failure_message,
          });
          return {
            success: false,
            event_id: eventId,
            event_type: eventType,
            status: 'failed',
            message: 'Payment allocation exceeds remaining due balance; flagged for reconciliation',
            transaction_id: localTx.payment_transaction_id,
          };
        }

        // Atomically allocate and update transaction to success
        const order = localTx.payment_orders;
        const amount = Number(order.amount.toString());

        const commitResult = await prisma.$transaction(async (tx: any) => {
          // Concurrency protection: Lock and re-read transaction state inside transaction boundary
          const currentTxRows: any = await tx.$queryRaw`
            SELECT payment_transaction_id, status
            FROM payment_transactions
            WHERE payment_transaction_id = ${localTx.payment_transaction_id}::uuid
            FOR UPDATE;
          `;
          const currentTx = currentTxRows[0];
          if (currentTx && currentTx.status === 'success') {
            await PaymentRepository.updateWebhookEventStatus(
              webhookRecord.payment_webhook_event_id,
              { status: 'processed' },
              tx
            );
            return { alreadyCommitted: true };
          }

          // Concurrency control: Row-level lock on student_charge_dues to serialize concurrent allocations on same fee due
          if (order.student_charge_due_id) {
            const lockedDues: any[] = await tx.$queryRaw`
              SELECT student_charge_due_id, amount_due, status
              FROM student_charge_dues
              WHERE student_charge_due_id = ${order.student_charge_due_id}::uuid
              FOR UPDATE;
            `;
            if (lockedDues.length > 0) {
              const dueRow = lockedDues[0];
              const dueAmount = Number(dueRow.amount_due);

              if (dueRow.status === 'cancelled' || dueRow.status === 'waived') {
                await PaymentRepository.updatePaymentTransaction(
                  localTx.payment_transaction_id,
                  {
                    status: 'pending',
                    gatewayTransactionId: gatewayPaymentId || localTx.gateway_transaction_id,
                    failureCode: 'DUE_INELIGIBLE',
                    failureMessage: `Payment of ₹${amount} was captured at gateway (${gatewayPaymentId}), but fee due is ${dueRow.status}. Reconciliation required.`,
                    gatewayResponse: {
                      ...eventPayload,
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
                await PaymentRepository.updateWebhookEventStatus(
                  webhookRecord.payment_webhook_event_id,
                  {
                    status: 'processed',
                    processingError: `Fee due is ${dueRow.status}; cannot receive allocations; flagged for reconciliation`,
                  },
                  tx
                );
                return { alreadyCommitted: false, rejectedReason: 'DUE_INELIGIBLE', dueStatus: dueRow.status };
              }

              const totalAllocatedBefore = await PaymentRepository.getTotalAllocatedForDue(
                order.student_charge_due_id,
                tx
              );
              const remainingDue = dueAmount - totalAllocatedBefore;

              if (amount > remainingDue + 0.001) {
                logger.warn('[RazorpayGatewayService] Webhook allocation exceeds remaining due balance', {
                  dueId: order.student_charge_due_id,
                  remainingDue,
                  amount,
                });

                // Preserve gateway capture in payment_transactions with status: 'pending' (NOT 'failed'!)
                await PaymentRepository.updatePaymentTransaction(
                  localTx.payment_transaction_id,
                  {
                    status: 'pending',
                    gatewayTransactionId: gatewayPaymentId || localTx.gateway_transaction_id,
                    failureCode: 'EXCEEDS_REMAINING_DUE',
                    failureMessage: `Payment allocation of ₹${amount} was captured at gateway (${gatewayPaymentId}), but exceeds eligible remaining due balance of ₹${remainingDue}. Reconciliation required.`,
                    gatewayResponse: {
                      ...eventPayload,
                      gateway_captured: true,
                      ledger_allocated: false,
                      reconciliation_required: true,
                      reconciliation_reason: 'EXCEEDS_REMAINING_DUE',
                      attempted_amount: amount,
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

                await PaymentRepository.updateWebhookEventStatus(
                  webhookRecord.payment_webhook_event_id,
                  {
                    status: 'processed',
                    processingError: `Payment allocation of ₹${amount} exceeds remaining due balance of ₹${remainingDue}; flagged for reconciliation`,
                  },
                  tx
                );

                return { alreadyCommitted: false, exceedsDue: true, remainingDue };
              }
            }
          }

          // Update transaction to success
          await PaymentRepository.updatePaymentTransaction(
            localTx.payment_transaction_id,
            {
              status: 'success',
              gatewayTransactionId: gatewayPaymentId || localTx.gateway_transaction_id,
              transactionDate: new Date(),
              gatewayResponse: eventPayload,
            },
            tx
          );

          // Update order to paid
          await PaymentRepository.updatePaymentOrderStatus(
            order.payment_order_id,
            'paid',
            null,
            tx
          );

          // Create allocation
          await PaymentRepository.createPaymentAllocation(
            {
              paymentTransactionId: localTx.payment_transaction_id,
              studentChargeDueId: order.student_charge_due_id,
              allocatedAmount: amount,
              notes: `Allocated via Razorpay webhook (${eventId})`,
            },
            tx
          );

          // Update due status based on cumulative verified allocations
          const due = order.student_charge_dues;
          const dueAmount = Number(due.amount_due.toString());
          const totalAllocated = await PaymentRepository.getTotalAllocatedForDue(
            order.student_charge_due_id,
            tx
          );
          const newDueStatus = totalAllocated >= dueAmount ? 'paid' : 'partially_paid';

          await PaymentRepository.updateDueStatus(
            due.student_charge_due_id,
            newDueStatus,
            null,
            tx
          );

          // Update webhook event status to processed ONLY after financial changes succeed
          await PaymentRepository.updateWebhookEventStatus(
            webhookRecord.payment_webhook_event_id,
            {
              status: 'processed',
            },
            tx
          );

          return { alreadyCommitted: false };
        }, {
          maxWait: 20000,
          timeout: 45000,
        });

        if (commitResult?.exceedsDue) {
          return {
            success: false,
            event_id: eventId,
            event_type: eventType,
            status: 'failed',
            message: 'Payment allocation exceeds remaining due balance; flagged for reconciliation',
            transaction_id: localTx.payment_transaction_id,
          };
        }

        if (commitResult?.rejectedReason) {
          return {
            success: false,
            event_id: eventId,
            event_type: eventType,
            status: 'failed',
            message: `Cannot allocate payment to a ${commitResult.dueStatus} fee due`,
            transaction_id: localTx.payment_transaction_id,
          };
        }

        // Authoritative post-commit notification emissions only if newly committed
        if (!commitResult?.alreadyCommitted) {
          const studentId = localTx.payment_orders?.student_id;
          const studentObj = studentId
            ? await prisma.students.findUnique({ where: { student_id: studentId } })
            : null;

          FinanceNotificationService.publishEvent({
            eventType: FinanceEventType.PAYMENT_SUCCESS,
            orgId: localTx.payment_orders?.org_id || studentObj?.org_id || '00000000-0000-0000-0000-000000000001',
            sourceEntityId: localTx.payment_transaction_id,
            sourceWorkflow: 'razorpay_webhook_capture',
            timestamp: new Date().toISOString(),
            correlationId: order.order_reference,
            idempotencyKey: `pay_succ_${localTx.payment_transaction_id}`,
            studentId,
            studentName: studentObj ? `${studentObj.first_name} ${studentObj.last_name || ''}`.trim() : 'Student',
            admissionNo: studentObj?.admission_no || '',
            amount,
            paymentMethod: 'Razorpay Online',
            orderReference: order.order_reference,
            receiptNumber: `RCPT-${order.order_reference}`,
          }).catch((err) => {
            logger.error('[RazorpayGatewayService] Webhook payment success notification error:', err);
          });

          FinanceNotificationService.publishEvent({
            eventType: FinanceEventType.PAYMENT_RECEIPT_AVAILABLE,
            orgId: localTx.payment_orders?.org_id || studentObj?.org_id || '00000000-0000-0000-0000-000000000001',
            sourceEntityId: localTx.payment_transaction_id,
            sourceWorkflow: 'razorpay_webhook_capture',
            timestamp: new Date().toISOString(),
            correlationId: `rcpt_${order.order_reference}`,
            idempotencyKey: `rcpt_${order.order_reference}`,
            studentId,
            studentName: studentObj ? `${studentObj.first_name} ${studentObj.last_name || ''}`.trim() : 'Student',
            admissionNo: studentObj?.admission_no || '',
            amount,
            receiptNumber: `RCPT-${order.order_reference}`,
            receiptUrl: `/app/finance/receipts/view/RCPT-${order.order_reference}`,
          }).catch((err) => {
            logger.error('[RazorpayGatewayService] Webhook receipt notification error:', err);
          });
        }

        return {
          success: true,
          event_id: eventId,
          event_type: eventType,
          status: 'processed',
          message: 'Payment allocated successfully from webhook',
          transaction_id: localTx.payment_transaction_id,
        };
      } else if (eventType === 'payment.failed') {
        const paymentEntity = eventPayload?.payload?.payment?.entity;
        const gatewayOrderId = paymentEntity?.order_id;

        if (gatewayOrderId) {
          const localTx: any = await PaymentRepository.findTransactionWithOrderAndDueByGatewayRef(gatewayOrderId);

          if (localTx) {
            // CRITICAL: An out-of-order failed event MUST NOT regress an already successful transaction!
            if (localTx.status === 'success') {
              logger.warn(
                '[RazorpayGatewayService] Late payment.failed event received for already successful transaction; ignoring downgrade',
                { gatewayOrderId }
              );
              await PaymentRepository.updateWebhookEventStatus(webhookRecord.payment_webhook_event_id, {
                status: 'ignored',
                processingError: 'Late failure event received after successful allocation; ignored to prevent financial regression',
              });
              return {
                success: true,
                event_id: eventId,
                event_type: eventType,
                status: 'ignored',
                message: 'Ignored late failure callback for already confirmed transaction',
              };
            }

            // Mark transaction as failed
            await PaymentRepository.updatePaymentTransaction(localTx.payment_transaction_id, {
              status: 'failed',
              failureCode: paymentEntity?.error_code || 'GATEWAY_PAYMENT_FAILED',
              failureMessage: paymentEntity?.error_description || 'Payment failed at gateway',
              gatewayResponse: eventPayload,
            });

            // Authoritative failure event emission
            FinanceNotificationService.publishEvent({
              eventType: FinanceEventType.PAYMENT_FAILED,
              orgId: localTx.payment_orders?.org_id || '00000000-0000-0000-0000-000000000001',
              sourceEntityId: localTx.payment_transaction_id,
              sourceWorkflow: 'razorpay_webhook_failure',
              timestamp: new Date().toISOString(),
              correlationId: localTx.payment_orders?.order_reference || gatewayOrderId,
              idempotencyKey: `pay_fail_${localTx.payment_transaction_id}`,
              studentId: localTx.payment_orders?.student_id || undefined,
              amount: Number(localTx.amount || 0),
              notes: paymentEntity?.error_description || 'Payment failed at gateway',
            }).catch((err) => {
              logger.error('[RazorpayGatewayService] Webhook payment failed notification error:', err);
            });
          }
        }

        await PaymentRepository.updateWebhookEventStatus(webhookRecord.payment_webhook_event_id, {
          status: 'processed',
        });

        return {
          success: true,
          event_id: eventId,
          event_type: eventType,
          status: 'processed',
          message: 'Payment failure recorded from webhook',
        };
      } else {
        // Unknown / unhandled event type
        await PaymentRepository.updateWebhookEventStatus(webhookRecord.payment_webhook_event_id, {
          status: 'ignored',
        });

        return {
          success: true,
          event_id: eventId,
          event_type: eventType,
          status: 'ignored',
          message: `Event type '${eventType}' ignored safely`,
        };
      }
    } catch (err: any) {
      logger.error('[RazorpayGatewayService] Error processing webhook event', {
        eventId,
        err: err.message,
      });

      if (webhookRecord?.payment_webhook_event_id) {
        await PaymentRepository.updateWebhookEventStatus(webhookRecord.payment_webhook_event_id, {
          status: 'failed',
          processingError: err.message,
        });
      }

      throw err;
    }
  }

  /**
   * Reprocesses an incomplete or failed webhook event safely by its primary key ID.
   */
  public static async reprocessWebhookEvent(webhookEventId: string): Promise<WebhookProcessingResult> {
    const webhookRecord = await PaymentRepository.findWebhookEventById(webhookEventId);
    if (!webhookRecord) {
      const err: any = new Error(`Webhook event with ID '${webhookEventId}' not found`);
      err.statusCode = 404;
      throw err;
    }

    if (webhookRecord.status === 'processed') {
      return {
        success: true,
        event_id: webhookRecord.provider_event_id,
        event_type: webhookRecord.event_type,
        status: 'duplicate',
        message: 'Event has already been ingested and processed',
        transaction_id: webhookRecord.payment_transaction_id || undefined,
      };
    }

    return await this.executeWebhookEventProcessing(webhookRecord, webhookRecord.payload);
  }

  /**
   * Recovers stuck webhook events left in 'received' or 'failed' state.
   */
  public static async recoverStuckWebhookEvents(options?: {
    olderThanMs?: number;
    limit?: number;
    includeFailed?: boolean;
  }): Promise<{
    recoveredCount: number;
    failedCount: number;
    results: any[];
  }> {
    const olderThanMs = options?.olderThanMs ?? 0;
    const limit = options?.limit ?? 50;
    const includeFailed = options?.includeFailed ?? true;

    const stuckEvents = await PaymentRepository.findWebhookEventsByStatus(
      'razorpay',
      'received',
      limit,
      olderThanMs
    );

    let failedEvents: any[] = [];
    if (includeFailed && stuckEvents.length < limit) {
      failedEvents = await PaymentRepository.findWebhookEventsByStatus(
        'razorpay',
        'failed',
        limit - stuckEvents.length,
        olderThanMs
      );
    }

    const allEvents = [...stuckEvents, ...failedEvents];
    let recoveredCount = 0;
    let failedCount = 0;
    const results: any[] = [];

    for (const event of allEvents) {
      try {
        const res = await this.reprocessWebhookEvent(event.payment_webhook_event_id);
        if (res.status === 'processed' || res.status === 'duplicate' || res.status === 'ignored') {
          recoveredCount++;
        } else {
          failedCount++;
        }
        results.push({ ...res });
      } catch (err: any) {
        failedCount++;
        results.push({
          event_id: event.provider_event_id,
          success: false,
          status: 'failed',
          error: err.message,
        });
      }
    }

    return { recoveredCount, failedCount, results };
  }
}
export default RazorpayGatewayService;
