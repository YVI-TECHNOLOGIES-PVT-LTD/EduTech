import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from '../../../lib/prismaClient';
import { toSafeUuid } from './FeeStructureManagerService';
import { StudentLedgerService } from './StudentLedgerService';
import { RazorpayGatewayService } from './RazorpayGatewayService';
import { PaymentRepository } from '../repositories/PaymentRepository';
import { FinanceNotificationService } from './FinanceNotificationService';
import { FinanceEventType } from '../events/finance.events';
import { logger } from '../../../utils/logger';

export interface EligibleObligation {
  due_id: string;
  charge_id: string;
  description: string;
  fee_component_name: string;
  fee_component_code: string | null;
  installment_term_name: string;
  due_date: string;
  amount_due: number;
  previously_allocated_amount: number;
  remaining_payable_amount: number;
  status: string;
  is_overdue: boolean;
}

export interface RecordOfflinePaymentInput {
  studentId: string;
  studentChargeDueId: string;
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'other';
  paymentDate?: string;
  transactionReference?: string;
  notes?: string;
}

export interface CreateOnlineOrderInput {
  studentId: string;
  studentChargeDueId: string;
  amount: number;
  paymentMethod: 'upi' | 'card' | 'net_banking' | 'wallet';
  notes?: string;
}

export interface VerifyOnlinePaymentInput {
  paymentOrderId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

export interface PaymentHistoryFilter {
  studentId?: string;
  status?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface ReceiptDocument {
  receipt_no: string;
  receipt_date: string;
  student_id: string;
  student_name: string;
  admission_no: string;
  grade_name: string;
  academic_year_name: string;
  payment_transaction_id: string;
  payment_order_id: string;
  order_reference: string;
  amount: number;
  currency: string;
  payment_method: string;
  transaction_reference: string | null;
  obligation_description: string;
  installment_term: string;
  collected_by: string;
  status: string;
}

export class PaymentCollectionService {
  /**
   * Decimal-safe rounding
   */
  public static roundMoney(val: number | string | Prisma.Decimal | null | undefined): number {
    return StudentLedgerService.roundMoney(val);
  }

  /**
   * Retrieve all eligible unpaid obligations (dues) for a student within tenant.
   */
  public static async getEligibleObligations(
    orgId: string,
    studentId: string
  ): Promise<{
    student: any;
    obligations: EligibleObligation[];
    total_remaining_payable: number;
  }> {
    if (!orgId) throw new Error('Tenant organization ID is required');
    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeStudentId = toSafeUuid(studentId);
    if (!safeStudentId) {
      const err: any = new Error('Invalid student identifier');
      err.statusCode = 400;
      throw err;
    }

    // Verify student belongs to tenant
    const student = await prisma.students.findFirst({
      where: { student_id: safeStudentId, org_id: safeOrgId },
      include: {
        student_enrollments: {
          where: { status: 'active' },
          orderBy: { created_at: 'desc' },
          take: 1,
          include: {
            academic_year_grades: {
              include: { academic_years: true, grades: true },
            },
          },
        },
      },
    });

    if (!student) {
      const err: any = new Error('Student not found in authorized organization');
      err.statusCode = 404;
      throw err;
    }

    // Fetch active charges & dues directly from PostgreSQL via PaymentRepository
    const todayStr = new Date().toISOString().split('T')[0];
    const rawObligations = await PaymentRepository.getEligibleDuesForStudent(safeStudentId);
    const obligations: EligibleObligation[] = [];
    let totalRemaining = 0;

    for (const ob of rawObligations) {
      if (ob.remaining_payable_amount > 0) {
        const isOverdue = ob.due_date < todayStr && ob.status !== 'paid';
        totalRemaining = this.roundMoney(totalRemaining + ob.remaining_payable_amount);
        obligations.push({
          due_id: ob.student_charge_due_id,
          charge_id: ob.student_charge_id,
          description: ob.description,
          fee_component_name: ob.component_name || 'General Tuition',
          fee_component_code: ob.component_code || null,
          installment_term_name: ob.installment_term || 'Scheduled Due',
          due_date: ob.due_date,
          amount_due: ob.amount_due,
          previously_allocated_amount: ob.previously_allocated_amount,
          remaining_payable_amount: ob.remaining_payable_amount,
          status: ob.status,
          is_overdue: isOverdue,
        });
      }
    }

    const activeEnrollment = student.student_enrollments[0] || null;

    return {
      student: {
        student_id: student.student_id,
        admission_no: student.admission_no,
        full_name: `${student.first_name} ${student.last_name || ''}`.trim(),
        grade_name: activeEnrollment?.academic_year_grades.grades.grade_name || 'N/A',
        academic_year_name:
          activeEnrollment?.academic_year_grades.academic_years.academic_year_name || 'N/A',
        status: student.status,
      },
      obligations,
      total_remaining_payable: totalRemaining,
    };
  }

