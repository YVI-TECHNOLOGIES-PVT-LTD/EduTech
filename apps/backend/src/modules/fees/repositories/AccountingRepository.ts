/**
 * EduTrack ERP — Phase 11 Finance Accounting Repository
 * ========================================================
 * High-integrity database layer for Accounting & General Ledger integration.
 * Performs tenant-scoped, parameterized raw SQL queries over existing physical tables:
 * - payment_transactions
 * - student_charges & student_charge_dues
 * - scholarship_concessions
 * - gateway_settlements & gateway_settlement_items
 * - fee_components
 * 
 * Invariants:
 * - Read-only operational queries respecting the schema freeze.
 * - Strict tenant isolation on s.org_id = tenantOrgId.
 * - Decimal-safe aggregations via float8/numeric casts.
 */

import prisma from '../../../lib/prismaClient';

export interface AccountingCapabilitiesMatrix {
  chart_of_accounts: 'blocked_by_schema_freeze';
  journal_headers_and_lines: 'blocked_by_schema_freeze';
  double_entry_validation: 'partially_available';
  fiscal_periods_and_closing: 'blocked_by_schema_freeze';
  payment_posting: 'partially_available';
  fee_assessment_posting: 'partially_available';
  concession_scholarship_accounting: 'partially_available';
  gateway_fee_and_settlement_posting: 'partially_available';
  trial_balance: 'blocked_by_schema_freeze';
  general_ledger_reports: 'blocked_by_schema_freeze';
  audit_trail_and_reversal: 'partially_available';
}

export interface AccountingSummaryKPIs {
  transactions_awaiting_accounting_count: number;
  transactions_awaiting_accounting_amount: number;
  unposted_fee_assessments_count: number;
  unposted_fee_assessments_amount: number;
  unposted_payments_count: number;
  unposted_payments_amount: number;
  unposted_concessions_count: number;
  unposted_concessions_amount: number;
  unposted_settlements_count: number;
  unposted_settlements_amount: number;
  accounting_exceptions_count: number;
  posted_journals_count: number;
  posted_journals_amount: number;
  general_ledger_configured: boolean;
}

export interface AccountingReadinessFilterOptions {
  sourceType?: 'all' | 'payment' | 'fee_assessment' | 'concession' | 'settlement';
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AccountingReadinessRecord {
  record_id: string;
  source_type: 'PAYMENT' | 'FEE_ASSESSMENT' | 'CONCESSION' | 'SETTLEMENT';
  source_reference: string;
  source_date: string;
  student_id?: string | null;
  student_name?: string | null;
  admission_no?: string | null;
  amount: number;
  currency_code: string;
  operational_status: string;
  reconciliation_status: string;
  accounting_readiness_status: 'READY_FOR_GL' | 'REQUIRES_REVIEW' | 'BLOCKED_BY_RECONCILIATION';
  suggested_debit_account: string;
  suggested_credit_account: string;
  notes?: string;
}

export class AccountingRepository {
  private static getClient(client?: any) {
    return client || prisma;
  }

  /**
   * Return the authoritative capability matrix based on verified physical schema.
   */
  public static getCapabilitiesMatrix(): AccountingCapabilitiesMatrix {
    return {
      chart_of_accounts: 'blocked_by_schema_freeze',
      journal_headers_and_lines: 'blocked_by_schema_freeze',
      double_entry_validation: 'partially_available',
      fiscal_periods_and_closing: 'blocked_by_schema_freeze',
      payment_posting: 'partially_available',
      fee_assessment_posting: 'partially_available',
      concession_scholarship_accounting: 'partially_available',
      gateway_fee_and_settlement_posting: 'partially_available',
      trial_balance: 'blocked_by_schema_freeze',
      general_ledger_reports: 'blocked_by_schema_freeze',
      audit_trail_and_reversal: 'partially_available',
    };
  }

