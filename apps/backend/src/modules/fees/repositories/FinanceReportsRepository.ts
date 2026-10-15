/**
 * EduTrack ERP — Phase 12 Finance Reports Repository
 * ====================================================
 * High-performance, parameterized SQL database layer for Financial Reports & Financial Intelligence.
 * Operates strictly over verified physical schema:
 * - payment_transactions
 * - payment_allocations
 * - student_charges
 * - student_charge_dues
 * - fee_components
 * - scholarship_concessions
 * - gateway_settlements
 * - gateway_settlement_items
 * - students, academic_years, grades
 * 
 * Invariants:
 * - Read-only operational queries respecting the schema freeze.
 * - Strict tenant isolation on org_id.
 * - Exact decimal-safe aggregations via numeric/float8 casts.
 * - Independent CTE aggregation to prevent Cartesian join duplication.
 */

import prisma from '../../../lib/prismaClient';

export interface ReportDateFilter {
  startDate?: string;
  endDate?: string;
  academicYearId?: string;
  gradeId?: string;
}

export interface CollectionsFilterOptions extends ReportDateFilter {
  paymentMethod?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ReceivablesFilterOptions extends ReportDateFilter {
  status?: string;
  ageingBucket?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export class FinanceReportsRepository {
  private static getClient(client?: any) {
    return client || prisma;
  }

  public static roundMoney(val: number | string | null | undefined): number {
    if (val === null || val === undefined) return 0;
    const num = typeof val === 'number' ? val : Number(val);
    if (isNaN(num)) return 0;
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  // =========================================================================
  // 1. EXECUTIVE FINANCIAL SUMMARY KPIS (Screen A)
  // =========================================================================
  public static async getExecutiveSummary(
    tenantOrgId: string,
    filter?: ReportDateFilter
  ) {
    const db = this.getClient();
    const params: any[] = [tenantOrgId];

    let dateCond = '';
    if (filter?.startDate) {
      params.push(filter.startDate);
      dateCond += ` AND pt.transaction_date >= $${params.length}::date `;
    }
    if (filter?.endDate) {
      params.push(filter.endDate);
      dateCond += ` AND pt.transaction_date < ($${params.length}::date + INTERVAL '1 day') `;
    }

    // 1. Collections: Gross successful, Pending, Failed, Cancelled
    const collectionsSql = `
      SELECT
        COUNT(*)::int as total_transactions,
        COALESCE(SUM(CASE WHEN pt.status = 'success'::payment_transaction_status THEN pt.amount ELSE 0 END), 0)::float8 as successful_collections,
        COALESCE(SUM(CASE WHEN pt.status = 'pending'::payment_transaction_status THEN pt.amount ELSE 0 END), 0)::float8 as pending_amount,
        COALESCE(SUM(CASE WHEN pt.status = 'failed'::payment_transaction_status THEN pt.amount ELSE 0 END), 0)::float8 as failed_amount,
        COUNT(CASE WHEN pt.status = 'success'::payment_transaction_status THEN 1 END)::int as successful_count,
        COUNT(CASE WHEN pt.status = 'pending'::payment_transaction_status THEN 1 END)::int as pending_count,
        COUNT(CASE WHEN pt.status = 'failed'::payment_transaction_status THEN 1 END)::int as failed_count
      FROM payment_transactions pt
      JOIN payment_orders po ON pt.payment_order_id = po.payment_order_id
      JOIN students s ON po.student_id = s.student_id
      WHERE s.org_id = $1::uuid
      ${dateCond}
    `;

    // 2. Allocations & Captured-but-Unallocated
    const unallocatedSql = `
      WITH allocated_per_tx AS (
        SELECT
          pa.payment_transaction_id,
          COALESCE(SUM(pa.allocated_amount), 0)::numeric as total_allocated
        FROM payment_allocations pa
        GROUP BY pa.payment_transaction_id
      )
      SELECT
        COUNT(*)::int as captured_unallocated_count,
        COALESCE(SUM(pt.amount::numeric - COALESCE(apt.total_allocated, 0)), 0)::float8 as captured_unallocated_amount
      FROM payment_transactions pt
      JOIN payment_orders po ON pt.payment_order_id = po.payment_order_id
      JOIN students s ON po.student_id = s.student_id
      LEFT JOIN allocated_per_tx apt ON pt.payment_transaction_id = apt.payment_transaction_id
      WHERE s.org_id = $1::uuid
        AND pt.status = 'success'::payment_transaction_status
        AND (pt.amount::numeric - COALESCE(apt.total_allocated, 0)) > 0
    `;

    // 3. Fee Assessments & Receivables (Dues vs Allocations)
    const duesSql = `
      WITH allocated_per_due AS (
        SELECT
          pa.student_charge_due_id,
          COALESCE(SUM(pa.allocated_amount), 0)::numeric as total_allocated
        FROM payment_allocations pa
        JOIN payment_transactions pt ON pa.payment_transaction_id = pt.payment_transaction_id
        WHERE pt.status = 'success'::payment_transaction_status
        GROUP BY pa.student_charge_due_id
      )
      SELECT
        COUNT(scd.student_charge_due_id)::int as total_dues_count,
        COALESCE(SUM(scd.amount_due), 0)::float8 as total_assessed_dues,
        COALESCE(SUM(GREATEST(0, scd.amount_due::numeric - COALESCE(apd.total_allocated, 0))), 0)::float8 as total_outstanding,
        COALESCE(SUM(CASE 
          WHEN scd.due_date < CURRENT_DATE 
          THEN GREATEST(0, scd.amount_due::numeric - COALESCE(apd.total_allocated, 0))
          ELSE 0 
        END), 0)::float8 as total_overdue,
        COALESCE(SUM(CASE 
          WHEN scd.due_date >= CURRENT_DATE 
          THEN GREATEST(0, scd.amount_due::numeric - COALESCE(apd.total_allocated, 0))
          ELSE 0 
        END), 0)::float8 as not_yet_due,
        COUNT(CASE 
          WHEN scd.due_date < CURRENT_DATE AND (scd.amount_due::numeric - COALESCE(apd.total_allocated, 0)) > 0 
          THEN 1 
        END)::int as overdue_dues_count
      FROM student_charge_dues scd
      JOIN student_charges sc ON scd.student_charge_id = sc.student_charge_id
      JOIN students s ON sc.student_id = s.student_id
      LEFT JOIN allocated_per_due apd ON scd.student_charge_due_id = apd.student_charge_due_id
      WHERE s.org_id = $1::uuid
    `;

    // 4. Concessions
    const concessionsSql = `
      SELECT
        COUNT(*)::int as total_concessions_count,
        COUNT(CASE WHEN sc.status = 'approved' THEN 1 END)::int as approved_concessions_count,
        COUNT(CASE WHEN sc.status = 'applied' THEN 1 END)::int as applied_concessions_count,
        COALESCE(AVG(sc.concession_percentage), 0)::float8 as avg_concession_percentage
      FROM scholarship_concessions sc
      JOIN students s ON sc.student_id = s.student_id
      WHERE s.org_id = $1::uuid
    `;

    // 5. Gateway Settlements
    const settlementsSql = `
      SELECT
        COUNT(*)::int as total_settlement_batches,
        COALESCE(SUM(gross_amount), 0)::float8 as total_gross_settled,
        COALESCE(SUM(fee_amount), 0)::float8 as total_gateway_fees,
        COALESCE(SUM(tax_amount), 0)::float8 as total_gateway_taxes,
        COALESCE(SUM(net_settlement_amount), 0)::float8 as total_net_settled
      FROM gateway_settlements
      WHERE org_id = $1::uuid
        AND status = 'settled'
    `;

    const [collRes, unallocRes, duesRes, concRes, setlRes]: any[] = await Promise.all([
      db.$queryRawUnsafe(collectionsSql, ...params),
      db.$queryRawUnsafe(unallocatedSql, tenantOrgId),
      db.$queryRawUnsafe(duesSql, tenantOrgId),
      db.$queryRawUnsafe(concessionsSql, tenantOrgId),
      db.$queryRawUnsafe(settlementsSql, tenantOrgId)
    ]);

    const c = collRes[0] || {};
    const u = unallocRes[0] || {};
    const d = duesRes[0] || {};
    const conc = concRes[0] || {};
    const s = setlRes[0] || {};

    const successfulCollections = this.roundMoney(c.successful_collections);
    const totalAssessedDues = this.roundMoney(d.total_assessed_dues);
    const totalOutstanding = this.roundMoney(d.total_outstanding);
    const collectionRate = totalAssessedDues > 0
      ? this.roundMoney((successfulCollections / totalAssessedDues) * 100)
      : 0;

    return {
      fee_assessments_total: totalAssessedDues,
      successful_collections_total: successfulCollections,
      successful_transactions_count: c.successful_count || 0,
      outstanding_receivables_total: totalOutstanding,
      overdue_receivables_total: this.roundMoney(d.total_overdue),
      not_yet_due_receivables_total: this.roundMoney(d.not_yet_due),
      overdue_accounts_count: d.overdue_dues_count || 0,
      collection_rate_pct: collectionRate,
      captured_unallocated_total: this.roundMoney(u.captured_unallocated_amount),
      captured_unallocated_count: u.captured_unallocated_count || 0,
      pending_collections_total: this.roundMoney(c.pending_amount),
      pending_transactions_count: c.pending_count || 0,
      failed_collections_total: this.roundMoney(c.failed_amount),
      failed_transactions_count: c.failed_count || 0,
      concessions_approved_count: conc.approved_concessions_count || 0,
      concessions_applied_count: conc.applied_concessions_count || 0,
      concessions_avg_pct: this.roundMoney(conc.avg_concession_percentage),
      settlements_gross_total: this.roundMoney(s.total_gross_settled),
      settlements_fees_total: this.roundMoney(s.total_gateway_fees),
      settlements_taxes_total: this.roundMoney(s.total_gateway_taxes),
      settlements_net_total: this.roundMoney(s.total_net_settled),
      settlements_batches_count: s.total_settlement_batches || 0,
      currency_code: 'INR'
    };
  }

  // =========================================================================
  // 2. DETAILED COLLECTIONS REPORT (Screen B)
  // =========================================================================
  public static async getCollectionsReport(
    tenantOrgId: string,
    options?: CollectionsFilterOptions
  ) {
    const db = this.getClient();
    const params: any[] = [tenantOrgId];
    let whereClause = ` WHERE s.org_id = $1::uuid `;

    if (options?.startDate) {
      params.push(options.startDate);
      whereClause += ` AND pt.transaction_date >= $${params.length}::date `;
    }
    if (options?.endDate) {
      params.push(options.endDate);
      whereClause += ` AND pt.transaction_date < ($${params.length}::date + INTERVAL '1 day') `;
    }
    if (options?.paymentMethod && options.paymentMethod !== 'all') {
      params.push(options.paymentMethod.toLowerCase());
      whereClause += ` AND LOWER(pt.payment_method::text) = $${params.length} `;
    }
    if (options?.status && options.status !== 'all') {
      params.push(options.status.toLowerCase());
      whereClause += ` AND LOWER(pt.status::text) = $${params.length} `;
    }
    if (options?.search && options.search.trim().length > 0) {
      const q = `%${options.search.trim().toLowerCase()}%`;
      params.push(q);
      whereClause += ` AND (
        LOWER(COALESCE(pt.gateway_transaction_id, '')) LIKE $${params.length}
        OR LOWER(COALESCE(pt.gateway_order_id, '')) LIKE $${params.length}
        OR LOWER(COALESCE(s.admission_no, '')) LIKE $${params.length}
        OR LOWER(COALESCE(s.first_name, '')) LIKE $${params.length}
        OR LOWER(COALESCE(s.last_name, '')) LIKE $${params.length}
      ) `;
    }

    // Pagination
    const limit = Math.min(Math.max(Number(options?.limit) || 20, 1), 500);
    const offset = Math.max(Number(options?.offset) || 0, 0);

    const baseSql = `
      WITH allocated_per_tx AS (
        SELECT
          pa.payment_transaction_id,
          COALESCE(SUM(pa.allocated_amount), 0)::numeric as total_allocated,
          COUNT(pa.payment_allocation_id)::int as allocation_count
        FROM payment_allocations pa
        GROUP BY pa.payment_transaction_id
      )
      SELECT
        pt.payment_transaction_id,
        s.org_id,
        pt.amount::float8 as amount,
        pt.currency_code as currency,
        pt.status::text as status,
        pt.payment_method::text as payment_method,
        pt.gateway_order_id,
        pt.gateway_transaction_id as gateway_payment_id,
        pt.gateway_transaction_id,
        pt.transaction_date,
        pt.created_at,
        s.student_id,
        s.admission_no,
        s.first_name,
        s.last_name,
        COALESCE(apt.total_allocated, 0)::float8 as allocated_amount,
        GREATEST(0, (pt.amount::numeric - COALESCE(apt.total_allocated, 0)))::float8 as unallocated_amount,
        COALESCE(apt.allocation_count, 0) as allocation_count,
        CASE
          WHEN pt.status = 'success'::payment_transaction_status AND (pt.amount::numeric - COALESCE(apt.total_allocated, 0)) > 0 THEN 'CAPTURED_UNALLOCATED'
          WHEN pt.status = 'success'::payment_transaction_status THEN 'FULLY_ALLOCATED'
          WHEN pt.status = 'pending'::payment_transaction_status THEN 'PENDING_CONFIRMATION'
          WHEN pt.status = 'failed'::payment_transaction_status THEN 'PAYMENT_FAILED'
          ELSE 'CANCELLED'
        END as operational_classification
      FROM payment_transactions pt
      JOIN payment_orders po ON pt.payment_order_id = po.payment_order_id
      JOIN students s ON po.student_id = s.student_id
      LEFT JOIN allocated_per_tx apt ON pt.payment_transaction_id = apt.payment_transaction_id
      ${whereClause}
    `;

    const countSql = `
      SELECT COUNT(*)::int as total
      FROM payment_transactions pt
      JOIN payment_orders po ON pt.payment_order_id = po.payment_order_id
      JOIN students s ON po.student_id = s.student_id
      ${whereClause}
    `;

    const paginatedSql = `
      ${baseSql}
      ORDER BY pt.transaction_date DESC, pt.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const [countRes, rows]: any[] = await Promise.all([
      db.$queryRawUnsafe(countSql, ...params),
      db.$queryRawUnsafe(paginatedSql, ...params, limit, offset)
    ]);

    const total = countRes[0]?.total || 0;

    // Daily trends for collections
    const trendSql = `
      SELECT
        pt.transaction_date::date::text as report_date,
        COUNT(*)::int as count,
        COALESCE(SUM(CASE WHEN pt.status = 'success'::payment_transaction_status THEN pt.amount ELSE 0 END), 0)::float8 as total_amount
      FROM payment_transactions pt
      JOIN payment_orders po ON pt.payment_order_id = po.payment_order_id
      JOIN students s ON po.student_id = s.student_id
      ${whereClause}
      GROUP BY pt.transaction_date::date
      ORDER BY pt.transaction_date::date ASC
      LIMIT 31
    `;
    const trends: any[] = await db.$queryRawUnsafe(trendSql, ...params);

    return {
      total,
      limit,
      offset,
      data: rows.map((r: any) => ({
        ...r,
        student_name: r.first_name ? `${r.first_name} ${r.last_name || ''}`.trim() : null
      })),
      trends: trends.map((t: any) => ({
        date: t.report_date,
        count: t.count,
        amount: this.roundMoney(t.total_amount)
      }))
    };
  }

  // =========================================================================
  // 3. RECEIVABLES & AGEING REPORT (Screen C)
  // =========================================================================
  public static async getAgeingReport(
    tenantOrgId: string,
    options?: ReceivablesFilterOptions
  ) {
    const db = this.getClient();
    const params: any[] = [tenantOrgId];

    let whereSql = ` WHERE s.org_id = $1::uuid `;

    if (options?.academicYearId) {
      params.push(options.academicYearId);
      whereSql += ` AND sc.academic_year_id = $${params.length}::uuid `;
    }

    if (options?.search && options.search.trim().length > 0) {
      const q = `%${options.search.trim().toLowerCase()}%`;
      params.push(q);
      whereSql += ` AND (
        LOWER(s.admission_no) LIKE $${params.length}
        OR LOWER(s.first_name) LIKE $${params.length}
        OR LOWER(COALESCE(s.last_name, '')) LIKE $${params.length}
        OR LOWER(fc.component_name) LIKE $${params.length}
      ) `;
    }

    const baseAgeingSql = `
      WITH allocated_per_due AS (
        SELECT
          pa.student_charge_due_id,
          COALESCE(SUM(pa.allocated_amount), 0)::numeric as total_allocated
        FROM payment_allocations pa
        JOIN payment_transactions pt ON pa.payment_transaction_id = pt.payment_transaction_id
        WHERE pt.status = 'success'::payment_transaction_status
        GROUP BY pa.student_charge_due_id
      ),
      dues_classified AS (
        SELECT
          scd.student_charge_due_id,
          s.student_id,
          s.admission_no,
          s.first_name,
          s.last_name,
          fc.component_name,
          scd.amount_due::float8 as amount_due,
          COALESCE(apd.total_allocated, 0)::float8 as paid_amount,
          GREATEST(0, (scd.amount_due::numeric - COALESCE(apd.total_allocated, 0)))::float8 as outstanding_amount,
          scd.due_date,
          (CURRENT_DATE - scd.due_date::date)::int as days_overdue,
          CASE
            WHEN (CURRENT_DATE - scd.due_date::date) <= 0 THEN 'CURRENT'
            WHEN (CURRENT_DATE - scd.due_date::date) BETWEEN 1 AND 7 THEN 'OVERDUE_1_7'
            WHEN (CURRENT_DATE - scd.due_date::date) BETWEEN 8 AND 30 THEN 'OVERDUE_8_30'
            WHEN (CURRENT_DATE - scd.due_date::date) BETWEEN 31 AND 60 THEN 'OVERDUE_31_60'
            WHEN (CURRENT_DATE - scd.due_date::date) BETWEEN 61 AND 90 THEN 'OVERDUE_61_90'
            ELSE 'OVERDUE_90_PLUS'
          END as ageing_bucket
        FROM student_charge_dues scd
        JOIN student_charges sc ON scd.student_charge_id = sc.student_charge_id
        JOIN students s ON sc.student_id = s.student_id
        LEFT JOIN fee_components fc ON sc.fee_component_id = fc.fee_component_id
        LEFT JOIN allocated_per_due apd ON scd.student_charge_due_id = apd.student_charge_due_id
        ${whereSql}
      )
    `;

    // 1. Bucket aggregations
    const bucketSql = `
      ${baseAgeingSql}
      SELECT
        ageing_bucket,
        COUNT(*)::int as dues_count,
        COUNT(DISTINCT student_id)::int as student_count,
        COALESCE(SUM(outstanding_amount), 0)::float8 as total_outstanding
      FROM dues_classified
      WHERE outstanding_amount > 0
      GROUP BY ageing_bucket
    `;

    const bucketRows: any[] = await db.$queryRawUnsafe(bucketSql, ...params);

    const bucketMap: Record<string, { dues_count: number; student_count: number; total_outstanding: number }> = {
      CURRENT: { dues_count: 0, student_count: 0, total_outstanding: 0 },
      OVERDUE_1_7: { dues_count: 0, student_count: 0, total_outstanding: 0 },
      OVERDUE_8_30: { dues_count: 0, student_count: 0, total_outstanding: 0 },
      OVERDUE_31_60: { dues_count: 0, student_count: 0, total_outstanding: 0 },
      OVERDUE_61_90: { dues_count: 0, student_count: 0, total_outstanding: 0 },
      OVERDUE_90_PLUS: { dues_count: 0, student_count: 0, total_outstanding: 0 },
    };

    for (const row of bucketRows) {
      if (bucketMap[row.ageing_bucket]) {
        bucketMap[row.ageing_bucket] = {
          dues_count: row.dues_count,
          student_count: row.student_count,
          total_outstanding: this.roundMoney(row.total_outstanding)
        };
      }
    }

    // 2. Detail listing if requested
    const limit = Math.min(Math.max(Number(options?.limit) || 20, 1), 500);
    const offset = Math.max(Number(options?.offset) || 0, 0);

    let detailWhere = ' WHERE outstanding_amount > 0 ';
    const detailParams = [...params];
    if (options?.ageingBucket && options.ageingBucket !== 'all') {
      detailParams.push(options.ageingBucket);
      detailWhere += ` AND ageing_bucket = $${detailParams.length} `;
    }

    const detailSql = `
      ${baseAgeingSql}
      SELECT *
      FROM dues_classified
      ${detailWhere}
      ORDER BY days_overdue DESC, due_date ASC
      LIMIT $${detailParams.length + 1} OFFSET $${detailParams.length + 2}
    `;

    const detailCountSql = `
      ${baseAgeingSql}
      SELECT COUNT(*)::int as total
      FROM dues_classified
      ${detailWhere}
    `;

    const [detailCountRes, detailRows]: any[] = await Promise.all([
      db.$queryRawUnsafe(detailCountSql, ...detailParams),
      db.$queryRawUnsafe(detailSql, ...detailParams, limit, offset)
    ]);

    return {
      buckets: bucketMap,
      total_outstanding: this.roundMoney(
        Object.values(bucketMap).reduce((acc, b) => acc + b.total_outstanding, 0)
      ),
      total_overdue: this.roundMoney(
        Object.entries(bucketMap)
          .filter(([k]) => k !== 'CURRENT')
          .reduce((acc, [, b]) => acc + b.total_outstanding, 0)
      ),
      detail: {
        total: detailCountRes[0]?.total || 0,
        limit,
        offset,
        data: detailRows.map((r: any) => ({
          ...r,
          student_name: `${r.first_name} ${r.last_name || ''}`.trim()
        }))
      }
    };
  }

  // =========================================================================
  // 4. FEE ASSESSMENTS & COMPONENT BREAKDOWN (Screen D)
  // =========================================================================
  public static async getAssessmentAndComponentReport(
    tenantOrgId: string,
    filter?: ReportDateFilter
  ) {
    const db = this.getClient();
    const params: any[] = [tenantOrgId];

    let whereClause = ` WHERE s.org_id = $1::uuid `;
    if (filter?.academicYearId) {
      params.push(filter.academicYearId);
      whereClause += ` AND sc.academic_year_id = $${params.length}::uuid `;
    }

    const sql = `
      WITH allocated_per_due AS (
        SELECT
          pa.student_charge_due_id,
          COALESCE(SUM(pa.allocated_amount), 0)::numeric as total_allocated
        FROM payment_allocations pa
        JOIN payment_transactions pt ON pa.payment_transaction_id = pt.payment_transaction_id
        WHERE pt.status = 'success'::payment_transaction_status
        GROUP BY pa.student_charge_due_id
      ),
      due_aggregates_per_charge AS (
        SELECT
          scd.student_charge_id,
          COUNT(scd.student_charge_due_id)::int as dues_count,
          COALESCE(SUM(scd.amount_due), 0)::float8 as total_dues_amount,
          COALESCE(SUM(apd.total_allocated), 0)::float8 as total_paid_amount,
          COALESCE(SUM(GREATEST(0, scd.amount_due::numeric - COALESCE(apd.total_allocated, 0))), 0)::float8 as total_outstanding_amount
        FROM student_charge_dues scd
        LEFT JOIN allocated_per_due apd ON scd.student_charge_due_id = apd.student_charge_due_id
        GROUP BY scd.student_charge_id
      )
      SELECT
        COALESCE(fc.fee_component_id::text, 'unassigned') as component_id,
        COALESCE(fc.component_name, 'General Assessment') as component_name,
        COALESCE(fc.component_code, 'GEN') as component_code,
        COUNT(sc.student_charge_id)::int as charges_count,
        COUNT(DISTINCT sc.student_id)::int as student_count,
        COALESCE(SUM(sc.amount), 0)::float8 as assessed_amount,
        COALESCE(SUM(dac.total_dues_amount), 0)::float8 as total_dues_amount,
        COALESCE(SUM(dac.total_paid_amount), 0)::float8 as total_paid_amount,
        COALESCE(SUM(dac.total_outstanding_amount), 0)::float8 as total_outstanding_amount
      FROM student_charges sc
      JOIN students s ON sc.student_id = s.student_id
      LEFT JOIN fee_components fc ON sc.fee_component_id = fc.fee_component_id
      LEFT JOIN due_aggregates_per_charge dac ON sc.student_charge_id = dac.student_charge_id
      ${whereClause}
      GROUP BY fc.fee_component_id, fc.component_name, fc.component_code
      ORDER BY assessed_amount DESC
    `;

    const rows: any[] = await db.$queryRawUnsafe(sql, ...params);

    const totals = rows.reduce(
      (acc, r) => ({
        assessed: acc.assessed + r.assessed_amount,
        dues: acc.dues + r.total_dues_amount,
        paid: acc.paid + r.total_paid_amount,
        outstanding: acc.outstanding + r.total_outstanding_amount,
        students: acc.students + r.student_count,
        charges: acc.charges + r.charges_count
      }),
      { assessed: 0, dues: 0, paid: 0, outstanding: 0, students: 0, charges: 0 }
    );

    return {
      components: rows.map((r: any) => ({
        ...r,
        assessed_amount: this.roundMoney(r.assessed_amount),
        total_dues_amount: this.roundMoney(r.total_dues_amount),
        total_paid_amount: this.roundMoney(r.total_paid_amount),
        total_outstanding_amount: this.roundMoney(r.total_outstanding_amount),
        collection_rate_pct: r.total_dues_amount > 0
          ? this.roundMoney((r.total_paid_amount / r.total_dues_amount) * 100)
          : 0
      })),
      summary: {
        total_assessed: this.roundMoney(totals.assessed),
        total_dues: this.roundMoney(totals.dues),
        total_paid: this.roundMoney(totals.paid),
        total_outstanding: this.roundMoney(totals.outstanding),
        total_charges_count: totals.charges,
        collection_rate_pct: totals.dues > 0
          ? this.roundMoney((totals.paid / totals.dues) * 100)
          : 0
      }
    };
  }

  // =========================================================================
  // 5. SCHOLARSHIPS & CONCESSIONS REPORT (Screen E)
  // =========================================================================
  public static async getScholarshipsAndConcessionsReport(
    tenantOrgId: string,
    filter?: ReportDateFilter
  ) {
    const db = this.getClient();
    const params: any[] = [tenantOrgId];

    const sql = `
      SELECT
        sc.scholarship_type::text as scholarship_type,
        sc.status::text as status,
        COUNT(*)::int as count,
        COUNT(DISTINCT sc.student_id)::int as student_count,
        COALESCE(AVG(sc.concession_percentage), 0)::float8 as avg_percentage,
        COALESCE(MIN(sc.concession_percentage), 0)::float8 as min_percentage,
        COALESCE(MAX(sc.concession_percentage), 0)::float8 as max_percentage
      FROM scholarship_concessions sc
      JOIN students s ON sc.student_id = s.student_id
      WHERE s.org_id = $1::uuid
      GROUP BY sc.scholarship_type, sc.status
      ORDER BY count DESC
    `;

    const rows: any[] = await db.$queryRawUnsafe(sql, ...params);

    const byType = rows.map((r: any) => ({
      scholarship_type: r.scholarship_type,
      status: r.status,
      count: r.count,
      student_count: r.student_count,
      avg_percentage: this.roundMoney(r.avg_percentage),
      min_percentage: this.roundMoney(r.min_percentage),
      max_percentage: this.roundMoney(r.max_percentage)
    }));

    const totalCount = byType.reduce((acc, r) => acc + r.count, 0);
    const approvedCount = byType
      .filter((r) => r.status === 'approved' || r.status === 'applied')
      .reduce((acc, r) => acc + r.count, 0);

    return {
      concessions_by_type: byType,
      summary: {
        total_records: totalCount,
        approved_or_applied_count: approvedCount,
        pending_approval_count: byType
          .filter((r) => r.status === 'submitted')
          .reduce((acc, r) => acc + r.count, 0),
        rejected_count: byType
          .filter((r) => r.status === 'rejected')
          .reduce((acc, r) => acc + r.count, 0)
      }
    };
  }

  // =========================================================================
  // 6. GATEWAY SETTLEMENTS & DEPOSITS REPORT (Screen F)
  // =========================================================================
  public static async getSettlementsReport(
    tenantOrgId: string,
    options?: { limit?: number; offset?: number }
  ) {
    const db = this.getClient();
    const limit = Math.min(Math.max(Number(options?.limit) || 20, 1), 100);
    const offset = Math.max(Number(options?.offset) || 0, 0);

    const sql = `
      SELECT
        gs.gateway_settlement_id,
        gs.provider_name,
        gs.provider_settlement_id,
        gs.settlement_reference,
        gs.settlement_date,
        gs.currency_code,
        gs.gross_amount::float8 as gross_amount,
        gs.fee_amount::float8 as fee_amount,
        gs.tax_amount::float8 as tax_amount,
        gs.other_adjustment_amount::float8 as other_adjustment_amount,
        gs.net_settlement_amount::float8 as net_settlement_amount,
        gs.status,
        gs.reported_at,
        gs.settled_at,
        COUNT(gsi.gateway_settlement_item_id)::int as items_count
      FROM gateway_settlements gs
      LEFT JOIN gateway_settlement_items gsi ON gs.gateway_settlement_id = gsi.gateway_settlement_id
      WHERE gs.org_id = $1::uuid
      GROUP BY gs.gateway_settlement_id
      ORDER BY gs.settlement_date DESC
      LIMIT $2 OFFSET $3
    `;

    const countSql = `
      SELECT COUNT(*)::int as total
      FROM gateway_settlements
      WHERE org_id = $1::uuid
    `;

    const [countRes, rows]: any[] = await Promise.all([
      db.$queryRawUnsafe(countSql, tenantOrgId),
      db.$queryRawUnsafe(sql, tenantOrgId, limit, offset)
    ]);

    const total = countRes[0]?.total || 0;

    const summarySql = `
      SELECT
        COALESCE(SUM(gross_amount), 0)::float8 as total_gross,
        COALESCE(SUM(fee_amount), 0)::float8 as total_fees,
        COALESCE(SUM(tax_amount), 0)::float8 as total_taxes,
        COALESCE(SUM(net_settlement_amount), 0)::float8 as total_net
      FROM gateway_settlements
      WHERE org_id = $1::uuid
        AND status = 'settled'
    `;
    const summaryRes: any[] = await db.$queryRawUnsafe(summarySql, tenantOrgId);
    const s = summaryRes[0] || {};

    return {
      total,
      limit,
      offset,
      is_available: total > 0,
      summary: {
        total_gross_settled: this.roundMoney(s.total_gross),
        total_gateway_fees: this.roundMoney(s.total_fees),
        total_taxes: this.roundMoney(s.total_taxes),
        total_net_settled: this.roundMoney(s.total_net),
      },
      data: rows.map((r: any) => ({
        ...r,
        gross_amount: this.roundMoney(r.gross_amount),
        fee_amount: this.roundMoney(r.fee_amount),
        tax_amount: this.roundMoney(r.tax_amount),
        net_settlement_amount: this.roundMoney(r.net_settlement_amount)
      }))
    };
  }
}