  /**
   * Record a verified offline payment (Cash, Bank Transfer, Cheque/Other) and allocate immediately.
   * Atomic local database transaction ensures consistency.
   */
  public static async recordOfflinePayment(
    orgId: string,
    userId: string | null,
    payload: RecordOfflinePaymentInput
  ) {
    if (!orgId) throw new Error('Tenant organization ID is required');
    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeStudentId = toSafeUuid(payload.studentId);
    const safeDueId = toSafeUuid(payload.studentChargeDueId);
    const safeUserId = toSafeUuid(userId);

    if (!safeStudentId) {
      const err: any = new Error('Valid student identifier is required');
      err.statusCode = 400;
      throw err;
    }
    if (!safeDueId) {
      const err: any = new Error('Valid obligation due identifier is required');
      err.statusCode = 400;
      throw err;
    }

    const amount = Number(payload.amount);
    if (isNaN(amount) || amount <= 0) {
      const err: any = new Error('Payment collection amount must be a positive number');
      err.statusCode = 400;
      throw err;
    }
    if (this.roundMoney(amount) !== amount) {
      const err: any = new Error('Payment amount has excessive precision (max 2 decimal places)');
      err.statusCode = 400;
      throw err;
    }

    const validMethods = ['cash', 'bank_transfer', 'other'];
    if (!validMethods.includes(payload.paymentMethod)) {
      const err: any = new Error(
        `Invalid offline payment method '${payload.paymentMethod}'. Supported: ${validMethods.join(', ')}`
      );
      err.statusCode = 400;
      throw err;
    }

    // Run within a Prisma transaction for concurrency safety & atomicity
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Verify Student belongs to tenant
      const student = await tx.students.findFirst({
        where: { student_id: safeStudentId, org_id: safeOrgId },
        include: {
          student_enrollments: {
            where: { status: 'active' },
            take: 1,
            include: {
              academic_year_grades: {
                include: { academic_years: true, grades: true },
              },
            },
          },
        },
      });

      if (!student) {
        const err: any = new Error('Student not found in authorized organization');
        err.statusCode = 404;
        throw err;
      }

      // 2. Verify Due exists and belongs to this student via PaymentRepository
      const due = await PaymentRepository.findDueWithAllocations(safeDueId, safeStudentId, tx);

      if (!due) {
        const err: any = new Error('Obligation due not found or does not belong to the selected student');
        err.statusCode = 404;
        throw err;
      }

      if (due.status === 'cancelled' || due.status === 'waived') {
        const err: any = new Error(`Cannot collect payment on obligation with status '${due.status}'`);
        err.statusCode = 400;
        throw err;
      }

      // 3. Recalculate remaining balance under transaction lock to prevent overpayment
      const dueAmount = Number(due.amount_due);
      const allocatedSoFar = Number(due.allocated_amount);
      const remainingPayable = Math.max(0, this.roundMoney(dueAmount - allocatedSoFar));

      if (remainingPayable <= 0) {
        const err: any = new Error('This obligation has already been fully paid and settled');
        err.statusCode = 400;
        throw err;
      }

      if (amount > remainingPayable) {
        const err: any = new Error(
          `Payment amount (${amount.toFixed(2)}) exceeds eligible remaining balance (${remainingPayable.toFixed(2)})`
        );
        err.statusCode = 400;
        throw err;
      }

      // 4. Generate unique order reference
      const orderRef = `ORD-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      // 5. Create Payment Order durably via PaymentRepository
      const paymentOrder = await PaymentRepository.createPaymentOrder(
        {
          studentId: safeStudentId,
          studentChargeDueId: safeDueId,
          amount,
          status: 'paid',
          orderReference: orderRef,
          description: `Offline ${payload.paymentMethod} payment for ${due.student_charges.description}`,
          createdBy: safeUserId,
        },
        tx
      );

      // 6. Create Payment Transaction durably via PaymentRepository
      const paymentDate = payload.paymentDate ? new Date(payload.paymentDate) : new Date();
      const gatewayTxId = payload.transactionReference?.trim() || `REF-${Date.now()}`;

      const paymentTx = await PaymentRepository.createPaymentTransaction(
        {
          paymentOrderId: paymentOrder.payment_order_id,
          paymentMethod: payload.paymentMethod,
          status: 'success',
          amount,
          transactionDate: paymentDate,
          gatewayName: 'Offline Manual',
          gatewayTransactionId: gatewayTxId,
          createdBy: safeUserId,
        },
        tx
      );

      // 7. Create Payment Allocation durably via PaymentRepository
      const allocation = await PaymentRepository.createPaymentAllocation(
        {
          paymentTransactionId: paymentTx.payment_transaction_id,
          studentChargeDueId: safeDueId,
          allocatedAmount: amount,
          notes: payload.notes || `Collected via ${payload.paymentMethod} (Ref: ${gatewayTxId})`,
          createdBy: safeUserId,
        },
        tx
      );

      // 8. Update Due Status durably via PaymentRepository
      const newTotalAllocated = this.roundMoney(allocatedSoFar + amount);
      const isFullySettled = newTotalAllocated >= dueAmount;
      const newDueStatus = isFullySettled ? 'paid' : 'partially_paid';

      await PaymentRepository.updateDueStatus(safeDueId, newDueStatus, safeUserId, tx);

      // 9. Construct Receipt Data
      const receiptNo = `RCPT-${new Date().getFullYear()}-${orderRef.split('-')[1] || Date.now().toString().slice(-6)}`;
      const activeEnrollment = student.student_enrollments[0] || null;

      const receipt: ReceiptDocument = {
        receipt_no: receiptNo,
        receipt_date: paymentDate.toISOString(),
        student_id: student.student_id,
        student_name: `${student.first_name} ${student.last_name || ''}`.trim(),
        admission_no: student.admission_no,
        grade_name: activeEnrollment?.academic_year_grades.grades.grade_name || 'N/A',
        academic_year_name:
          activeEnrollment?.academic_year_grades.academic_years.academic_year_name || 'N/A',
        payment_transaction_id: paymentTx.payment_transaction_id,
        payment_order_id: paymentOrder.payment_order_id,
        order_reference: orderRef,
        amount: amount,
        currency: 'INR',
        payment_method: payload.paymentMethod,
        transaction_reference: gatewayTxId,
        obligation_description: due.student_charges.description,
        installment_term: due.installment_plan_terms?.term_name || 'Scheduled Term',
        collected_by: userId ? 'Authorized Staff' : 'Cashier Desk',
        status: 'GENERATED',
      };

      return {
        success: true,
        message: 'Payment recorded and allocated successfully',
        transaction: {
          transaction_id: paymentTx.payment_transaction_id,
          order_id: paymentOrder.payment_order_id,
          order_reference: orderRef,
          amount: amount,
          payment_method: payload.paymentMethod,
          status: 'success',
          transaction_date: paymentDate.toISOString(),
          allocated_amount: amount,
        },
        allocation: {
          allocation_id: allocation.payment_allocation_id,
          due_id: due.student_charge_due_id,
          allocated_amount: amount,
          obligation_status: newDueStatus,
          is_settled: isFullySettled,
          remaining_due: Math.max(0, this.roundMoney(dueAmount - newTotalAllocated)),
        },
        receipt,
      };
    });

    // Authoritative post-commit notification event emissions
    FinanceNotificationService.publishEvent({
      eventType: FinanceEventType.PAYMENT_SUCCESS,
      orgId: safeOrgId,
      sourceEntityId: result.transaction.transaction_id,
      sourceWorkflow: 'offline_payment_collection',
      timestamp: new Date().toISOString(),
      correlationId: result.transaction.order_reference,
      idempotencyKey: `pay_succ_${result.transaction.transaction_id}`,
      studentId: safeStudentId || undefined,
      studentName: result.receipt.student_name,
      admissionNo: result.receipt.admission_no,
      gradeName: result.receipt.grade_name,
      amount: result.transaction.amount,
      paymentMethod: payload.paymentMethod,
      orderReference: result.transaction.order_reference,
      receiptNumber: result.receipt.receipt_no,
      performedBy: safeUserId || undefined,
    }).catch((err) => {
      logger.error('[PaymentCollectionService] Post-commit payment success notification error:', err);
    });

    FinanceNotificationService.publishEvent({
      eventType: FinanceEventType.PAYMENT_RECEIPT_AVAILABLE,
      orgId: safeOrgId,
      sourceEntityId: result.transaction.transaction_id,
      sourceWorkflow: 'offline_payment_collection',
      timestamp: new Date().toISOString(),
      correlationId: `rcpt_${result.receipt.receipt_no}`,
      idempotencyKey: `rcpt_${result.receipt.receipt_no}`,
      studentId: safeStudentId || undefined,
      studentName: result.receipt.student_name,
      admissionNo: result.receipt.admission_no,
      amount: result.transaction.amount,
      receiptNumber: result.receipt.receipt_no,
      receiptUrl: `/app/finance/receipts/view/${result.receipt.receipt_no}`,
      performedBy: safeUserId || undefined,
    }).catch((err) => {
      logger.error('[PaymentCollectionService] Post-commit receipt notification error:', err);
    });

    return result;
  }

  /**
   * Create an online payment order intent (for Razorpay integration: UPI, Card, Net Banking, Wallet).
   */
  public static async createOnlinePaymentOrder(
    orgId: string,
    userId: string | null,
    payload: CreateOnlineOrderInput
  ) {
    if (!orgId) throw new Error('Tenant organization ID is required');
    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeStudentId = toSafeUuid(payload.studentId);
    const safeDueId = toSafeUuid(payload.studentChargeDueId);
    const safeUserId = toSafeUuid(userId);

    if (!safeStudentId || !safeDueId) {
      const err: any = new Error('Valid student ID and obligation due ID are required');
      err.statusCode = 400;
      throw err;
    }

    const amount = Number(payload.amount);
    if (isNaN(amount) || amount <= 0) {
      const err: any = new Error('Payment collection amount must be a positive number');
      err.statusCode = 400;
      throw err;
    }

    const validOnlineMethods = ['upi', 'card', 'net_banking', 'wallet'];
    if (!validOnlineMethods.includes(payload.paymentMethod)) {
      const err: any = new Error(`Invalid online payment method '${payload.paymentMethod}'`);
      err.statusCode = 400;
      throw err;
    }

    // 1. Verify Student and Obligation
    const student = await prisma.students.findFirst({
      where: { student_id: safeStudentId, org_id: safeOrgId },
    });
    if (!student) {
      const err: any = new Error('Student not found in authorized organization');
      err.statusCode = 404;
      throw err;
    }

    const due = await PaymentRepository.findDueWithAllocations(safeDueId, safeStudentId);

    if (!due) {
      const err: any = new Error('Obligation due not found');
      err.statusCode = 404;
      throw err;
    }

    const dueAmount = Number(due.amount_due);
    const allocated = Number(due.allocated_amount);
    const remainingPayable = Math.max(0, this.roundMoney(dueAmount - allocated));
    if (amount > remainingPayable) {
      const err: any = new Error(`Amount exceeds remaining payable balance of ${remainingPayable.toFixed(2)}`);
      err.statusCode = 400;
      throw err;
    }

    const orderRef = `ORD-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Create payment order record with status 'created' durably via PaymentRepository
    const paymentOrder = await PaymentRepository.createPaymentOrder({
      studentId: safeStudentId,
      studentChargeDueId: safeDueId,
      amount,
      status: 'created',
      orderReference: orderRef,
      description: `Online payment attempt for obligation ${due.student_charge_due_id}`,
      createdBy: safeUserId,
    });

    // 2. Delegate Order Creation to RazorpayGatewayService
    const rzpResult = await RazorpayGatewayService.createOrder({
      amount,
      orderReference: orderRef,
      studentId: safeStudentId,
      dueId: safeDueId,
      notes: {
        student_name: `${student.first_name} ${student.last_name || ''}`.trim(),
        admission_no: student.admission_no,
      },
    });

    // 3. Create payment transaction with status 'initiated' durably via PaymentRepository
    const paymentTx = await PaymentRepository.createPaymentTransaction({
      paymentOrderId: paymentOrder.payment_order_id,
      paymentMethod: payload.paymentMethod,
      status: 'initiated',
      gatewayName: 'Razorpay',
      gatewayOrderId: rzpResult.gateway_order_id,
      amount,
      transactionDate: new Date(),
      createdBy: safeUserId,
    });

    const result = {
      success: true,
      order: {
        payment_order_id: paymentOrder.payment_order_id,
        order_reference: orderRef,
        gateway_order_id: rzpResult.gateway_order_id,
        amount: amount,
        currency: rzpResult.currency,
        key_id: rzpResult.key_id,
        is_simulation: rzpResult.is_simulation,
        payment_method: payload.paymentMethod,
        status: 'created',
      },
      transaction: {
        payment_transaction_id: paymentTx.payment_transaction_id,
        status: 'initiated',
      },
    };

    // Authoritative post-order event emission
    FinanceNotificationService.publishEvent({
      eventType: FinanceEventType.PAYMENT_INITIATED,
      orgId: safeOrgId,
      sourceEntityId: paymentOrder.payment_order_id,
      sourceWorkflow: 'online_payment_order_create',
      timestamp: new Date().toISOString(),
      correlationId: orderRef,
      idempotencyKey: `pay_init_${paymentOrder.payment_order_id}`,
      studentId: safeStudentId || undefined,
      studentName: student ? `${student.first_name} ${student.last_name || ''}`.trim() : 'Student',
      admissionNo: student ? student.admission_no : '',
      amount,
      paymentMethod: payload.paymentMethod,
      orderReference: orderRef,
      performedBy: safeUserId || undefined,
    }).catch((err) => {
      logger.error('[PaymentCollectionService] Post-order payment initiated notification error:', err);
    });

    return result;
  }

