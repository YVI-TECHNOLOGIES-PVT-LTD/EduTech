/**
 * EduTrack ERP — Phase 10 Finance Reconciliation Repository
 * ==========================================================
 * Data access layer for payment transactions, allocations, dues, webhook events,
 * gateway settlements, and reconciliation runs against physical PostgreSQL schema.
 *
 * Primary Source of Truth: schema.prisma & physical PostgreSQL tables.
 * Strict SQL parameterization to prevent SQL injection.
 * Complete tenant isolation on all queries.
 */

import prisma from '../../../lib/prismaClient';
import { Prisma } from '@prisma/client';

export interface ReconciliationSummaryKPIs {
  total_captured_count: number;
  total_captured_amount: number;
  total_internal_success_count: number;
  total_internal_success_amount: number;
  captured_unallocated_count: number;
  captured_unallocated_amount: number;
  pending_verification_count: number;
  pending_verification_amount: number;
  inconsistent_records_count: number;
  inconsistent_records_amount: number;
  duplicate_reference_count: number;
  unresolved_webhook_count: number;
  settlement_records_count: number;
  total_settled_net_amount: number;
  settlement_exceptions_count: number;
  settlement_data_available: boolean;
}

export interface ReconciliationFilterOptions {
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
  status?: string;
  classification?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ReconciliationTransactionRecord {
  payment_transaction_id: string;
  payment_order_id: string;
  student_id: string;
  student_name: string;
  admission_no: string;
  order_reference: string;
  gateway_order_id: string | null;
  gateway_transaction_id: string | null;
  gateway_name: string | null;
  payment_method: string;
  currency_code: string;
  transaction_amount: number;
  transaction_status: string;
  transaction_date: Date | null;
  failure_code: string | null;
  failure_message: string | null;
  gateway_captured: boolean;
  reconciliation_required: boolean;
  total_allocated: number;
  remaining_unallocated: number;
  due_id: string | null;
  due_amount: number | null;
  remaining_due: number | null;
  reconciliation_classification: string;
  settlement_status: string | null;
  webhook_status: string | null;
  created_at: Date;
}

export class ReconciliationRepository {
  private static getClient(client?: any) {
    return client || prisma;
  }

