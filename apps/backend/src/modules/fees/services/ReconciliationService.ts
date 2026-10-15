/**
 * EduTrack ERP — Phase 10 Finance Reconciliation Service
 * ========================================================
 * High-integrity financial reconciliation domain service.
 * Performs deterministic comparisons between gateway records, internal transactions,
 * fee due obligations, allocations, and settlement entries.
 *
 * Primary Invariants:
 * - Never marks gateway-captured payment as failed solely because allocation fails.
 * - Does not double-subtract concessions (applied concessions are already in amount_due).
 * - Sanitizes all CSV exports against spreadsheet formula injection (=, +, -, @).
 * - Distinguishes gateway capture, local transaction, allocation, and settlement.
 */

import {
  ReconciliationRepository,
  ReconciliationFilterOptions,
  ReconciliationSummaryKPIs,
} from '../repositories/ReconciliationRepository';
import { logger } from '../../../utils/logger';

export class ReconciliationService {
  /**
   * Decimal-safe financial rounding to 2 decimal places.
   */
  public static roundMoney(amount: number): number {
    return Math.round((Number(amount) || 0) * 100) / 100;
  }

  /**
   * Sanitizes a string for CSV export to protect against Spreadsheet Formula Injection (CSV Injection).
   * Prepends a single quote if the field begins with =, +, -, @, \t, or \r.
   */
  public static sanitizeCsvField(value: any): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Check for dangerous leading characters that trigger spreadsheet execution
    if (/^[=+\-@\t\r]/.test(str)) {
      return `"'${str.replace(/"/g, '""')}"`;
    }
    // Standard CSV escaping if string contains comma, quote, or newline
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  /**
   * Deterministic transaction matching & classification rules.
   */
  public static classifyTransaction(params: {
    gatewayStatus?: string | null;
    internalStatus?: string | null;
    gatewayAmount?: number | null;
    internalAmount?: number | null;
    gatewayCurrency?: string | null;
    internalCurrency?: string | null;
    allocatedAmount?: number | null;
    paymentOrderId?: string | null;
    gatewayPaymentId?: string | null;
    gatewayOrderId?: string | null;
    internalOrderGatewayId?: string | null;
    isDuplicateReference?: boolean;
    gatewayVerificationFailed?: boolean;
    reconciliationRequired?: boolean;
    metadata?: any;
  }): string {
    if (params.isDuplicateReference) {
      return 'DUPLICATE_GATEWAY_REFERENCE';
    }
    if (params.gatewayVerificationFailed || (params.gatewayStatus === 'unknown' && !params.gatewayPaymentId)) {
      return 'GATEWAY_VERIFICATION_REQUIRED';
    }
    if (
      params.gatewayOrderId &&
      params.internalOrderGatewayId &&
      params.gatewayOrderId !== params.internalOrderGatewayId
    ) {
      return 'ORDER_PAYMENT_MISMATCH';
    }
    if (
      params.gatewayCurrency &&
      params.internalCurrency &&
      params.gatewayCurrency !== params.internalCurrency
    ) {
      return 'CURRENCY_MISMATCH';
    }
    if (
      params.gatewayAmount !== undefined &&
      params.internalAmount !== undefined &&
      params.gatewayAmount !== null &&
      params.internalAmount !== null &&
      Math.abs(params.gatewayAmount - params.internalAmount) > 0.009
    ) {
      return 'AMOUNT_MISMATCH';
    }
    if (params.gatewayStatus === 'authorized') {
      return 'AUTHORIZED_ONLY';
    }
    if (
      params.gatewayStatus === 'captured' &&
      (params.internalStatus === null || params.internalStatus === undefined)
    ) {
      return 'UNMATCHED_GATEWAY';
    }
    if (
      params.gatewayStatus === 'captured' &&
      (params.internalStatus === 'pending' || params.reconciliationRequired) &&
      (params.allocatedAmount === 0 || params.allocatedAmount === undefined)
    ) {
      return 'CAPTURED_UNALLOCATED';
    }
    if (
      (!params.gatewayPaymentId || !params.gatewayStatus) &&
      (params.internalStatus === 'completed' || params.internalStatus === 'success')
    ) {
      return 'INTERNAL_SUCCESS_UNVERIFIED';
    }
    if (
      params.gatewayStatus === 'captured' &&
      (params.internalStatus === 'completed' || params.internalStatus === 'success')
    ) {
      return 'MATCHED';
    }
    return 'PENDING_VERIFICATION';
  }