  /**
   * Verify online payment signature and allocate payment upon cryptographic success.
   * Never trusts client status without signature verification.
   */
  public static async verifyOnlinePayment(
    orgId: string,
    userId: string | null,
    payload: VerifyOnlinePaymentInput
  ) {
    if (!orgId) throw new Error('Tenant organization ID is required');
    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeOrderId = toSafeUuid(payload.paymentOrderId);
    const safeUserId = toSafeUuid(userId);

    if (!safeOrderId) {
      const err: any = new Error('Valid payment order ID is required');
      err.statusCode = 400;
      throw err;
    }

    // 1. Fetch order and student
    // 1. Fetch order and student via PaymentRepository
    const order = await PaymentRepository.findPaymentOrderForVerification(safeOrderId, safeOrgId);

    if (!order) {
      const err: any = new Error('Payment order not found in authorized organization');
      err.statusCode = 404;
      throw err;
    }

    const txRecord = order.payment_transactions[0];
    if (!txRecord) {
      const err: any = new Error('No transaction record found for this order');
      err.statusCode = 404;
      throw err;
    }

    // Idempotency: If already verified and successful, return existing confirmation
    if (txRecord.status === 'success') {
      const existingReceipt = await PaymentRepository.getReceiptDetails(orgId, txRecord.payment_transaction_id);
      return {
        success: true,
        message: 'Payment has already been verified and allocated',
        status: 'success',
        transaction_id: txRecord.payment_transaction_id,
        receipt: existingReceipt,
      };
    }

    // Idempotency: If already captured but unallocated (pending reconciliation)
    if (
      txRecord.status === 'pending' &&
      (txRecord.failure_code === 'EXCEEDS_REMAINING_DUE' || (txRecord.gateway_response as any)?.reconciliation_required)
    ) {
      return {
        success: false,
        status: 'captured_unallocated',
        gateway_captured: true,
        ledger_updated: false,
        error: txRecord.failure_code || 'EXCEEDS_REMAINING_DUE',
        message: txRecord.failure_message || 'Payment was captured at gateway, but cannot be allocated. Reconciliation required.',
        transaction_id: txRecord.payment_transaction_id,
        order_reference: order.order_reference,
        amount: Number(order.amount.toString()),
        gateway_payment_id: txRecord.gateway_transaction_id || payload.razorpayPaymentId,
        remaining_due: (txRecord.gateway_response as any)?.remaining_due ?? 0,
      };
    }

    const amount = Number(order.amount.toString());

    // 2. Cryptographic Checkout Signature Verification
    const isValidSignature = RazorpayGatewayService.verifyCheckoutSignature({
      razorpayOrderId: payload.razorpayOrderId,
      razorpayPaymentId: payload.razorpayPaymentId,
      razorpaySignature: payload.razorpaySignature,
    });

    if (!isValidSignature) {
      // Mark transaction as failed; outstanding balance remains untouched!
      await PaymentRepository.updatePaymentTransaction(txRecord.payment_transaction_id, {
        status: 'failed',
        failureCode: 'SIGNATURE_VERIFICATION_FAILED',
        failureMessage: 'Cryptographic signature mismatch. Unauthorized or tampered callback.',
        updatedBy: safeUserId,
      });

      const err: any = new Error('Invalid gateway signature. Payment verification rejected.');
      err.statusCode = 400;

      // Authoritative failure event emission
      FinanceNotificationService.publishEvent({
        eventType: FinanceEventType.PAYMENT_FAILED,
        orgId: safeOrgId,
        sourceEntityId: txRecord.payment_transaction_id,
        sourceWorkflow: 'online_payment_verify',
        timestamp: new Date().toISOString(),
        correlationId: order.order_reference,
        idempotencyKey: `pay_fail_sig_${txRecord.payment_transaction_id}`,
        studentId: order.student_id,
        amount,
        notes: 'Invalid gateway cryptographic signature',
        performedBy: safeUserId || undefined,
      }).catch((notifErr) => {
        logger.error('[PaymentCollectionService] Payment failure notification error:', notifErr);
      });

      throw err;
    }

    // 3. Server-to-Server Gateway Payment State Verification
    const creds = RazorpayGatewayService.getCredentials();
    if (creds.isConfigured) {
      const gatewayCheck = await RazorpayGatewayService.fetchAndVerifyPayment(
        payload.razorpayPaymentId,
        txRecord.gateway_order_id || payload.razorpayOrderId,
        amount
      );

      if (!gatewayCheck.verified) {
        await PaymentRepository.updatePaymentTransaction(txRecord.payment_transaction_id, {
          status: 'failed',
          failureCode: 'GATEWAY_PAYMENT_NOT_CAPTURED',
          failureMessage: gatewayCheck.error || 'Payment not captured at gateway',
          gatewayResponse: gatewayCheck.raw || null,
          updatedBy: safeUserId,
        });

        const err: any = new Error(`Gateway payment verification failed: ${gatewayCheck.error}`);
        err.statusCode = 400;
        throw err;
      }
    }

    // 4. Signature & Gateway Status are valid! Transactionally record success and allocation
    const result = await prisma.$transaction(async (tx: any) => {
      // Concurrency control: Row-level lock on transaction record
      const lockedTx: any[] = await tx.$queryRaw`
        SELECT payment_transaction_id, status FROM payment_transactions
        WHERE payment_transaction_id = ${txRecord.payment_transaction_id}::uuid
        FOR UPDATE
      `;

      if (lockedTx.length > 0 && lockedTx[0].status === 'success') {
        const existingReceipt = await PaymentRepository.getReceiptDetails(orgId, txRecord.payment_transaction_id, tx);
        return {
          alreadyCommitted: true,
          success: true,
          message: 'Payment has already been verified and allocated',
          status: 'success',
          transaction_id: txRecord.payment_transaction_id,
          order_reference: order.order_reference,
          amount: amount,
          gateway_payment_id: payload.razorpayPaymentId,
          receipt: existingReceipt,
        };
      }

      // Concurrency control: Row-level lock on student_charge_dues to serialize concurrent allocations on same fee due
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
          const totalAllocatedBefore = await PaymentRepository.getTotalAllocatedForDue(order.student_charge_due_id, tx);
          const remainingDue = dueAmount - totalAllocatedBefore;

          if (dueRow.status === 'cancelled' || dueRow.status === 'waived') {
            await PaymentRepository.updatePaymentTransaction(txRecord.payment_transaction_id, {
              status: 'pending',
              gatewayTransactionId: payload.razorpayPaymentId,
              transactionDate: new Date(),
              failureCode: 'DUE_INELIGIBLE',
              failureMessage: `Payment of ₹${amount} was captured at gateway (${payload.razorpayPaymentId}), but fee due is ${dueRow.status}. Reconciliation required.`,
              gatewayResponse: {
                gateway_status: 'captured',
                gateway_payment_id: payload.razorpayPaymentId,
                gateway_captured: true,
                ledger_allocated: false,
                reconciliation_required: true,
                reconciliation_reason: 'DUE_INELIGIBLE',
                due_status: dueRow.status,
              },
              updatedBy: safeUserId,
            }, tx);
            await PaymentRepository.updatePaymentOrderStatus(order.payment_order_id, 'pending', safeUserId, tx);
            return {
              alreadyCommitted: false,
              rejectedReason: 'DUE_INELIGIBLE',
              dueStatus: dueRow.status,
              transactionId: txRecord.payment_transaction_id,
            };
          }

          if (amount > remainingDue + 0.001) {
            await PaymentRepository.updatePaymentTransaction(txRecord.payment_transaction_id, {
              status: 'pending',
              gatewayTransactionId: payload.razorpayPaymentId,
              transactionDate: new Date(),
              failureCode: 'EXCEEDS_REMAINING_DUE',
              failureMessage: `Payment allocation of ₹${amount} was captured at gateway (${payload.razorpayPaymentId}), but exceeds eligible remaining due balance of ₹${remainingDue}. Reconciliation required.`,
              gatewayResponse: {
                gateway_status: 'captured',
                gateway_payment_id: payload.razorpayPaymentId,
                gateway_captured: true,
                ledger_allocated: false,
                reconciliation_required: true,
                reconciliation_reason: 'EXCEEDS_REMAINING_DUE',
                attempted_amount: amount,
                remaining_due: remainingDue,
              },
              updatedBy: safeUserId,
            }, tx);

            await PaymentRepository.updatePaymentOrderStatus(order.payment_order_id, 'pending', safeUserId, tx);

            return {
              alreadyCommitted: false,
              exceedsDue: true,
              remainingDue,
              requestedAmount: amount,
              transactionId: txRecord.payment_transaction_id,
            };
          }
        }
      }

      // Update transaction to success
      const updatedTx = await PaymentRepository.updatePaymentTransaction(
        txRecord.payment_transaction_id,
        {
          status: 'success',
          gatewayTransactionId: payload.razorpayPaymentId,
          transactionDate: new Date(),
          updatedBy: safeUserId,
        },
        tx
      );

      // Update order to paid
      await PaymentRepository.updatePaymentOrderStatus(
        order.payment_order_id,
        'paid',
        safeUserId,
        tx
      );

      // Create allocation
      await PaymentRepository.createPaymentAllocation(
        {
          paymentTransactionId: updatedTx.payment_transaction_id,
          studentChargeDueId: order.student_charge_due_id,
          allocatedAmount: amount,
          notes: `Verified online payment (Ref: ${payload.razorpayPaymentId})`,
          createdBy: safeUserId,
        },
        tx
      );

      // Update due status using cumulative allocation calculation
      const due = order.student_charge_dues;
      const dueAmount = Number(due.amount_due.toString());
      const totalAllocated = await PaymentRepository.getTotalAllocatedForDue(order.student_charge_due_id, tx);
      const newDueStatus = totalAllocated >= dueAmount ? 'paid' : 'partially_paid';

      await PaymentRepository.updateDueStatus(
        due.student_charge_due_id,
        newDueStatus,
        safeUserId,
        tx
      );

      // Build verified receipt document
      const receipt = await PaymentRepository.getReceiptDetails(orgId, updatedTx.payment_transaction_id, tx);

      return {
        alreadyCommitted: false,
        success: true,
        message: 'Online payment verified and allocated successfully',
        status: 'success',
        transaction_id: updatedTx.payment_transaction_id,
        order_reference: order.order_reference,
        amount: amount,
        gateway_payment_id: payload.razorpayPaymentId,
        receipt,
      };
    }, {
      maxWait: 20000,
      timeout: 45000,
    });