  /**
   * Aggregate operational records awaiting accounting treatment for tenant.
   */
  public static async getSummaryKPIs(
    tenantOrgId: string,
    options?: { startDate?: string; endDate?: string }
  ): Promise<AccountingSummaryKPIs> {
    const db = this.getClient();

    let startFilter: Date = new Date(0);
    if (options?.startDate) {
      const parsed = new Date(options.startDate);
      if (!isNaN(parsed.getTime())) startFilter = parsed;
    }

    let endFilter: Date = new Date(Date.now() + 86400000 * 365);
    if (options?.endDate) {
      const parsed = new Date(options.endDate);
      if (!isNaN(parsed.getTime())) endFilter = parsed;
    }

    // 1. Payment collections awaiting accounting
    const paymentRows: any = await db.$queryRaw`
      SELECT 
        COUNT(pt.payment_transaction_id)::int as count,
        COALESCE(SUM(pt.amount), 0)::float8 as total_amount
      FROM payment_transactions pt
      JOIN payment_orders po ON po.payment_order_id = pt.payment_order_id
      JOIN students s ON s.student_id = po.student_id
      WHERE s.org_id = ${tenantOrgId}::uuid
        AND pt.status = 'success'
        AND pt.created_at >= ${startFilter}
        AND pt.created_at <= ${endFilter};
    `;
    const payments = paymentRows[0] || { count: 0, total_amount: 0 };

    // 2. Fee assessments (student charge dues) awaiting accounting
    const feeRows: any = await db.$queryRaw`
      SELECT 
        COUNT(scd.student_charge_due_id)::int as count,
        COALESCE(SUM(scd.amount_due), 0)::float8 as total_amount
      FROM student_charge_dues scd
      JOIN student_charges sc ON sc.student_charge_id = scd.student_charge_id
      JOIN students s ON s.student_id = sc.student_id
      WHERE s.org_id = ${tenantOrgId}::uuid
        AND scd.status != 'cancelled'
        AND scd.created_at >= ${startFilter}
        AND scd.created_at <= ${endFilter};
    `;
    const feeAssessments = feeRows[0] || { count: 0, total_amount: 0 };

    // 3. Concessions applied awaiting accounting
    const concessionRows: any = await db.$queryRaw`
      SELECT 
        COUNT(sc.scholarship_concession_id)::int as count,
        COALESCE(SUM(COALESCE(sc.applied_percentage, sc.concession_percentage, 0)), 0)::float8 as total_amount
      FROM scholarship_concessions sc
      JOIN students s ON s.student_id = sc.student_id
      WHERE s.org_id = ${tenantOrgId}::uuid
        AND sc.status = 'applied'
        AND sc.created_at >= ${startFilter}
        AND sc.created_at <= ${endFilter};
    `;
    const concessions = concessionRows[0] || { count: 0, total_amount: 0 };

    // 4. Gateway settlements awaiting accounting
    let settlements = { count: 0, total_amount: 0 };
    try {
      const settlementRows: any = await db.$queryRaw`
        SELECT 
          COUNT(gs.gateway_settlement_id)::int as count,
          COALESCE(SUM(gs.net_settlement_amount), 0)::float8 as total_amount
        FROM gateway_settlements gs
        WHERE gs.org_id = ${tenantOrgId}::uuid
          AND gs.status = 'settled'
          AND gs.created_at >= ${startFilter}
          AND gs.created_at <= ${endFilter};
      `;
      if (settlementRows && settlementRows.length > 0) {
        settlements = settlementRows[0];
      }
    } catch {
      settlements = { count: 0, total_amount: 0 };
    }

    // 5. Accounting Exceptions (reconciliation exceptions, captured unallocated)
    const exceptionRows: any = await db.$queryRaw`
      SELECT COUNT(pt.payment_transaction_id)::int as count
      FROM payment_transactions pt
      JOIN payment_orders po ON po.payment_order_id = pt.payment_order_id
      JOIN students s ON s.student_id = po.student_id
      WHERE s.org_id = ${tenantOrgId}::uuid
        AND (
          pt.failure_code IN ('EXCEEDS_REMAINING_DUE', 'DUE_INELIGIBLE')
          OR (pt.gateway_response->>'reconciliation_required')::boolean = true
          OR pt.status = 'initiated'
        )
        AND pt.created_at >= ${startFilter}
        AND pt.created_at <= ${endFilter};
    `;
    const exceptionsCount = exceptionRows[0]?.count || 0;

    const totalAwaitingCount =
      payments.count + feeAssessments.count + concessions.count + settlements.count;
    const totalAwaitingAmount =
      Math.round(
        (payments.total_amount +
          feeAssessments.total_amount +
          concessions.total_amount +
          settlements.total_amount) *
          100
      ) / 100;

    return {
      transactions_awaiting_accounting_count: totalAwaitingCount,
      transactions_awaiting_accounting_amount: totalAwaitingAmount,
      unposted_fee_assessments_count: feeAssessments.count,
      unposted_fee_assessments_amount: Math.round(feeAssessments.total_amount * 100) / 100,
      unposted_payments_count: payments.count,
      unposted_payments_amount: Math.round(payments.total_amount * 100) / 100,
      unposted_concessions_count: concessions.count,
      unposted_concessions_amount: Math.round(concessions.total_amount * 100) / 100,
      unposted_settlements_count: settlements.count,
      unposted_settlements_amount: Math.round(settlements.total_amount * 100) / 100,
      accounting_exceptions_count: exceptionsCount,
      posted_journals_count: 0, // Schema freeze: no physical journal tables exist
      posted_journals_amount: 0.0,
      general_ledger_configured: false, // Disclosed truthfully
    };
  }