  /**
   * Safe remaining due calculation.
   * NOTE: student_charge_dues.amount_due is ALREADY net of approved concessions in Phase 7.
   * Do NOT subtract concessions a second time.
   */
  public static calculateRemainingDue(scdAmountDue: number, paidAllocations: number): number {
    return Math.max(0, this.roundMoney((Number(scdAmountDue) || 0) - (Number(paidAllocations) || 0)));
  }

  /**
   * Check if allocated amount exceeds the charge due.
   */
  public static checkOverAllocation(amountDue: number, totalAllocated: number): boolean {
    return this.roundMoney(totalAllocated) > this.roundMoney(amountDue);
  }

  /**
   * Classify allocation level against due obligation.
   */
  public static classifyAllocationStatus(amountDue: number, totalAllocated: number): string {
    const due = this.roundMoney(amountDue);
    const allocated = this.roundMoney(totalAllocated);
    if (allocated > due) return 'OVER_ALLOCATED';
    if (allocated === due) return 'FULLY_ALLOCATED';
    if (allocated > 0) return 'PARTIALLY_ALLOCATED';
    return 'UNALLOCATED';
  }

  /**
   * Sum valid (completed) allocations, excluding reversed, pending, or failed ones.
   */
  public static sumValidAllocations(allocations: Array<{ amount: number; status?: string }>): number {
    if (!Array.isArray(allocations)) return 0;
    const validSum = allocations
      .filter((a) => !a.status || a.status === 'completed')
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    return this.roundMoney(validSum);
  }

  /**
   * Check if a webhook delivery is duplicate.
   */
  public static isDuplicateWebhook(webhookId: string, existingIds: string[]): boolean {
    if (!webhookId || !Array.isArray(existingIds)) return false;
    return existingIds.includes(webhookId);
  }

  /**
   * Validate webhook event payload structure.
   */
  public static validateWebhookPayload(event: { id?: string; event?: string; payload?: any }): boolean {
    if (!event || !event.id || !event.event) return false;
    if (!event.payload || typeof event.payload !== 'object') return false;
    return Boolean(event.payload.payment || event.payload.order || Object.keys(event.payload).length > 0);
  }

  /**
   * Safe event state transition resolution.
   * Never regresses an authoritative 'captured' state to 'failed'.
   */
  public static resolveEventState(currentAuthoritativeStatus: string, incomingEvent: string): string {
    if (currentAuthoritativeStatus === 'captured' && incomingEvent === 'payment.failed') {
      return 'captured';
    }
    if (incomingEvent === 'payment.captured') return 'captured';
    if (incomingEvent === 'payment.failed') return 'failed';
    return currentAuthoritativeStatus;
  }

  /**
   * Convenience aliases matching naming conventions
   */
  public static async getSummary(tenantOrgId: string, options?: any) {
    return this.getSummaryKPIs(tenantOrgId, options);
  }

  public static async previewRun(tenantOrgId: string, options?: any) {
    const preview = await this.previewReconciliationRun(tenantOrgId, options);
    return {
      ...preview,
      scannedTransactions: preview.examined_records_count,
      unmatchedExceptions: preview.summary.total_exceptions_count,
    };
  }

  private static validateTenant(tenantOrgId: string) {
    if (!tenantOrgId || typeof tenantOrgId !== 'string' || tenantOrgId.trim() === '') {
      const err: any = new Error('Tenant organization ID is required');
      err.statusCode = 400;
      err.code = 'TENANT_NOT_FOUND';
      throw err;
    }
  }

  /**
   * Get reconciliation dashboard overview summary KPIs for tenant.
   */
  public static async getSummaryKPIs(
    tenantOrgId: string,
    options?: { startDate?: string; endDate?: string }
  ): Promise<ReconciliationSummaryKPIs> {
    this.validateTenant(tenantOrgId);
    return await ReconciliationRepository.getSummaryKPIs(tenantOrgId, options);
  }