    if (result.exceedsDue) {
      return {
        success: false,
        status: 'captured_unallocated',
        gateway_captured: true,
        ledger_updated: false,
        error: 'EXCEEDS_REMAINING_DUE',
        message: `Payment amount (₹${result.requestedAmount}) was captured by gateway (${payload.razorpayPaymentId}), but exceeds eligible outstanding fee balance (₹${result.remainingDue}). Payment recorded as pending reconciliation.`,
        transaction_id: result.transactionId,
        order_reference: order.order_reference,
        amount,
        gateway_payment_id: payload.razorpayPaymentId,
        remaining_due: result.remainingDue,
      };
    }

    if (result.rejectedReason) {
      return {
        success: false,
        status: 'captured_unallocated',
        gateway_captured: true,
        ledger_updated: false,
        error: result.rejectedReason,
        message: `Payment was captured by gateway (${payload.razorpayPaymentId}), but cannot be allocated to a ${result.dueStatus} fee due. Payment recorded as pending reconciliation.`,
        transaction_id: result.transactionId,
        order_reference: order.order_reference,
        amount,
        gateway_payment_id: payload.razorpayPaymentId,
      };
    }

    // Authoritative post-commit payment success and receipt notifications only if newly committed
    if (!result.alreadyCommitted) {
      FinanceNotificationService.publishEvent({
        eventType: FinanceEventType.PAYMENT_SUCCESS,
        orgId: safeOrgId,
        sourceEntityId: result.transaction_id,
        sourceWorkflow: 'online_payment_verify',
        timestamp: new Date().toISOString(),
        correlationId: result.order_reference,
        idempotencyKey: `pay_succ_${result.transaction_id}`,
        studentId: order.student_id || undefined,
        studentName: result.receipt?.student_name || 'Student',
        admissionNo: result.receipt?.admission_no || '',
        gradeName: result.receipt?.grade_name || '',
        amount: result.amount,
        paymentMethod: order.payment_method || 'Online Gateway',
        orderReference: result.order_reference,
        receiptNumber: result.receipt?.receipt_no || '',
        performedBy: safeUserId || undefined,
      }).catch((err) => {
        logger.error('[PaymentCollectionService] Post-commit online payment success notification error:', err);
      });

      if (result.receipt) {
        FinanceNotificationService.publishEvent({
          eventType: FinanceEventType.PAYMENT_RECEIPT_AVAILABLE,
          orgId: safeOrgId,
          sourceEntityId: result.transaction_id,
          sourceWorkflow: 'online_payment_verify',
          timestamp: new Date().toISOString(),
          correlationId: `rcpt_${result.receipt.receipt_no}`,
          idempotencyKey: `rcpt_${result.receipt.receipt_no}`,
          studentId: order.student_id || undefined,
          studentName: result.receipt.student_name,
          admissionNo: result.receipt.admission_no,
          amount: result.amount,
          receiptNumber: result.receipt.receipt_no,
          receiptUrl: `/app/finance/receipts/view/${result.receipt.receipt_no}`,
          performedBy: safeUserId || undefined,
        }).catch((err) => {
          logger.error('[PaymentCollectionService] Post-commit online receipt notification error:', err);
        });
      }
    }