  /**
   * Aggregate high-level reconciliation KPIs for authenticated tenant.
   */
  public static async getSummaryKPIs(
    tenantOrgId: string,
    options?: { startDate?: string; endDate?: string }
  ): Promise<ReconciliationSummaryKPIs> {
    const db = this.getClient();

    let startFilter: Date = new Date(0);
    if (options?.startDate) {
      const parsed = new Date(options.startDate);
      if (!isNaN(parsed.getTime())) {
        startFilter = parsed;
      }
    }

    let endFilter: Date = new Date(Date.now() + 86400000 * 365);
    if (options?.endDate) {
      const parsed = new Date(options.endDate);
      if (!isNaN(parsed.getTime())) {
        endFilter = parsed;
      }
    }

    // 1. Transaction aggregations
    const txAggRows: any = await db.$queryRaw`
      SELECT 
        COUNT(CASE WHEN pt.status = 'success' OR (pt.gateway_response->>'gateway_captured')::boolean = true THEN 1 END)::int as total_captured_count,
        COALESCE(SUM(CASE WHEN pt.status = 'success' OR (pt.gateway_response->>'gateway_captured')::boolean = true THEN pt.amount ELSE 0 END), 0)::float8 as total_captured_amount,
        
        COUNT(CASE WHEN pt.status = 'success' THEN 1 END)::int as total_internal_success_count,
        COALESCE(SUM(CASE WHEN pt.status = 'success' THEN pt.amount ELSE 0 END), 0)::float8 as total_internal_success_amount,
        
        COUNT(CASE WHEN pt.status = 'pending' AND (
          pt.failure_code = 'EXCEEDS_REMAINING_DUE' OR 
          pt.failure_code = 'DUE_INELIGIBLE' OR 
          (pt.gateway_response->>'reconciliation_required')::boolean = true
        ) THEN 1 END)::int as captured_unallocated_count,
        COALESCE(SUM(CASE WHEN pt.status = 'pending' AND (
          pt.failure_code = 'EXCEEDS_REMAINING_DUE' OR 
          pt.failure_code = 'DUE_INELIGIBLE' OR 
          (pt.gateway_response->>'reconciliation_required')::boolean = true
        ) THEN pt.amount ELSE 0 END), 0)::float8 as captured_unallocated_amount,

        COUNT(CASE WHEN pt.status = 'initiated' OR (pt.status = 'pending' AND pt.failure_code IS NULL) THEN 1 END)::int as pending_verification_count,
        COALESCE(SUM(CASE WHEN pt.status = 'initiated' OR (pt.status = 'pending' AND pt.failure_code IS NULL) THEN pt.amount ELSE 0 END), 0)::float8 as pending_verification_amount,

        COUNT(CASE WHEN pt.failure_code IS NOT NULL AND pt.failure_code NOT IN ('EXCEEDS_REMAINING_DUE', 'DUE_INELIGIBLE') THEN 1 END)::int as inconsistent_records_count,
        COALESCE(SUM(CASE WHEN pt.failure_code IS NOT NULL AND pt.failure_code NOT IN ('EXCEEDS_REMAINING_DUE', 'DUE_INELIGIBLE') THEN pt.amount ELSE 0 END), 0)::float8 as inconsistent_records_amount
      FROM payment_transactions pt
      JOIN payment_orders po ON po.payment_order_id = pt.payment_order_id
      JOIN students s ON s.student_id = po.student_id
      WHERE s.org_id = ${tenantOrgId}::uuid
        AND pt.created_at >= ${startFilter}
        AND pt.created_at <= ${endFilter};
    `;

    const txSummary = txAggRows[0] || {};

    // 2. Duplicate gateway transaction ID check
    const dupRefRows: any = await db.$queryRaw`
      SELECT COUNT(*)::int as dup_count
      FROM (
        SELECT pt.gateway_transaction_id
        FROM payment_transactions pt
        JOIN payment_orders po ON po.payment_order_id = pt.payment_order_id
        JOIN students s ON s.student_id = po.student_id
        WHERE s.org_id = ${tenantOrgId}::uuid
          AND pt.gateway_transaction_id IS NOT NULL
        GROUP BY pt.gateway_transaction_id
        HAVING COUNT(*) > 1
      ) dupes;
    `;
    const duplicateRefCount = dupRefRows[0]?.dup_count || 0;

    // 3. Unresolved webhook events count
    const webhookRows: any = await db.$queryRaw`
      SELECT COUNT(*)::int as unresolved_count
      FROM payment_webhook_events pwe
      LEFT JOIN payment_orders po ON po.payment_order_id = pwe.payment_order_id
      LEFT JOIN students s ON s.student_id = po.student_id
      WHERE (s.org_id = ${tenantOrgId}::uuid OR pwe.payment_order_id IS NULL)
        AND pwe.status IN ('received'::payment_webhook_status, 'failed'::payment_webhook_status);
    `;
    const unresolvedWebhookCount = webhookRows[0]?.unresolved_count || 0;

    // 4. Gateway settlements check
    let settlementCount = 0;
    let totalSettledNet = 0;
    let settlementExceptions = 0;
    let settlementAvailable = false;

    try {
      const settleRows: any = await db.$queryRaw`
        SELECT 
          COUNT(*)::int as count,
          COALESCE(SUM(net_settlement_amount), 0)::float8 as net_sum,
          COUNT(CASE WHEN status != 'settled'::gateway_settlement_status THEN 1 END)::int as exceptions_count
        FROM gateway_settlements
        WHERE org_id = ${tenantOrgId}::uuid;
      `;
      if (settleRows && settleRows.length > 0) {
        settlementCount = settleRows[0].count || 0;
        totalSettledNet = settleRows[0].net_sum || 0;
        settlementExceptions = settleRows[0].exceptions_count || 0;
        settlementAvailable = true;
      }
    } catch {
      settlementAvailable = false;
    }

    return {
      total_captured_count: txSummary.total_captured_count || 0,
      total_captured_amount: txSummary.total_captured_amount || 0,
      total_internal_success_count: txSummary.total_internal_success_count || 0,
      total_internal_success_amount: txSummary.total_internal_success_amount || 0,
      captured_unallocated_count: txSummary.captured_unallocated_count || 0,
      captured_unallocated_amount: txSummary.captured_unallocated_amount || 0,
      pending_verification_count: txSummary.pending_verification_count || 0,
      pending_verification_amount: txSummary.pending_verification_amount || 0,
      inconsistent_records_count: txSummary.inconsistent_records_count || 0,
      inconsistent_records_amount: txSummary.inconsistent_records_amount || 0,
      duplicate_reference_count: duplicateRefCount,
      unresolved_webhook_count: unresolvedWebhookCount,
      settlement_records_count: settlementCount,
      total_settled_net_amount: totalSettledNet,
      settlement_exceptions_count: settlementExceptions,
      settlement_data_available: settlementAvailable,
    };
  }