  /**
   * Get paginated transaction reconciliation register.
   */
  public static async getTransactions(
    tenantOrgId: string,
    options?: ReconciliationFilterOptions
  ) {
    this.validateTenant(tenantOrgId);
    return await ReconciliationRepository.getTransactions(tenantOrgId, options);
  }

  /**
   * Get deep transaction detail for investigation drawer.
   */
  public static async getTransactionDetail(
    tenantOrgId: string,
    paymentTransactionId: string
  ) {
    this.validateTenant(tenantOrgId);
    if (!paymentTransactionId) {
      const err: any = new Error('Payment transaction ID is required');
      err.statusCode = 400;
      throw err;
    }

    const detail = await ReconciliationRepository.getTransactionDetail(tenantOrgId, paymentTransactionId);
    if (!detail) {
      const err: any = new Error(`Payment transaction '${paymentTransactionId}' not found for authenticated tenant`);
      err.statusCode = 404;
      throw err;
    }

    return detail;
  }

  /**
   * Get prioritized reconciliation exception queue.
   */
  public static async getExceptions(
    tenantOrgId: string,
    options?: { limit?: number; offset?: number }
  ) {
    this.validateTenant(tenantOrgId);
    return await ReconciliationRepository.getExceptions(tenantOrgId, options);
  }

  /**
   * Preview a reconciliation run without altering financial state (Read-only simulation).
   */
  public static async previewReconciliationRun(
    tenantOrgId: string,
    options?: { startDate?: string; endDate?: string; paymentMethod?: string }
  ) {
    this.validateTenant(tenantOrgId);

    const { transactions, totalCount } = await ReconciliationRepository.getTransactions(tenantOrgId, {
      startDate: options?.startDate,
      endDate: options?.endDate,
      paymentMethod: options?.paymentMethod,
      limit: 100,
      offset: 0,
    });

    const matched = transactions.filter((t) => t.reconciliation_classification === 'matched_allocated');
    const capturedUnallocated = transactions.filter((t) => t.reconciliation_classification === 'captured_unallocated');
    const partiallyAllocated = transactions.filter((t) => t.reconciliation_classification === 'partially_allocated');
    const pendingVerification = transactions.filter((t) => t.reconciliation_classification === 'pending_verification');
    const duplicates = transactions.filter((t) => t.reconciliation_classification === 'duplicate_reference');
    const exceptions = transactions.filter(
      (t) => t.reconciliation_classification !== 'matched_allocated'
    );

    return {
      preview_timestamp: new Date().toISOString(),
      tenant_org_id: tenantOrgId,
      filters_applied: {
        start_date: options?.startDate || 'all',
        end_date: options?.endDate || 'all',
        payment_method: options?.paymentMethod || 'all',
      },
      examined_records_count: totalCount,
      summary: {
        matched_count: matched.length,
        matched_amount: this.roundMoney(matched.reduce((s, t) => s + t.transaction_amount, 0)),
        captured_unallocated_count: capturedUnallocated.length,
        captured_unallocated_amount: this.roundMoney(capturedUnallocated.reduce((s, t) => s + t.transaction_amount, 0)),
        partially_allocated_count: partiallyAllocated.length,
        pending_verification_count: pendingVerification.length,
        duplicate_reference_count: duplicates.length,
        total_exceptions_count: exceptions.length,
        total_exceptions_amount: this.roundMoney(exceptions.reduce((s, t) => s + t.transaction_amount, 0)),
      },
      matching_criteria: [
        'Authoritative gateway transaction ID uniqueness',
        'Mathematical equality of payment amount and cumulative ledger allocations',
        'Verification of fee due obligation active status (rejects cancelled/waived dues)',
        'Tenant organization ownership validation on student entity',
      ],
      sample_exceptions: exceptions.slice(0, 10).map((e) => ({
        transaction_id: e.payment_transaction_id,
        order_reference: e.order_reference,
        amount: e.transaction_amount,
        classification: e.reconciliation_classification,
        failure_code: e.failure_code,
        failure_message: e.failure_message,
      })),
    };
  }