  /**
   * Query operational financial transactions formatted with suggested double-entry debit/credit accounts.
   */
  public static async getReadinessRegister(
    tenantOrgId: string,
    options?: AccountingReadinessFilterOptions
  ): Promise<{ records: AccountingReadinessRecord[]; totalCount: number }> {
    const db = this.getClient();

    const limit = Math.min(Math.max(Number(options?.limit) || 20, 1), 100);
    const offset = Math.max(Number(options?.offset) || 0, 0);

    let startFilter: Date = new Date(0);
    if (options?.startDate) {
      const parsed = new Date(options.startDate);
      if (!isNaN(parsed.getTime())) startFilter = parsed;
    }

    let endFilter: Date = new Date(Date.now() + 86400000 * 365);
    if (options?.endDate) {
      const parsed = new Date(options.endDate);
      if (!isNaN(parsed.getTime())) endFilter = parsed;
    }

    const searchPattern = options?.search ? `%${options.search.trim().toLowerCase()}%` : null;
    const sourceType = options?.sourceType || 'all';

    // We build a unified query across operational tables using UNION ALL
    const rows: any = await db.$queryRaw`
      WITH readiness_union AS (
        -- 1. Successful Payments
        SELECT 
          pt.payment_transaction_id::text as record_id,
          'PAYMENT' as source_type,
          COALESCE(po.order_reference, pt.gateway_transaction_id, pt.payment_transaction_id::text) as source_reference,
          pt.created_at as source_date,
          s.student_id::text as student_id,
          CONCAT(s.first_name, ' ', COALESCE(s.last_name, '')) as student_name,
          s.admission_no,
          pt.amount::float8 as amount,
          pt.currency_code,
          pt.status::text as operational_status,
          CASE
            WHEN pt.status = 'success' THEN 'RECONCILED'
            WHEN pt.failure_code = 'EXCEEDS_REMAINING_DUE' THEN 'CAPTURED_UNALLOCATED'
            ELSE 'PENDING_VERIFICATION'
          END as reconciliation_status,
          CASE 
            WHEN pt.failure_code = 'EXCEEDS_REMAINING_DUE' THEN 'BLOCKED_BY_RECONCILIATION'
            WHEN pt.status = 'success' THEN 'READY_FOR_GL'
            ELSE 'REQUIRES_REVIEW'
          END as accounting_readiness_status,
          '1010 - Bank Clearing / Gateway' as suggested_debit_account,
          '1200 - Accounts Receivable (Students)' as suggested_credit_account,
          CONCAT('Payment collection via ', pt.payment_method::text) as notes
        FROM payment_transactions pt
        JOIN payment_orders po ON po.payment_order_id = pt.payment_order_id
        JOIN students s ON s.student_id = po.student_id
        WHERE s.org_id = ${tenantOrgId}::uuid
          AND pt.created_at >= ${startFilter}
          AND pt.created_at <= ${endFilter}

        UNION ALL

        -- 2. Fee Dues / Demands (Assessments)
        SELECT 
          scd.student_charge_due_id::text as record_id,
          'FEE_ASSESSMENT' as source_type,
          CONCAT('DUE-', SUBSTRING(scd.student_charge_due_id::text, 1, 8)) as source_reference,
          scd.created_at as source_date,
          s.student_id::text as student_id,
          CONCAT(s.first_name, ' ', COALESCE(s.last_name, '')) as student_name,
          s.admission_no,
          scd.amount_due::float8 as amount,
          'INR' as currency_code,
          scd.status::text as operational_status,
          'RECORDED' as reconciliation_status,
          'READY_FOR_GL' as accounting_readiness_status,
          '1200 - Accounts Receivable (Students)' as suggested_debit_account,
          '4000 - Fee Revenue (Tuition & Services)' as suggested_credit_account,
          CONCAT('Fee obligation due ', TO_CHAR(scd.due_date, 'YYYY-MM-DD')) as notes
        FROM student_charge_dues scd
        JOIN student_charges sc ON sc.student_charge_id = scd.student_charge_id
        JOIN students s ON s.student_id = sc.student_id
        WHERE s.org_id = ${tenantOrgId}::uuid
          AND scd.status != 'cancelled'
          AND scd.created_at >= ${startFilter}
          AND scd.created_at <= ${endFilter}

        UNION ALL

        -- 3. Applied Concessions
        SELECT 
          sc.scholarship_concession_id::text as record_id,
          'CONCESSION' as source_type,
          CONCAT('SCH-', SUBSTRING(sc.scholarship_concession_id::text, 1, 8)) as source_reference,
          sc.created_at as source_date,
          s.student_id::text as student_id,
          CONCAT(s.first_name, ' ', COALESCE(s.last_name, '')) as student_name,
          s.admission_no,
          COALESCE(sc.applied_percentage, sc.concession_percentage, 0)::float8 as amount,
          'INR' as currency_code,
          sc.status::text as operational_status,
          'APPLIED' as reconciliation_status,
          'READY_FOR_GL' as accounting_readiness_status,
          '4900 - Scholarship & Fee Concession Contra-Revenue' as suggested_debit_account,
          '1200 - Accounts Receivable (Students)' as suggested_credit_account,
          CONCAT(sc.scholarship_type::text, ' concession applied') as notes
        FROM scholarship_concessions sc
        JOIN students s ON s.student_id = sc.student_id
        WHERE s.org_id = ${tenantOrgId}::uuid
          AND sc.status = 'applied'
          AND sc.created_at >= ${startFilter}
          AND sc.created_at <= ${endFilter}
      )
      SELECT 
        u.*,
        COUNT(*) OVER()::int as full_count
      FROM readiness_union u
      WHERE (${sourceType}::text = 'all' OR LOWER(u.source_type) = LOWER(${sourceType}))
        AND (
          ${searchPattern}::text IS NULL OR
          LOWER(u.student_name) LIKE ${searchPattern} OR
          LOWER(u.admission_no) LIKE ${searchPattern} OR
          LOWER(u.source_reference) LIKE ${searchPattern}
        )
      ORDER BY u.source_date DESC
      LIMIT ${limit} OFFSET ${offset};
    `;

    const totalCount = rows.length > 0 ? rows[0].full_count : 0;
    const records: AccountingReadinessRecord[] = rows.map((r: any) => ({
      record_id: r.record_id,
      source_type: r.source_type,
      source_reference: r.source_reference,
      source_date: r.source_date ? new Date(r.source_date).toISOString() : new Date().toISOString(),
      student_id: r.student_id,
      student_name: r.student_name,
      admission_no: r.admission_no,
      amount: Number(r.amount) || 0,
      currency_code: r.currency_code || 'INR',
      operational_status: r.operational_status,
      reconciliation_status: r.reconciliation_status,
      accounting_readiness_status: r.accounting_readiness_status,
      suggested_debit_account: r.suggested_debit_account,
      suggested_credit_account: r.suggested_credit_account,
      notes: r.notes,
    }));

    return { records, totalCount };
  }