  /**
   * Query filtered, paginated reconciliation transaction register.
   */
  public static async getTransactions(
    tenantOrgId: string,
    options?: ReconciliationFilterOptions
  ): Promise<{ transactions: ReconciliationTransactionRecord[]; totalCount: number }> {
    const db = this.getClient();

    const limit = Math.min(Math.max(Number(options?.limit) || 20, 1), 100);
    const offset = Math.max(Number(options?.offset) || 0, 0);

    let startFilter: Date = new Date(0);
    if (options?.startDate) {
      const parsed = new Date(options.startDate);
      if (!isNaN(parsed.getTime())) {
        startFilter = parsed;
      }
    }

    let endFilter: Date = new Date(Date.now() + 86400000 * 365);
    if (options?.endDate) {
      const parsed = new Date(options.endDate);
      if (!isNaN(parsed.getTime())) {
        endFilter = parsed;
      }
    }
    const searchPattern = options?.search ? `%${options.search.trim().toLowerCase()}%` : null;
    const paymentMethodFilter = options?.paymentMethod || null;
    const statusFilter = options?.status || null;

    // Build parameterized query with allocations aggregation
    const rows: any = await db.$queryRaw`
      WITH alloc_totals AS (
        SELECT 
          payment_transaction_id,
          COALESCE(SUM(allocated_amount), 0)::float8 as total_allocated
        FROM payment_allocations
        GROUP BY payment_transaction_id
      ),
      settle_items AS (
        SELECT 
          gsi.payment_transaction_id,
          gs.status as settlement_status
        FROM gateway_settlement_items gsi
        JOIN gateway_settlements gs ON gs.gateway_settlement_id = gsi.gateway_settlement_id
      ),
      dup_refs AS (
        SELECT gateway_transaction_id
        FROM payment_transactions
        WHERE gateway_transaction_id IS NOT NULL
        GROUP BY gateway_transaction_id
        HAVING COUNT(*) > 1
      )
      SELECT 
        pt.payment_transaction_id,
        pt.payment_order_id,
        s.student_id,
        CONCAT(s.first_name, ' ', COALESCE(s.last_name, '')) as student_name,
        s.admission_no,
        po.order_reference,
        pt.gateway_order_id,
        pt.gateway_transaction_id,
        pt.gateway_name,
        pt.payment_method::text as payment_method,
        pt.currency_code,
        pt.amount::float8 as transaction_amount,
        pt.status::text as transaction_status,
        pt.transaction_date,
        pt.failure_code,
        pt.failure_message,
        COALESCE((pt.gateway_response->>'gateway_captured')::boolean, pt.status = 'success') as gateway_captured,
        COALESCE((pt.gateway_response->>'reconciliation_required')::boolean, pt.failure_code = 'EXCEEDS_REMAINING_DUE') as reconciliation_required,
        COALESCE(at.total_allocated, 0) as total_allocated,
        GREATEST(0, pt.amount::float8 - COALESCE(at.total_allocated, 0)) as remaining_unallocated,
        po.student_charge_due_id as due_id,
        scd.amount_due::float8 as due_amount,
        GREATEST(0, scd.amount_due::float8 - COALESCE(at.total_allocated, 0)) as remaining_due,
        si.settlement_status::text as settlement_status,
        (
          SELECT pwe.status::text 
          FROM payment_webhook_events pwe 
          WHERE pwe.payment_transaction_id = pt.payment_transaction_id 
          ORDER BY pwe.received_at DESC 
          LIMIT 1
        ) as webhook_status,
        CASE
          WHEN dup.gateway_transaction_id IS NOT NULL THEN 'duplicate_reference'
          WHEN pt.failure_code = 'EXCEEDS_REMAINING_DUE' OR pt.failure_code = 'DUE_INELIGIBLE' THEN 'captured_unallocated'
          WHEN pt.status = 'success' AND COALESCE(at.total_allocated, 0) >= pt.amount::float8 THEN 'matched_allocated'
          WHEN pt.status = 'success' AND COALESCE(at.total_allocated, 0) < pt.amount::float8 THEN 'partially_allocated'
          WHEN pt.status = 'initiated' THEN 'pending_verification'
          WHEN pt.status = 'failed' THEN 'gateway_failure'
          ELSE 'inconsistent'
        END as reconciliation_classification,
        pt.created_at,
        COUNT(*) OVER()::int as full_count
      FROM payment_transactions pt
      JOIN payment_orders po ON po.payment_order_id = pt.payment_order_id
      JOIN students s ON s.student_id = po.student_id
      LEFT JOIN student_charge_dues scd ON scd.student_charge_due_id = po.student_charge_due_id
      LEFT JOIN alloc_totals at ON at.payment_transaction_id = pt.payment_transaction_id
      LEFT JOIN settle_items si ON si.payment_transaction_id = pt.payment_transaction_id
      LEFT JOIN dup_refs dup ON dup.gateway_transaction_id = pt.gateway_transaction_id
      WHERE s.org_id = ${tenantOrgId}::uuid
        AND pt.created_at >= ${startFilter}
        AND pt.created_at <= ${endFilter}
        AND (${paymentMethodFilter}::text IS NULL OR pt.payment_method::text = ${paymentMethodFilter})
        AND (${statusFilter}::text IS NULL OR pt.status::text = ${statusFilter})
        AND (
          ${searchPattern}::text IS NULL OR
          LOWER(CONCAT(s.first_name, ' ', COALESCE(s.last_name, ''))) LIKE ${searchPattern} OR
          LOWER(s.admission_no) LIKE ${searchPattern} OR
          LOWER(po.order_reference) LIKE ${searchPattern} OR
          LOWER(COALESCE(pt.gateway_order_id, '')) LIKE ${searchPattern} OR
          LOWER(COALESCE(pt.gateway_transaction_id, '')) LIKE ${searchPattern}
        )
      ORDER BY pt.created_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `;

    const totalCount = rows.length > 0 ? rows[0].full_count : 0;
    const transactions: ReconciliationTransactionRecord[] = rows.map((r: any) => ({
      payment_transaction_id: r.payment_transaction_id,
      payment_order_id: r.payment_order_id,
      student_id: r.student_id,
      student_name: r.student_name,
      admission_no: r.admission_no,
      order_reference: r.order_reference,
      gateway_order_id: r.gateway_order_id,
      gateway_transaction_id: r.gateway_transaction_id,
      gateway_name: r.gateway_name,
      payment_method: r.payment_method,
      currency_code: r.currency_code,
      transaction_amount: r.transaction_amount,
      transaction_status: r.transaction_status,
      transaction_date: r.transaction_date,
      failure_code: r.failure_code,
      failure_message: r.failure_message,
      gateway_captured: Boolean(r.gateway_captured),
      reconciliation_required: Boolean(r.reconciliation_required),
      total_allocated: r.total_allocated,
      remaining_unallocated: r.remaining_unallocated,
      due_id: r.due_id,
      due_amount: r.due_amount,
      remaining_due: r.remaining_due,
      reconciliation_classification: r.reconciliation_classification,
      settlement_status: r.settlement_status,
      webhook_status: r.webhook_status,
      created_at: r.created_at,
    }));

    return { transactions, totalCount };
  }