  /**
   * Execute and persist a reconciliation run in payment_reconciliation_runs.
   */
  public static async executeReconciliationRun(
    tenantOrgId: string,
    options: {
      periodStart?: string;
      periodEnd?: string;
      notes?: string;
    },
    userId?: string
  ) {
    this.validateTenant(tenantOrgId);

    const runRef = `REC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    // 1. Create durable run record
    const run = await ReconciliationRepository.createReconciliationRun({
      orgId: tenantOrgId,
      runReference: runRef,
      periodStart: options.periodStart ? new Date(options.periodStart) : null,
      periodEnd: options.periodEnd ? new Date(options.periodEnd) : null,
      notes: options.notes || 'Automated finance reconciliation execution',
      createdBy: userId,
    });

    // 2. Perform reconciliation scan
    const { transactions, totalCount } = await ReconciliationRepository.getTransactions(tenantOrgId, {
      startDate: options.periodStart,
      endDate: options.periodEnd,
      limit: 100,
    });

    const exceptions = transactions.filter((t) => t.reconciliation_classification !== 'matched_allocated');
    const finalStatus = exceptions.length > 0 ? 'completed_with_exceptions' : 'completed';

    // 3. Finalize run
    await ReconciliationRepository.finalizeReconciliationRun(
      run.payment_reconciliation_run_id,
      finalStatus,
      `Examined ${totalCount} transactions: ${transactions.length - exceptions.length} matched, ${exceptions.length} exceptions.`
    );

    return {
      reconciliation_run_id: run.payment_reconciliation_run_id,
      run_reference: runRef,
      status: finalStatus,
      examined_count: totalCount,
      matched_count: transactions.length - exceptions.length,
      exceptions_count: exceptions.length,
      started_at: run.started_at,
      completed_at: new Date().toISOString(),
      notes: options.notes,
    };
  }

  /**
   * List historical reconciliation runs.
   */
  public static async getReconciliationRuns(tenantOrgId: string, limit: number = 20) {
    this.validateTenant(tenantOrgId);
    return await ReconciliationRepository.getReconciliationRuns(tenantOrgId, limit);
  }

  /**
   * Export reconciliation transaction records to sanitized CSV string.
   */
  public static async exportTransactionsCSV(
    tenantOrgId: string,
    options?: ReconciliationFilterOptions
  ): Promise<string> {
    this.validateTenant(tenantOrgId);

    const { transactions } = await ReconciliationRepository.getTransactions(tenantOrgId, {
      ...options,
      limit: 1000,
      offset: 0,
    });

    const headers = [
      'Transaction ID',
      'Order Reference',
      'Student Name',
      'Admission No',
      'Gateway Order ID',
      'Gateway Payment ID',
      'Payment Method',
      'Currency',
      'Amount',
      'Status',
      'Gateway Captured',
      'Total Allocated',
      'Remaining Due',
      'Reconciliation Classification',
      'Settlement Status',
      'Transaction Date',
    ];

    const rows = transactions.map((t) => [
      this.sanitizeCsvField(t.payment_transaction_id),
      this.sanitizeCsvField(t.order_reference),
      this.sanitizeCsvField(t.student_name),
      this.sanitizeCsvField(t.admission_no),
      this.sanitizeCsvField(t.gateway_order_id || 'N/A'),
      this.sanitizeCsvField(t.gateway_transaction_id || 'N/A'),
      this.sanitizeCsvField(t.payment_method),
      this.sanitizeCsvField(t.currency_code),
      this.sanitizeCsvField(t.transaction_amount.toFixed(2)),
      this.sanitizeCsvField(t.transaction_status),
      this.sanitizeCsvField(t.gateway_captured ? 'Yes' : 'No'),
      this.sanitizeCsvField(t.total_allocated.toFixed(2)),
      this.sanitizeCsvField((t.remaining_due ?? 0).toFixed(2)),
      this.sanitizeCsvField(t.reconciliation_classification),
      this.sanitizeCsvField(t.settlement_status || 'Unsettled'),
      this.sanitizeCsvField(t.created_at ? new Date(t.created_at).toISOString() : ''),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\r\n');

    return csvContent;
  }
}
export default ReconciliationService;