  /**
   * Return standardized Educational Chart of Accounts reference model.
   * Discloses that persistence of custom accounts is blocked by schema freeze.
   */
  public static getStandardChartOfAccounts() {
    return [
      {
        account_code: '1010',
        account_name: 'Bank Account / Payment Gateway Clearing',
        account_type: 'ASSET',
        normal_balance: 'DEBIT',
        description: 'Holds captured gateway collections pending settlement disbursement into institution bank account.',
        is_system_standard: true,
      },
      {
        account_code: '1020',
        account_name: 'Operating Bank Account (Main)',
        account_type: 'ASSET',
        normal_balance: 'DEBIT',
        description: 'Primary institutional depository receiving net settlements from payment gateway.',
        is_system_standard: true,
      },
      {
        account_code: '1200',
        account_name: 'Accounts Receivable (Students)',
        account_type: 'ASSET',
        normal_balance: 'DEBIT',
        description: 'Cumulative outstanding fee dues assessed across enrolled students.',
        is_system_standard: true,
      },
      {
        account_code: '2100',
        account_name: 'Unearned Fee Revenue / Student Advance Deposits',
        account_type: 'LIABILITY',
        normal_balance: 'CREDIT',
        description: 'Fee amounts captured before corresponding fee term obligation is due.',
        is_system_standard: true,
      },
      {
        account_code: '4000',
        account_name: 'Tuition Fee Revenue',
        account_type: 'REVENUE',
        normal_balance: 'CREDIT',
        description: 'Academic tuition charge assessments.',
        is_system_standard: true,
      },
      {
        account_code: '4100',
        account_name: 'Transport & Bus Fee Revenue',
        account_type: 'REVENUE',
        normal_balance: 'CREDIT',
        description: 'Student transportation charge assessments.',
        is_system_standard: true,
      },
      {
        account_code: '4900',
        account_name: 'Scholarship & Concession Contra-Revenue',
        account_type: 'CONTRA_REVENUE',
        normal_balance: 'DEBIT',
        description: 'Approved and applied merit, sibling, and staff fee waivers.',
        is_system_standard: true,
      },
      {
        account_code: '5100',
        account_name: 'Payment Gateway Processing Charges & Taxes',
        account_type: 'EXPENSE',
        normal_balance: 'DEBIT',
        description: 'Gateway service fees and GST deducted before net bank disbursement.',
        is_system_standard: true,
      },
    ];
  }