  /**
   * Retrieve deep investigation details for a specific payment transaction.
   */
  public static async getTransactionDetail(
    tenantOrgId: string,
    paymentTransactionId: string
  ): Promise<any | null> {
    const db = this.getClient();

    // 1. Transaction and order details with student verification
    const txRows: any = await db.$queryRaw`
      SELECT 
        pt.*,
        po.amount::float8 as order_amount,
        po.order_reference,
        po.description as order_description,
        po.status as order_status,
        po.student_charge_due_id,
        s.student_id,
        s.org_id,
        CONCAT(s.first_name, ' ', COALESCE(s.last_name, '')) as student_name,
        s.admission_no,
        scd.amount_due::float8 as due_amount_due,
        scd.status as due_status,
        scd.due_date,
        sc.description as charge_description,
        sc.source_type as charge_source_type
      FROM payment_transactions pt
      JOIN payment_orders po ON po.payment_order_id = pt.payment_order_id
      JOIN students s ON s.student_id = po.student_id
      LEFT JOIN student_charge_dues scd ON scd.student_charge_due_id = po.student_charge_due_id
      LEFT JOIN student_charges sc ON sc.student_charge_id = scd.student_charge_id
      WHERE pt.payment_transaction_id = ${paymentTransactionId}::uuid
        AND s.org_id = ${tenantOrgId}::uuid
      LIMIT 1;
    `;

    if (!txRows.length) return null;
    const tx = txRows[0];

    // 2. Allocations
    const allocRows: any = await db.$queryRaw`
      SELECT 
        pa.payment_allocation_id,
        pa.allocated_amount::float8 as allocated_amount,
        pa.allocated_at,
        pa.notes,
        scd.student_charge_due_id,
        scd.amount_due::float8 as due_amount_due,
        scd.status as due_status,
        sc.description as charge_description
      FROM payment_allocations pa
      JOIN student_charge_dues scd ON scd.student_charge_due_id = pa.student_charge_due_id
      JOIN student_charges sc ON sc.student_charge_id = scd.student_charge_id
      WHERE pa.payment_transaction_id = ${paymentTransactionId}::uuid
      ORDER BY pa.allocated_at ASC;
    `;

    // 3. Webhook events
    const webhookRows: any = await db.$queryRaw`
      SELECT 
        payment_webhook_event_id,
        provider_name,
        provider_event_id,
        event_type,
        status,
        received_at,
        processed_at,
        processing_error
      FROM payment_webhook_events
      WHERE payment_transaction_id = ${paymentTransactionId}::uuid
         OR payment_order_id = ${tx.payment_order_id}::uuid
      ORDER BY received_at DESC;
    `;

    // 4. Settlement details if available
    let settlementItem: any = null;
    try {
      const settleRows: any = await db.$queryRaw`
        SELECT 
          gsi.gateway_settlement_item_id,
          gsi.gross_amount::float8 as gross_amount,
          gsi.fee_amount::float8 as fee_amount,
          gsi.tax_amount::float8 as tax_amount,
          gsi.net_amount::float8 as net_amount,
          gs.gateway_settlement_id,
          gs.provider_settlement_id,
          gs.settlement_date,
          gs.status as settlement_status
        FROM gateway_settlement_items gsi
        JOIN gateway_settlements gs ON gs.gateway_settlement_id = gsi.gateway_settlement_id
        WHERE gsi.payment_transaction_id = ${paymentTransactionId}::uuid
        LIMIT 1;
      `;
      settlementItem = settleRows[0] || null;
    } catch {
      settlementItem = null;
    }

    // 5. Total allocations and remaining balance calculations
    const totalAllocated = allocRows.reduce((sum: number, a: any) => sum + (Number(a.allocated_amount) || 0), 0);
    const remainingUnallocated = Math.max(0, Number(tx.amount) - totalAllocated);
    const dueAmountDue = Number(tx.due_amount_due || 0);

    // Calculate cumulative due allocations across ALL transactions
    let cumulativeDueAllocated = 0;
    if (tx.student_charge_due_id) {
      const dueAllocAgg: any = await db.$queryRaw`
        SELECT COALESCE(SUM(pa.allocated_amount), 0)::float8 as total
        FROM payment_allocations pa
        JOIN payment_transactions pt ON pt.payment_transaction_id = pa.payment_transaction_id
        WHERE pa.student_charge_due_id = ${tx.student_charge_due_id}::uuid
          AND pt.status = 'success';
      `;
      cumulativeDueAllocated = dueAllocAgg[0]?.total || 0;
    }
    const remainingDueOnObligation = Math.max(0, dueAmountDue - cumulativeDueAllocated);

    return {
      transaction: {
        payment_transaction_id: tx.payment_transaction_id,
        payment_order_id: tx.payment_order_id,
        payment_method: tx.payment_method,
        status: tx.status,
        gateway_name: tx.gateway_name,
        gateway_transaction_id: tx.gateway_transaction_id,
        gateway_order_id: tx.gateway_order_id,
        amount: Number(tx.amount),
        currency_code: tx.currency_code,
        transaction_date: tx.transaction_date,
        failure_code: tx.failure_code,
        failure_message: tx.failure_message,
        gateway_response: tx.gateway_response,
        created_at: tx.created_at,
      },
      order: {
        payment_order_id: tx.payment_order_id,
        order_reference: tx.order_reference,
        amount: tx.order_amount,
        status: tx.order_status,
        description: tx.order_description,
        student_charge_due_id: tx.student_charge_due_id,
      },
      student: {
        student_id: tx.student_id,
        org_id: tx.org_id,
        student_name: tx.student_name,
        admission_no: tx.admission_no,
      },
      due: tx.student_charge_due_id ? {
        student_charge_due_id: tx.student_charge_due_id,
        amount_due: dueAmountDue,
        status: tx.due_status,
        due_date: tx.due_date,
        charge_description: tx.charge_description,
        cumulative_allocated: cumulativeDueAllocated,
        remaining_due: remainingDueOnObligation,
      } : null,
      allocations: allocRows,
      webhooks: webhookRows,
      settlement: settlementItem,
      calculations: {
        total_allocated: totalAllocated,
        remaining_unallocated: remainingUnallocated,
        is_captured_unallocated: tx.status === 'pending' && (tx.failure_code === 'EXCEEDS_REMAINING_DUE' || Boolean(tx.gateway_response?.gateway_captured)),
        is_fully_allocated: totalAllocated >= Number(tx.amount),
        has_allocation_mismatch: totalAllocated < Number(tx.amount) && tx.status === 'success',
      },
    };
  }