    return result;
  }

  /**
   * Process Razorpay Webhook Event with durable idempotency.
   */
  public static async processWebhookEvent(rawBody: Buffer | string, signature: string, payload: any) {
    return await RazorpayGatewayService.processWebhook(rawBody, signature, payload);
  }

  /**
   * Retrieve tenant-scoped payment transaction history with filters and pagination.
   */
  public static async getPaymentHistory(orgId: string, filter: PaymentHistoryFilter = {}) {
    if (!orgId) throw new Error('Tenant organization ID is required');
    const safeOrgId = toSafeUuid(orgId) || orgId;
    return await PaymentRepository.getPaymentHistory(safeOrgId, filter);
  }

  /**
   * Retrieve official receipt details for a transaction.
   */
  public static async getReceiptDetails(orgId: string, transactionId: string): Promise<ReceiptDocument> {
    if (!orgId) throw new Error('Tenant organization ID is required');
    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeTxId = toSafeUuid(transactionId);

    if (!safeTxId) {
      const err: any = new Error('Valid transaction ID is required');
      err.statusCode = 400;
      throw err;
    }

    const receipt = await PaymentRepository.getReceiptDetails(safeOrgId, safeTxId);
    if (!receipt) {
      const err: any = new Error('Transaction not found in authorized organization');
      err.statusCode = 404;
      throw err;
    }
    return receipt;
  }
}