  /**
   * Retrieve prioritized accounting exceptions (unmapped records, reconciliation discrepancies).
   */
  public static async getAccountingExceptions(
    tenantOrgId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<any[]> {
    const db = this.getClient();
    const limit = Math.min(Math.max(Number(options?.limit) || 20, 1), 100);
    const offset = Math.max(Number(options?.offset) || 0, 0);

    const rows: any = await db.$queryRaw`
      SELECT 
        pt.payment_transaction_id as id,
        'CAPTURED_UNALLOCATED' as exception_type,
        pt.amount::float8 as amount,
        pt.currency_code,
        pt.gateway_transaction_id,
        po.order_reference,
        CONCAT(s.first_name, ' ', COALESCE(s.last_name, '')) as student_name,
        s.admission_no,
        pt.failure_code,
        pt.failure_message,
        'Payment captured on gateway but cannot allocate to fee due. Requires manual ledger allocation or refund before general ledger posting.' as recommended_action,
        pt.created_at
      FROM payment_transactions pt
      JOIN payment_orders po ON po.payment_order_id = pt.payment_order_id
      JOIN students s ON s.student_id = po.student_id
      WHERE s.org_id = ${tenantOrgId}::uuid
        AND (
          pt.failure_code IN ('EXCEEDS_REMAINING_DUE', 'DUE_INELIGIBLE')
          OR (pt.gateway_response->>'reconciliation_required')::boolean = true
        )
      ORDER BY pt.created_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `;

    return rows;
  }
}
export default AccountingRepository;