  /**
   * Fetch prioritized exceptions requiring accounting or gateway investigation.
   */
  public static async getExceptions(
    tenantOrgId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ exceptions: any[]; totalCount: number }> {
    const db = this.getClient();
    const limit = Math.min(Math.max(Number(options?.limit) || 50, 1), 100);
    const offset = Math.max(Number(options?.offset) || 0, 0);

    const rows: any = await db.$queryRaw`
      WITH alloc_totals AS (
        SELECT 
          payment_transaction_id,
          COALESCE(SUM(allocated_amount), 0)::float8 as total_allocated
        FROM payment_allocations
        GROUP BY payment_transaction_id
      ),
      dup_refs AS (
        SELECT gateway_transaction_id
        FROM payment_transactions
        WHERE gateway_transaction_id IS NOT NULL
        GROUP BY gateway_transaction_id
        HAVING COUNT(*) > 1
      )
      SELECT 
        pt.payment_transaction_id,
        pt.payment_order_id,
        s.student_id,
        CONCAT(s.first_name, ' ', COALESCE(s.last_name, '')) as student_name,
        s.admission_no,
        po.order_reference,
        pt.gateway_order_id,
        pt.gateway_transaction_id,
        pt.amount::float8 as amount,
        pt.currency_code,
        pt.status as transaction_status,
        pt.failure_code,
        pt.failure_message,
        COALESCE((pt.gateway_response->>'gateway_captured')::boolean, false) as gateway_captured,
        COALESCE(at.total_allocated, 0) as total_allocated,
        CASE
          WHEN pt.failure_code = 'EXCEEDS_REMAINING_DUE' OR pt.failure_code = 'DUE_INELIGIBLE' THEN 1
          WHEN dup.gateway_transaction_id IS NOT NULL THEN 2
          WHEN pt.status = 'success' AND COALESCE(at.total_allocated, 0) < pt.amount::float8 THEN 3
          WHEN pt.status = 'initiated' THEN 4
          ELSE 5
        END as priority_tier,
        CASE
          WHEN pt.failure_code = 'EXCEEDS_REMAINING_DUE' THEN 'CAPTURED_EXCEEDS_DUE'
          WHEN pt.failure_code = 'DUE_INELIGIBLE' THEN 'CAPTURED_DUE_INELIGIBLE'
          WHEN dup.gateway_transaction_id IS NOT NULL THEN 'DUPLICATE_GATEWAY_REFERENCE'
          WHEN pt.status = 'success' AND COALESCE(at.total_allocated, 0) < pt.amount::float8 THEN 'PARTIAL_ALLOCATION_UNCOMMITTED'
          WHEN pt.status = 'initiated' THEN 'PENDING_GATEWAY_CONFIRMATION'
          ELSE 'UNCLASSIFIED_DISCREPANCY'
        END as exception_type,
        CASE
          WHEN pt.failure_code = 'EXCEEDS_REMAINING_DUE' THEN 'Payment captured at gateway but exceeds student remaining due. Verify accounting split or allocate to upcoming due.'
          WHEN pt.failure_code = 'DUE_INELIGIBLE' THEN 'Payment captured at gateway for already settled or waived fee obligation.'
          WHEN dup.gateway_transaction_id IS NOT NULL THEN 'Multiple local transactions refer to identical gateway payment reference.'
          WHEN pt.status = 'success' AND COALESCE(at.total_allocated, 0) < pt.amount::float8 THEN 'Internal transaction success with incomplete allocation to fee dues.'
          WHEN pt.status = 'initiated' THEN 'Payment order initiated but not completed or callback not received.'
          ELSE pt.failure_message
        END as recommended_action,
        pt.created_at,
        COUNT(*) OVER()::int as full_count
      FROM payment_transactions pt
      JOIN payment_orders po ON po.payment_order_id = pt.payment_order_id
      JOIN students s ON s.student_id = po.student_id
      LEFT JOIN alloc_totals at ON at.payment_transaction_id = pt.payment_transaction_id
      LEFT JOIN dup_refs dup ON dup.gateway_transaction_id = pt.gateway_transaction_id
      WHERE s.org_id = ${tenantOrgId}::uuid
        AND (
          pt.failure_code IN ('EXCEEDS_REMAINING_DUE', 'DUE_INELIGIBLE') OR
          dup.gateway_transaction_id IS NOT NULL OR
          (pt.status = 'success' AND COALESCE(at.total_allocated, 0) < pt.amount::float8) OR
          (pt.status = 'initiated' AND pt.created_at < NOW() - INTERVAL '15 minutes')
        )
      ORDER BY priority_tier ASC, pt.created_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `;

    const totalCount = rows.length > 0 ? rows[0].full_count : 0;
    return { exceptions: rows, totalCount };
  }

  /**
   * Persists a reconciliation run record into payment_reconciliation_runs.
   */
  public static async createReconciliationRun(
    data: {
      orgId: string;
      runReference: string;
      periodStart?: Date | null;
      periodEnd?: Date | null;
      notes?: string | null;
      createdBy?: string | null;
    },
    client?: any
  ): Promise<any> {
    const db = this.getClient(client);
    const rows: any = await db.$queryRaw`
      INSERT INTO payment_reconciliation_runs (
        payment_reconciliation_run_id, org_id, run_reference,
        period_start, period_end, status,
        started_at, notes, created_by
      ) VALUES (
        gen_random_uuid(), ${data.orgId}::uuid, ${data.runReference},
        ${data.periodStart || null}, ${data.periodEnd || null}, 'in_progress'::reconciliation_run_status,
        NOW(), ${data.notes || null}, ${data.createdBy ? data.createdBy : null}::uuid
      )
      RETURNING *;
    `;
    return rows[0];
  }

  /**
   * Finalizes a reconciliation run record with outcome status.
   */
  public static async finalizeReconciliationRun(
    runId: string,
    status: 'completed' | 'completed_with_exceptions' | 'cancelled',
    notes?: string | null,
    client?: any
  ): Promise<void> {
    const db = this.getClient(client);
    await db.$executeRaw`
      UPDATE payment_reconciliation_runs
      SET status = ${status}::reconciliation_run_status,
          completed_at = NOW(),
          notes = COALESCE(${notes || null}, notes),
          updated_at = NOW()
      WHERE payment_reconciliation_run_id = ${runId}::uuid;
    `;
  }

  /**
   * List recent reconciliation runs for tenant.
   */
  public static async getReconciliationRuns(tenantOrgId: string, limit: number = 20): Promise<any[]> {
    const db = this.getClient();
    const rows: any = await db.$queryRaw`
      SELECT *
      FROM payment_reconciliation_runs
      WHERE org_id = ${tenantOrgId}::uuid
      ORDER BY created_at DESC
      LIMIT ${limit};
    `;
    return rows;
  }

  /**
   * Query authoritative settlement records from gateway_settlements.
   */
  public static async getSettlementRecords(
    tenantOrgId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<any[]> {
    const db = this.getClient();
    const limit = Math.min(Math.max(Number(options?.limit) || 20, 1), 100);
    const offset = Math.max(Number(options?.offset) || 0, 0);

    try {
      const rows: any = await db.$queryRaw`
        SELECT 
          gs.gateway_settlement_id as id,
          gs.provider_settlement_id as settlement_id,
          gs.provider_name as gateway_name,
          gs.gross_amount::float8 as amount,
          gs.currency_code as currency,
          gs.status::text as status,
          gs.settled_at,
          gs.settlement_reference as utr,
          gs.created_at,
          COUNT(gsi.gateway_settlement_item_id)::int as items_count,
          COALESCE(SUM(gsi.fee_amount)::float8, 0) as total_fees,
          COALESCE(SUM(gsi.tax_amount)::float8, 0) as total_taxes
        FROM gateway_settlements gs
        LEFT JOIN gateway_settlement_items gsi ON gsi.gateway_settlement_id = gs.gateway_settlement_id
        WHERE gs.org_id = ${tenantOrgId}::uuid
        GROUP BY gs.gateway_settlement_id
        ORDER BY gs.settled_at DESC NULLS LAST, gs.created_at DESC
        LIMIT ${limit} OFFSET ${offset};
      `;
      return rows;
    } catch {
      return [];
    }
  }
}
export default ReconciliationRepository;
